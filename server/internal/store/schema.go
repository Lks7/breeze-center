package store

import (
	"database/sql"
	"strings"
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
    position_x INTEGER NOT NULL DEFAULT 0,        -- 便利贴 X 坐标
    position_y INTEGER NOT NULL DEFAULT 0,        -- 便利贴 Y 坐标
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT '',        -- 完成时间
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

CREATE TABLE IF NOT EXISTS subscriptions (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    type         TEXT NOT NULL,
    provider     TEXT NOT NULL DEFAULT '',
    expire_date  TEXT NOT NULL,
    price        REAL NOT NULL DEFAULT 0,
    cycle        TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'active',
    notify_days  INTEGER NOT NULL DEFAULT 7,
    description  TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expire ON subscriptions(expire_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE TABLE IF NOT EXISTS fund_holdings (
    id                  TEXT PRIMARY KEY,
    code                TEXT NOT NULL,
    name                TEXT NOT NULL DEFAULT '',
    buy_amount          REAL NOT NULL,
    buy_nav             REAL NOT NULL,
    buy_date            TEXT NOT NULL,
    current_nav         REAL,
    shares              REAL,
    last_updated        TEXT NOT NULL DEFAULT '',
    target_profit_rate  REAL NOT NULL DEFAULT 0,
    stop_loss_rate      REAL NOT NULL DEFAULT 0,
    alert_triggered     INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    deleted_at          TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_fund_holdings_code ON fund_holdings(code);

CREATE TABLE IF NOT EXISTS fund_nav_history (
    id           TEXT PRIMARY KEY,
    holding_id   TEXT NOT NULL,
    code         TEXT NOT NULL,
    nav          REAL NOT NULL,
    recorded_at  TEXT NOT NULL,
    created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fund_nav_history_holding ON fund_nav_history(holding_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_fund_nav_history_code ON fund_nav_history(code, recorded_at);

CREATE TABLE IF NOT EXISTS check_ins (
    id         TEXT PRIMARY KEY,
    todo_id    TEXT NOT NULL,
    check_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_check_ins_todo ON check_ins(todo_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(check_date);

CREATE TABLE IF NOT EXISTS schema_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('version', '1');
`

func migrate(db *sql.DB) error {
	if _, err := db.Exec(schemaSQL); err != nil {
		return err
	}
	// 增量迁移：为已存在的表补列（CREATE TABLE IF NOT EXISTS 不会改已有表结构）。
	// 每条 ALTER 单独执行——SQLite 在多语句 Exec 中遇到第一条失败会中断后续语句，
	// 因此一旦前面的 ALTER 因“列已存在”而失败（fund_holdings 的列已在 CREATE TABLE 中定义），
	// 后面的 ALTER（如 todos 的习惯列）就永远不会执行，导致插入报错 500。
	alterStmts := []string{
		`ALTER TABLE fund_holdings ADD COLUMN target_profit_rate REAL NOT NULL DEFAULT 0`,
		`ALTER TABLE fund_holdings ADD COLUMN stop_loss_rate REAL NOT NULL DEFAULT 0`,
		`ALTER TABLE fund_holdings ADD COLUMN alert_triggered INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE todos ADD COLUMN is_habit INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE todos ADD COLUMN habit_frequency TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE todos ADD COLUMN habit_target INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE todos ADD COLUMN completed_at TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE todos ADD COLUMN position_x INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE todos ADD COLUMN position_y INTEGER NOT NULL DEFAULT 0`,
	}
	for _, stmt := range alterStmts {
		// ALTER TABLE ADD COLUMN 在列已存在时会报错，忽略这个特定错误
		if _, err := db.Exec(stmt); err != nil && !isDuplicateColumnErr(err) {
			return err
		}
	}
	return nil
}

// isDuplicateColumnErr 判断是否为 "duplicate column name" 错误（列已存在）。
func isDuplicateColumnErr(err error) bool {
	return err != nil && strings.Contains(err.Error(), "duplicate column name")
}
