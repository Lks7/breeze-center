package store

import (
	"database/sql"
)

// ============================================================
// Bookmark
// ============================================================

// Bookmark 是一条书签。
type Bookmark struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	URL          string `json:"url"`
	Description  string `json:"description"`
	Summary      string `json:"summary"`
	Category     string `json:"category"`
	Tags         string `json:"tags"`
	ThumbnailURL string `json:"thumbnail_url"`
	Icon         string `json:"icon"`
	SortOrder    int    `json:"sort_order"`
	LastOpenedAt string `json:"last_opened_at"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}

// BookmarkStore 管理书签。
type BookmarkStore struct{ db *sql.DB }

// NewBookmarkStore 构造一个 BookmarkStore。
func NewBookmarkStore(db *sql.DB) *BookmarkStore { return &BookmarkStore{db: db} }

// List 返回所有未删除书签，按 sort_order, created_at 排序。
func (s *BookmarkStore) List() ([]Bookmark, error) {
	rows, err := s.db.Query(`
		SELECT id, title, url, description, summary, category, tags, thumbnail_url, icon, sort_order, last_opened_at, created_at, updated_at
		FROM bookmarks WHERE deleted_at='' ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Bookmark
	for rows.Next() {
		var b Bookmark
		if err := rows.Scan(&b.ID, &b.Title, &b.URL, &b.Description, &b.Summary, &b.Category, &b.Tags, &b.ThumbnailURL, &b.Icon, &b.SortOrder, &b.LastOpenedAt, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// BookmarkInput 是创建/更新书签的入参。
type BookmarkInput struct {
	Title        string `json:"title"`
	URL          string `json:"url"`
	Description  string `json:"description"`
	Summary      string `json:"summary"`
	Category     string `json:"category"`
	Tags         string `json:"tags"`
	ThumbnailURL string `json:"thumbnail_url"`
	Icon         string `json:"icon"`
	SortOrder    int    `json:"sort_order"`
}

// Create 新建书签。
func (s *BookmarkStore) Create(in BookmarkInput) (*Bookmark, error) {
	if in.Category == "" {
		in.Category = "general"
	}
	now := now()
	b := &Bookmark{
		ID: newID(), Title: in.Title, URL: in.URL, Description: in.Description,
		Summary: in.Summary, Category: in.Category, Tags: in.Tags,
		ThumbnailURL: in.ThumbnailURL, Icon: in.Icon, SortOrder: in.SortOrder,
		CreatedAt: now, UpdatedAt: now,
	}
	_, err := s.db.Exec(`INSERT INTO bookmarks
		(id, title, url, description, summary, category, tags, thumbnail_url, icon, sort_order, last_opened_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		b.ID, b.Title, b.URL, b.Description, b.Summary, b.Category, b.Tags, b.ThumbnailURL, b.Icon, b.SortOrder, b.LastOpenedAt, now, now)
	if err != nil {
		return nil, err
	}
	return b, nil
}

// Update 更新书签。
func (s *BookmarkStore) Update(id string, in BookmarkInput) (*Bookmark, error) {
	if in.Category == "" {
		in.Category = "general"
	}
	_, err := s.db.Exec(`UPDATE bookmarks SET
		title=?, url=?, description=?, summary=?, category=?, tags=?, thumbnail_url=?, icon=?, sort_order=?, updated_at=?
		WHERE id=? AND deleted_at=''`,
		in.Title, in.URL, in.Description, in.Summary, in.Category, in.Tags, in.ThumbnailURL, in.Icon, in.SortOrder, now(), id)
	if err != nil {
		return nil, err
	}
	return s.get(id)
}

func (s *BookmarkStore) get(id string) (*Bookmark, error) {
	var b Bookmark
	err := s.db.QueryRow(`SELECT id, title, url, description, summary, category, tags, thumbnail_url, icon, sort_order, last_opened_at, created_at, updated_at
		FROM bookmarks WHERE id=? AND deleted_at=''`, id).
		Scan(&b.ID, &b.Title, &b.URL, &b.Description, &b.Summary, &b.Category, &b.Tags, &b.ThumbnailURL, &b.Icon, &b.SortOrder, &b.LastOpenedAt, &b.CreatedAt, &b.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// MarkOpened 记录书签最近一次从书签墙打开的时间。
func (s *BookmarkStore) MarkOpened(id string) (*Bookmark, error) {
	now := now()
	res, err := s.db.Exec(`UPDATE bookmarks SET last_opened_at=?, updated_at=? WHERE id=? AND deleted_at=''`, now, now, id)
	if err != nil {
		return nil, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if affected == 0 {
		return nil, ErrNotFound
	}
	return s.get(id)
}

// Delete 软删除书签。
func (s *BookmarkStore) Delete(id string) error {
	_, err := s.db.Exec(`UPDATE bookmarks SET deleted_at=?, updated_at=? WHERE id=?`, now(), now(), id)
	return err
}
