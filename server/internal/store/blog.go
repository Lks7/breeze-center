package store

import (
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

// ErrNotFound 表示查询未命中。
var ErrNotFound = errors.New("not found")

// now 返回当前 ISO8601 时间字符串。
func now() string {
	return time.Now().Format(time.RFC3339)
}

// newID 生成 UUID v4。
func newID() string {
	return uuid.NewString()
}

// ============================================================
// BlogPost
// ============================================================

// BlogPost 是博客文章实体。
type BlogPost struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Excerpt     string `json:"excerpt"`
	Content     string `json:"content"`
	CoverURL    string `json:"cover_url"`
	Tags        string `json:"tags"`         // 逗号分隔
	Status      string `json:"status"`       // draft | published
	PublishedAt string `json:"published_at"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// BlogStore 管理博客文章。
type BlogStore struct{ db *sql.DB }

// NewBlogStore 构造一个 BlogStore。
func NewBlogStore(db *sql.DB) *BlogStore { return &BlogStore{db: db} }

// List 返回所有未软删除的文章，按 published_at 倒序。
func (s *BlogStore) List() ([]BlogPost, error) {
	rows, err := s.db.Query(`
		SELECT id, title, slug, excerpt, content, cover_url, tags, status, published_at, created_at, updated_at
		FROM blog_posts WHERE deleted_at = '' ORDER BY published_at DESC, created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []BlogPost
	for rows.Next() {
		var p BlogPost
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content, &p.CoverURL, &p.Tags, &p.Status, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// Get 返回单个文章。
func (s *BlogStore) Get(id string) (*BlogPost, error) {
	var p BlogPost
	err := s.db.QueryRow(`
		SELECT id, title, slug, excerpt, content, cover_url, tags, status, published_at, created_at, updated_at
		FROM blog_posts WHERE id = ? AND deleted_at = ''`, id).
		Scan(&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content, &p.CoverURL, &p.Tags, &p.Status, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// CreateInput 是创建文章的入参。
type BlogPostInput struct {
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Excerpt     string `json:"excerpt"`
	Content     string `json:"content"`
	CoverURL    string `json:"cover_url"`
	Tags        string `json:"tags"`
	Status      string `json:"status"`
	PublishedAt string `json:"published_at"`
}

// Create 新建一篇文章。
func (s *BlogStore) Create(in BlogPostInput) (*BlogPost, error) {
	if in.Status == "" {
		in.Status = "draft"
	}
	now := now()
	p := &BlogPost{
		ID: newID(), Title: in.Title, Slug: in.Slug, Excerpt: in.Excerpt,
		Content: in.Content, CoverURL: in.CoverURL, Tags: in.Tags,
		Status: in.Status, PublishedAt: in.PublishedAt,
		CreatedAt: now, UpdatedAt: now,
	}
	_, err := s.db.Exec(`INSERT INTO blog_posts
		(id, title, slug, excerpt, content, cover_url, tags, status, published_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		p.ID, p.Title, p.Slug, p.Excerpt, p.Content, p.CoverURL, p.Tags, p.Status, p.PublishedAt, p.CreatedAt, p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

// Update 更新文章（全量替换非空字段）。
func (s *BlogStore) Update(id string, in BlogPostInput) (*BlogPost, error) {
	_, err := s.db.Exec(`UPDATE blog_posts SET
		title=?, slug=?, excerpt=?, content=?, cover_url=?, tags=?, status=?, published_at=?, updated_at=?
		WHERE id=? AND deleted_at=''`,
		in.Title, in.Slug, in.Excerpt, in.Content, in.CoverURL, in.Tags, in.Status, in.PublishedAt, now(), id)
	if err != nil {
		return nil, err
	}
	return s.Get(id)
}

// Delete 软删除文章。
func (s *BlogStore) Delete(id string) error {
	_, err := s.db.Exec(`UPDATE blog_posts SET deleted_at=?, updated_at=? WHERE id=?`, now(), now(), id)
	return err
}
