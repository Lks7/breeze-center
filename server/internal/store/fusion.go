package store

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// FusionSite 融合站点
type FusionSite struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	URL         string `json:"url"`
	Description string `json:"description"`
	IconColor   string `json:"icon_color"`
	SortOrder   int    `json:"sort_order"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// FusionSiteInput 创建/更新融合站点的输入
type FusionSiteInput struct {
	Name        string `json:"name"`
	URL         string `json:"url"`
	Description string `json:"description"`
	IconColor   string `json:"icon_color"`
	SortOrder   int    `json:"sort_order"`
}

// FusionStore 融合站点存储
type FusionStore struct {
	db *sql.DB
}

// NewFusionStore 创建融合站点存储
func NewFusionStore(db *sql.DB) *FusionStore {
	return &FusionStore{db: db}
}

// List 查询所有融合站点（排序）
func (s *FusionStore) List() ([]FusionSite, error) {
	query := `
		SELECT id, name, url, description, icon_color, sort_order, created_at, updated_at
		FROM fusion_sites
		WHERE deleted_at = ''
		ORDER BY sort_order, created_at DESC
	`
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sites []FusionSite
	for rows.Next() {
		var site FusionSite
		err := rows.Scan(
			&site.ID,
			&site.Name,
			&site.URL,
			&site.Description,
			&site.IconColor,
			&site.SortOrder,
			&site.CreatedAt,
			&site.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		sites = append(sites, site)
	}

	return sites, rows.Err()
}

// Get 根据 ID 获取单个融合站点
func (s *FusionStore) Get(id string) (*FusionSite, error) {
	query := `
		SELECT id, name, url, description, icon_color, sort_order, created_at, updated_at
		FROM fusion_sites
		WHERE id = ? AND deleted_at = ''
	`
	var site FusionSite
	err := s.db.QueryRow(query, id).Scan(
		&site.ID,
		&site.Name,
		&site.URL,
		&site.Description,
		&site.IconColor,
		&site.SortOrder,
		&site.CreatedAt,
		&site.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &site, nil
}

// Create 创建新融合站点
func (s *FusionStore) Create(input FusionSiteInput) (*FusionSite, error) {
	now := time.Now().Format(time.RFC3339)
	id := uuid.New().String()

	query := `
		INSERT INTO fusion_sites (id, name, url, description, icon_color, sort_order, created_at, updated_at, deleted_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, '')
	`
	_, err := s.db.Exec(query, id, input.Name, input.URL, input.Description, input.IconColor, input.SortOrder, now, now)
	if err != nil {
		return nil, err
	}

	return s.Get(id)
}

// Update 更新融合站点
func (s *FusionStore) Update(id string, input FusionSiteInput) (*FusionSite, error) {
	now := time.Now().Format(time.RFC3339)

	query := `
		UPDATE fusion_sites
		SET name = ?, url = ?, description = ?, icon_color = ?, sort_order = ?, updated_at = ?
		WHERE id = ? AND deleted_at = ''
	`
	result, err := s.db.Exec(query, input.Name, input.URL, input.Description, input.IconColor, input.SortOrder, now, id)
	if err != nil {
		return nil, err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}
	if rows == 0 {
		return nil, sql.ErrNoRows
	}

	return s.Get(id)
}

// Delete 软删除融合站点
func (s *FusionStore) Delete(id string) error {
	now := time.Now().Format(time.RFC3339)
	query := `UPDATE fusion_sites SET deleted_at = ? WHERE id = ? AND deleted_at = ''`
	result, err := s.db.Exec(query, now, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}
