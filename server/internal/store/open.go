// Package store 提供 SQLite 持久化与各实体的 CRUD 操作。
//
// 设计要点：
//   - 使用 modernc.org/sqlite（纯 Go，无 cgo 依赖，跨平台编译零负担）
//   - 启动时自动执行 schema 迁移（CREATE TABLE IF NOT EXISTS）
//   - 每个实体一个独立的 store 文件，便于维护
//   - 所有 store 共享一个 *sql.DB 连接（SQLite 单写多读模型）
package store

import (
	"database/sql"
	"fmt"

	// 注册 modernc.org/sqlite 驱动（纯 Go，无 cgo）
	_ "modernc.org/sqlite"
)

// Open 打开（或创建）SQLite 数据库并执行 schema 迁移。
// dsn 形如 "data/breeze.db" 或 ":memory:"。
func Open(dsn string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	// SQLite 优化参数
	pragmas := []string{
		"PRAGMA journal_mode=WAL;",   // 写入不阻塞读
		"PRAGMA synchronous=NORMAL;", // 兼顾性能与安全
		"PRAGMA foreign_keys=ON;",    // 启用外键约束
		"PRAGMA busy_timeout=5000;",  // 锁等待 5s
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			return nil, fmt.Errorf("exec pragma %q: %w", p, err)
		}
	}

	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	return db, nil
}
