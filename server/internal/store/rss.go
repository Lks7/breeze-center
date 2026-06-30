package store

import (
	"database/sql"
)

// ============================================================
// RSS 源 + 文章
// ============================================================

// RSSSource 是一个 RSS 订阅源。
type RSSSource struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	URL         string `json:"url"`
	Category    string `json:"category"`
	IconColor   string `json:"icon_color"`
	Enabled     bool   `json:"enabled"`
	LastFetched string `json:"last_fetched"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// RSSArticle 是从某个 RSS 源拉取的一篇文章。
type RSSArticle struct {
	ID           string `json:"id"`
	SourceID     string `json:"source_id"`
	Title        string `json:"title"`
	URL          string `json:"url"`
	Excerpt      string `json:"excerpt"`
	PublishedAt  string `json:"published_at"`
	FetchedAt    string `json:"fetched_at"`
	Read         bool   `json:"read"`
}

// RSSStore 管理 RSS 源与文章。
type RSSStore struct{ db *sql.DB }

// NewRSSStore 构造一个 RSSStore。
func NewRSSStore(db *sql.DB) *RSSStore { return &RSSStore{db: db} }

// ListSources 返回所有未删除的订阅源。
func (s *RSSStore) ListSources() ([]RSSSource, error) {
	rows, err := s.db.Query(`
		SELECT id, name, url, category, icon_color, enabled, last_fetched, created_at, updated_at
		FROM rss_sources WHERE deleted_at='' ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []RSSSource
	for rows.Next() {
		var r RSSSource
		var enabled int
		if err := rows.Scan(&r.ID, &r.Name, &r.URL, &r.Category, &r.IconColor, &enabled, &r.LastFetched, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		r.Enabled = enabled == 1
		out = append(out, r)
	}
	return out, rows.Err()
}

// RSSSourceInput 是创建/更新源的入参。
type RSSSourceInput struct {
	Name      string `json:"name"`
	URL       string `json:"url"`
	Category  string `json:"category"`
	IconColor string `json:"icon_color"`
	Enabled   *bool  `json:"enabled"`
}

// CreateSource 新建订阅源。
func (s *RSSStore) CreateSource(in RSSSourceInput) (*RSSSource, error) {
	now := now()
	enabled := 1
	if in.Enabled != nil && !*in.Enabled {
		enabled = 0
	}
	if in.IconColor == "" {
		in.IconColor = "#38bdf8"
	}
	r := &RSSSource{
		ID: newID(), Name: in.Name, URL: in.URL, Category: in.Category,
		IconColor: in.IconColor, Enabled: enabled == 1,
		CreatedAt: now, UpdatedAt: now,
	}
	_, err := s.db.Exec(`INSERT INTO rss_sources
		(id, name, url, category, icon_color, enabled, last_fetched, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, '', ?, ?)`,
		r.ID, r.Name, r.URL, r.Category, r.IconColor, enabled, now, now)
	if err != nil {
		return nil, err
	}
	return r, nil
}

// UpdateSource 更新订阅源。
func (s *RSSStore) UpdateSource(id string, in RSSSourceInput) (*RSSSource, error) {
	enabled := 1
	if in.Enabled != nil && !*in.Enabled {
		enabled = 0
	}
	if in.IconColor == "" {
		in.IconColor = "#38bdf8"
	}
	_, err := s.db.Exec(`UPDATE rss_sources SET
		name=?, url=?, category=?, icon_color=?, enabled=?, updated_at=? WHERE id=? AND deleted_at=''`,
		in.Name, in.URL, in.Category, in.IconColor, enabled, now(), id)
	if err != nil {
		return nil, err
	}
	return s.getSource(id)
}

func (s *RSSStore) getSource(id string) (*RSSSource, error) {
	var r RSSSource
	var enabled int
	err := s.db.QueryRow(`SELECT id, name, url, category, icon_color, enabled, last_fetched, created_at, updated_at
		FROM rss_sources WHERE id=? AND deleted_at=''`, id).
		Scan(&r.ID, &r.Name, &r.URL, &r.Category, &r.IconColor, &enabled, &r.LastFetched, &r.CreatedAt, &r.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	r.Enabled = enabled == 1
	return &r, nil
}

// DeleteSource 软删除订阅源（关联文章通过外键 CASCADE 删除）。
func (s *RSSStore) DeleteSource(id string) error {
	_, err := s.db.Exec(`UPDATE rss_sources SET deleted_at=?, updated_at=? WHERE id=?`, now(), now(), id)
	return err
}

// ListArticles 返回最新文章，可按 source_id 过滤。
func (s *RSSStore) ListArticles(sourceID string, limit int) ([]RSSArticle, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	q := `SELECT id, source_id, title, url, excerpt, published_at, fetched_at, read
		FROM rss_articles`
	args := []any{}
	if sourceID != "" {
		q += ` WHERE source_id=?`
		args = append(args, sourceID)
	}
	q += ` ORDER BY published_at DESC LIMIT ?`
	args = append(args, limit)
	rows, err := s.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []RSSArticle
	for rows.Next() {
		var a RSSArticle
		var read int
		if err := rows.Scan(&a.ID, &a.SourceID, &a.Title, &a.URL, &a.Excerpt, &a.PublishedAt, &a.FetchedAt, &read); err != nil {
			return nil, err
		}
		a.Read = read == 1
		out = append(out, a)
	}
	return out, rows.Err()
}

// MarkArticleRead 标记文章已读。
func (s *RSSStore) MarkArticleRead(id string, read bool) error {
	v := 0
	if read {
		v = 1
	}
	_, err := s.db.Exec(`UPDATE rss_articles SET read=? WHERE id=?`, v, id)
	return err
}
