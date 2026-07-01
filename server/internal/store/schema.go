package store

import (
	"database/sql"
)

// migrate 在启动时创建所有表（IF NOT EXISTS，可重复执行）。
//
// 表设计说明：
//   - 主键统一用 TEXT（UUID），避免暴露行数与自增规律
//   - 时间字段用 TEXT 存 ISO8601，SQLite 原生支持比较与排序
//   - 软删除用 deleted_at，便于后续恢复与审计
//   - 关联字段（如 rss_articles.source_id）建索引加速查询
const schemaSQL = `
CREATE TABLE IF NOT EXISTS blog_posts (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    slug         TEXT UNIQUE NOT NULL,
    excerpt      TEXT NOT NULL DEFAULT '',
    content      TEXT NOT NULL DEFAULT '',
    cover_url    TEXT NOT NULL DEFAULT '',
    tags         TEXT NOT NULL DEFAULT '',        -- 逗号分隔
    status       TEXT NOT NULL DEFAULT 'draft',   -- draft | published
    published_at TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    deleted_at   TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS rss_sources (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    url          TEXT UNIQUE NOT NULL,
    category     TEXT NOT NULL DEFAULT '',
    icon_color   TEXT NOT NULL DEFAULT '#38bdf8',
    enabled      INTEGER NOT NULL DEFAULT 1,
    last_fetched TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    deleted_at   TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS rss_articles (
    id           TEXT PRIMARY KEY,
    source_id    TEXT NOT NULL,
    title        TEXT NOT NULL,
    url          TEXT NOT NULL,
    excerpt      TEXT NOT NULL DEFAULT '',
    published_at TEXT NOT NULL DEFAULT '',
    fetched_at   TEXT NOT NULL,
    read         INTEGER NOT NULL DEFAULT 0,
    UNIQUE(source_id, url),
    FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_rss_articles_source ON rss_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_rss_articles_published ON rss_articles(published_at DESC);

CREATE TABLE IF NOT EXISTS bookmarks (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT 'general',
    icon        TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_category ON bookmarks(category);

CREATE TABLE IF NOT EXISTS todos (
    id         TEXT PRIMARY KEY,
    text       TEXT NOT NULL,
    done       INTEGER NOT NULL DEFAULT 0,
    priority   TEXT NOT NULL DEFAULT 'medium',   -- high | medium | low
    due_date   TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);

CREATE TABLE IF NOT EXISTS services (
    id           TEXT PRIMARY KEY,
    base_service TEXT NOT NULL DEFAULT '',        -- 引用 TOML 中的 services/<id>.toml
    name         TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    category     TEXT NOT NULL DEFAULT 'self-hosted',
    url          TEXT NOT NULL,
    api_endpoint TEXT NOT NULL DEFAULT '',
    icon_name    TEXT NOT NULL DEFAULT 'server',
    icon_color   TEXT NOT NULL DEFAULT '#38bdf8',
    status       TEXT NOT NULL DEFAULT 'active',  -- active | inactive | error
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL,
    deleted_at   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);

CREATE TABLE IF NOT EXISTS fusion_sites (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon_color  TEXT NOT NULL DEFAULT '#38bdf8',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_fusion_sites_sort ON fusion_sites(sort_order);

CREATE TABLE IF NOT EXISTS pomodoro_records (
    id         TEXT PRIMARY KEY,
    date       TEXT NOT NULL,
    count      INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    UNIQUE(date)
);

CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL DEFAULT '',
    read       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('version', '1');
`

func migrate(db *sql.DB) error {
	_, err := db.Exec(schemaSQL)
	return err
}
