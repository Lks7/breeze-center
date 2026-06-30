// Package main 是 breeze-center 后端服务的入口。
//
// 启动流程：
//  1. 加载 config/ 下的 TOML 配置（服务模板）
//  2. 打开 SQLite 数据库并执行 schema 迁移
//  3. 构造服务注册表 + 各实体 store
//  4. 注册 chi 路由（公开 API + admin CRUD API）与中间件
//  5. 启动 HTTP server
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/breeze/center/internal/config"
	"github.com/breeze/center/internal/handler"
	"github.com/breeze/center/internal/middleware"
	"github.com/breeze/center/internal/service"
	"github.com/breeze/center/internal/store"
)

func main() {
	configDir := flag.String("config", "../config", "path to config directory")
	dataDir := flag.String("data", "../data", "path to data directory (SQLite db)")
	flag.Parse()

	// 1. 加载 TOML 配置
	loader := config.NewLoader(*configDir)
	site, merged, err := loader.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}
	log.Printf("loaded %d service templates from %s", len(merged), *configDir)

	// 2. 打开 SQLite
	if err := os.MkdirAll(*dataDir, 0o755); err != nil {
		log.Fatalf("create data dir: %v", err)
	}
	dbPath := filepath.Join(*dataDir, "breeze.db")
	db, err := store.Open(dbPath)
	if err != nil {
		log.Fatalf("open sqlite: %v", err)
	}
	defer db.Close()
	log.Printf("sqlite ready at %s", dbPath)

	// 3. 构造注册表与 store
	registry := service.NewRegistry(merged)

	blogStore := store.NewBlogStore(db)
	rssStore := store.NewRSSStore(db)
	bookmarkStore := store.NewBookmarkStore(db)
	todoStore := store.NewTodoStore(db)
	serviceStore := store.NewServiceStore(db)

	// 4. 路由
	r := chi.NewRouter()
	r.Use(middleware.CORS(site.Server.CORSOrigins))
	r.Use(middleware.RequestLogger)

	r.Route("/api", func(r chi.Router) {
		// 公开端点（首页消费）
		r.Get("/health", handler.Health)

		r.Route("/v1", func(r chi.Router) {
			// 只读服务接口（来自 TOML 模板）
			svcH := handler.NewServicesHandler(registry)
			r.Get("/services", svcH.List)
			r.Get("/services/categories", svcH.Categories)
			r.Get("/services/{id}", svcH.Get)

			widH := handler.NewWidgetsHandler(registry)
			r.Get("/widgets", widH.List)
			r.Get("/widgets/data", widH.Data)

			// 古诗代理（外部 API 透传 + 字段精简）
			poetryH := handler.NewPoetryHandler()
			r.Get("/poetry/random", poetryH.Random)

			// 管理端 CRUD（动态内容存 SQLite）
			r.Route("/admin", func(r chi.Router) {
				// 博客
				blogH := handler.NewBlogHandler(blogStore)
				r.Get("/blog/posts", blogH.List)
				r.Post("/blog/posts", blogH.Create)
				r.Get("/blog/posts/{id}", blogH.Get)
				r.Put("/blog/posts/{id}", blogH.Update)
				r.Delete("/blog/posts/{id}", blogH.Delete)

				// RSS
				rssH := handler.NewRSSHandler(rssStore)
				r.Get("/rss/sources", rssH.ListSources)
				r.Post("/rss/sources", rssH.CreateSource)
				r.Put("/rss/sources/{id}", rssH.UpdateSource)
				r.Delete("/rss/sources/{id}", rssH.DeleteSource)
				r.Get("/rss/articles", rssH.ListArticles)
				r.Patch("/rss/articles/{id}", rssH.MarkArticleRead)

				// 书签
				bmH := handler.NewBookmarkHandler(bookmarkStore)
				r.Get("/bookmarks", bmH.List)
				r.Post("/bookmarks", bmH.Create)
				r.Put("/bookmarks/{id}", bmH.Update)
				r.Delete("/bookmarks/{id}", bmH.Delete)

				// 待办
				todoH := handler.NewTodoHandler(todoStore)
				r.Get("/todos", todoH.List)
				r.Post("/todos", todoH.Create)
				r.Put("/todos/{id}", todoH.Update)
				r.Patch("/todos/{id}/toggle", todoH.ToggleDone)
				r.Delete("/todos/{id}", todoH.Delete)

				// 服务实例（动态）
				svcAdminH := handler.NewServiceAdminHandler(serviceStore)
				r.Get("/services", svcAdminH.List)
				r.Post("/services", svcAdminH.Create)
				r.Put("/services/{id}", svcAdminH.Update)
				r.Delete("/services/{id}", svcAdminH.Delete)
			})
		})
	})

	// 根路径信息
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "breeze-center API v0.1.0 — %d templates, SQLite ready", len(merged))
	})

	addr := fmt.Sprintf(":%d", site.Server.Port)
	srv := &http.Server{
		Addr:              addr,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// 5. 优雅启停
	go func() {
		log.Printf("breeze-center API listening on http://localhost%s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	log.Println("shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("forced shutdown: %v", err)
	}
	log.Println("bye")
}
