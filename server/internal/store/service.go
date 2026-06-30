package store

import (
	"database/sql"
)

// ============================================================
// Service（动态实例，覆盖/补充 TOML 模板）
// ============================================================

// ServiceEntry 是数据库存储的服务实例。
// 与 TOML 中的 providers/personal/*.toml 对应，但可在管理后台动态增删。
type ServiceEntry struct {
	ID          string `json:"id"`
	BaseService string `json:"base_service"` // 引用 TOML 中的 services/<id>.toml，空则纯数据库实例
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	URL         string `json:"url"`
	APIEndpoint string `json:"api_endpoint"`
	IconName    string `json:"icon_name"`
	IconColor   string `json:"icon_color"`
	Status      string `json:"status"` // active | inactive | error
	SortOrder   int    `json:"sort_order"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// ServiceStore 管理服务实例。
type ServiceStore struct{ db *sql.DB }

// NewServiceStore 构造一个 ServiceStore。
func NewServiceStore(db *sql.DB) *ServiceStore { return &ServiceStore{db: db} }

// List 返回所有未删除服务，按 category, sort_order 排序。
func (s *ServiceStore) List() ([]ServiceEntry, error) {
	rows, err := s.db.Query(`
		SELECT id, base_service, name, description, category, url, api_endpoint, icon_name, icon_color, status, sort_order, created_at, updated_at
		FROM services WHERE deleted_at='' ORDER BY category ASC, sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ServiceEntry
	for rows.Next() {
		var e ServiceEntry
		if err := rows.Scan(&e.ID, &e.BaseService, &e.Name, &e.Description, &e.Category, &e.URL, &e.APIEndpoint, &e.IconName, &e.IconColor, &e.Status, &e.SortOrder, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

// ServiceInput 是创建/更新的入参。
type ServiceInput struct {
	BaseService string `json:"base_service"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	URL         string `json:"url"`
	APIEndpoint string `json:"api_endpoint"`
	IconName    string `json:"icon_name"`
	IconColor   string `json:"icon_color"`
	Status      string `json:"status"`
	SortOrder   int    `json:"sort_order"`
}

// Create 新建服务实例。
func (s *ServiceStore) Create(in ServiceInput) (*ServiceEntry, error) {
	if in.Category == "" {
		in.Category = "self-hosted"
	}
	if in.IconName == "" {
		in.IconName = "server"
	}
	if in.IconColor == "" {
		in.IconColor = "#38bdf8"
	}
	if in.Status == "" {
		in.Status = "active"
	}
	now := now()
	e := &ServiceEntry{
		ID: newID(), BaseService: in.BaseService, Name: in.Name, Description: in.Description,
		Category: in.Category, URL: in.URL, APIEndpoint: in.APIEndpoint,
		IconName: in.IconName, IconColor: in.IconColor, Status: in.Status,
		SortOrder: in.SortOrder, CreatedAt: now, UpdatedAt: now,
	}
	_, err := s.db.Exec(`INSERT INTO services
		(id, base_service, name, description, category, url, api_endpoint, icon_name, icon_color, status, sort_order, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		e.ID, e.BaseService, e.Name, e.Description, e.Category, e.URL, e.APIEndpoint, e.IconName, e.IconColor, e.Status, e.SortOrder, now, now)
	if err != nil {
		return nil, err
	}
	return e, nil
}

// Update 更新服务实例。
func (s *ServiceStore) Update(id string, in ServiceInput) (*ServiceEntry, error) {
	if in.Category == "" {
		in.Category = "self-hosted"
	}
	if in.IconName == "" {
		in.IconName = "server"
	}
	if in.IconColor == "" {
		in.IconColor = "#38bdf8"
	}
	if in.Status == "" {
		in.Status = "active"
	}
	_, err := s.db.Exec(`UPDATE services SET
		base_service=?, name=?, description=?, category=?, url=?, api_endpoint=?, icon_name=?, icon_color=?, status=?, sort_order=?, updated_at=?
		WHERE id=? AND deleted_at=''`,
		in.BaseService, in.Name, in.Description, in.Category, in.URL, in.APIEndpoint, in.IconName, in.IconColor, in.Status, in.SortOrder, now(), id)
	if err != nil {
		return nil, err
	}
	return s.get(id)
}

func (s *ServiceStore) get(id string) (*ServiceEntry, error) {
	var e ServiceEntry
	err := s.db.QueryRow(`SELECT id, base_service, name, description, category, url, api_endpoint, icon_name, icon_color, status, sort_order, created_at, updated_at
		FROM services WHERE id=? AND deleted_at=''`, id).
		Scan(&e.ID, &e.BaseService, &e.Name, &e.Description, &e.Category, &e.URL, &e.APIEndpoint, &e.IconName, &e.IconColor, &e.Status, &e.SortOrder, &e.CreatedAt, &e.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
}

// Delete 软删除服务实例。
func (s *ServiceStore) Delete(id string) error {
	_, err := s.db.Exec(`UPDATE services SET deleted_at=?, updated_at=? WHERE id=?`, now(), now(), id)
	return err
}
