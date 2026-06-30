package store

import (
	"database/sql"
)

// ============================================================
// Bookmark
// ============================================================

// Bookmark 是一条书签。
type Bookmark struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Icon        string `json:"icon"`
	SortOrder   int    `json:"sort_order"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// BookmarkStore 管理书签。
type BookmarkStore struct{ db *sql.DB }

// NewBookmarkStore 构造一个 BookmarkStore。
func NewBookmarkStore(db *sql.DB) *BookmarkStore { return &BookmarkStore{db: db} }

// List 返回所有未删除书签，按 sort_order, created_at 排序。
func (s *BookmarkStore) List() ([]Bookmark, error) {
	rows, err := s.db.Query(`
		SELECT id, title, url, description, category, icon, sort_order, created_at, updated_at
		FROM bookmarks WHERE deleted_at='' ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Bookmark
	for rows.Next() {
		var b Bookmark
		if err := rows.Scan(&b.ID, &b.Title, &b.URL, &b.Description, &b.Category, &b.Icon, &b.SortOrder, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// BookmarkInput 是创建/更新书签的入参。
type BookmarkInput struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Icon        string `json:"icon"`
	SortOrder   int    `json:"sort_order"`
}

// Create 新建书签。
func (s *BookmarkStore) Create(in BookmarkInput) (*Bookmark, error) {
	if in.Category == "" {
		in.Category = "general"
	}
	now := now()
	b := &Bookmark{
		ID: newID(), Title: in.Title, URL: in.URL, Description: in.Description,
		Category: in.Category, Icon: in.Icon, SortOrder: in.SortOrder,
		CreatedAt: now, UpdatedAt: now,
	}
	_, err := s.db.Exec(`INSERT INTO bookmarks
		(id, title, url, description, category, icon, sort_order, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		b.ID, b.Title, b.URL, b.Description, b.Category, b.Icon, b.SortOrder, now, now)
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
		title=?, url=?, description=?, category=?, icon=?, sort_order=?, updated_at=?
		WHERE id=? AND deleted_at=''`,
		in.Title, in.URL, in.Description, in.Category, in.Icon, in.SortOrder, now(), id)
	if err != nil {
		return nil, err
	}
	return s.get(id)
}

func (s *BookmarkStore) get(id string) (*Bookmark, error) {
	var b Bookmark
	err := s.db.QueryRow(`SELECT id, title, url, description, category, icon, sort_order, created_at, updated_at
		FROM bookmarks WHERE id=? AND deleted_at=''`, id).
		Scan(&b.ID, &b.Title, &b.URL, &b.Description, &b.Category, &b.Icon, &b.SortOrder, &b.CreatedAt, &b.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// Delete 软删除书签。
func (s *BookmarkStore) Delete(id string) error {
	_, err := s.db.Exec(`UPDATE bookmarks SET deleted_at=?, updated_at=? WHERE id=?`, now(), now(), id)
	return err
}
