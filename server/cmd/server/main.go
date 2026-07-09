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
	"github.com/breeze/center/internal/fetcher"
	"github.com/breeze/center/internal/handler"
	"github.com/breeze/center/internal/healthcheck"
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

	// 构造服务注册表（初始）
	registry := service.NewRegistry(merged)

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

	// 3. 构造 store
	blogStore := store.NewBlogStore(db)
	rssStore := store.NewRSSStore(db)
	bookmarkStore := store.NewBookmarkStore(db)
	todoStore := store.NewTodoStore(db)
	serviceStore := store.NewServiceStore(db)
	fusionStore := store.NewFusionStore(db)
	pomodoroStore := store.NewPomodoroStore(db)
	checkInStore := store.NewCheckInStore(db)
	notifStore := store.NewNotificationStore(db)
	settingsStore := store.NewSettingsStore(db)
	subscriptionStore := store.NewSubscriptionStore(db)
	fundStore := store.NewFundStore(db)

	// 3.5. 启动配置热重载监听器
	configWatcher, err := config.NewWatcher(loader, func(newSite *config.SiteConfig, newServices []config.MergedService) {
		// 配置变更回调：更新服务注册表
		registry.ReloadFromMerged(newServices)
		log.Printf("[ConfigWatcher] Registry updated: %d services", len(newServices))
	})
	if err != nil {
		log.Fatalf("create config watcher: %v", err)
	}
	if err := configWatcher.Start(); err != nil {
		log.Fatalf("start config watcher: %v", err)
	}
	defer configWatcher.Stop()

	// 4. 启动 RSS 调度器
	rssScheduler := fetcher.NewScheduler(rssStore, 30*time.Minute, 10*time.Second)
	rssScheduler.Start()
	defer rssScheduler.Stop()
	log.Println("RSS scheduler started (interval: 30m, timeout: 10s)")

	// 4.5. 启动基金净值定时抓取调度器（交易日 15:30 自动抓取 + 预警检查）
	fundScheduler := fetcher.NewFundScheduler(fundStore, notifStore)
	fundScheduler.Start()
	defer fundScheduler.Stop()

	// 5. 启动订阅到期检查（每天检查一次）
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		// 启动时立即检查一次
		checkExpiringSubscriptions(subscriptionStore, notifStore)
		for range ticker.C {
			checkExpiringSubscriptions(subscriptionStore, notifStore)
		}
	}()

	// 6. 启动健康检查调度器
	healthChecker := healthcheck.NewChecker(db, 5*time.Minute) // 每 5 分钟检查一次
	ctx := context.Background()
	healthChecker.Start(ctx)
	defer healthChecker.Stop()
	log.Println("Health check scheduler started (interval: 5m)")

	// 6. 路由
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

			// 番茄钟与通知（公开）
			pomodoroH := handler.NewPomodoroHandler(pomodoroStore)
			pomodoroH.Register(r)
			notifH := handler.NewNotificationHandler(notifStore)
			notifH.Register(r)

			// 习惯打卡（公开）
			checkInH := handler.NewCheckInHandler(todoStore, checkInStore)
			checkInH.Register(r)

			// 用户设置（公开）
			settingsH := handler.NewSettingsHandler(settingsStore)
			settingsH.Register(r)

			// GitHub 数据接口（公开）
			githubH := handler.NewGitHubHandler("Lks7", "") // 用户名：Lks7，无 Token
			r.Get("/github/user", githubH.GetUser)
			r.Get("/github/repos", githubH.GetRepos)
			r.Get("/github/popular", githubH.GetPopularRepos)
			r.Get("/github/events", githubH.GetEvents)

			// 订阅管理公开端点
			subH := handler.NewSubscriptionHandler(subscriptionStore)
			subH.RegisterPublic(r)

			// 管理端 CRUD（动态内容存 SQLite）
			r.Route("/admin", func(r chi.Router) {
				// 订阅管理（admin路由）
				subH.Register(r)

				// 博客
				blogH := handler.NewBlogHandler(blogStore)
				r.Get("/blog/posts", blogH.List)
				r.Post("/blog/posts", blogH.Create)
				r.Get("/blog/posts/{id}", blogH.Get)
				r.Put("/blog/posts/{id}", blogH.Update)
				r.Delete("/blog/posts/{id}", blogH.Delete)

				// RSS
				rssH := handler.NewRSSHandler(rssStore, rssScheduler)
				r.Get("/rss/sources", rssH.ListSources)
				r.Post("/rss/sources", rssH.CreateSource)
				r.Put("/rss/sources/{id}", rssH.UpdateSource)
				r.Delete("/rss/sources/{id}", rssH.DeleteSource)
				r.Get("/rss/articles", rssH.ListArticles)
				r.Patch("/rss/articles/{id}", rssH.MarkArticleRead)
				r.Post("/rss/fetch", rssH.FetchNow) // 手动触发抓取

				// 基金持仓
				// v1.2: notifStore 用于止盈止损预警推送
				fundH := handler.NewFundHandler(fundStore, notifStore)
				r.Get("/fund/holdings", fundH.ListHoldings)
				r.Post("/fund/holdings", fundH.CreateHolding)
				r.Put("/fund/holdings/{id}", fundH.UpdateHolding)
				r.Delete("/fund/holdings/{id}", fundH.DeleteHolding)
				r.Post("/fund/update-navs", fundH.UpdateNavs)                 // 批量更新净值（写历史+预警）
				r.Post("/fund/holdings/{id}/update-nav", fundH.UpdateOneNav)  // 单条更新净值
				r.Get("/fund/holdings/{id}/history", fundH.GetHoldingHistory) // 单只净值历史
				r.Get("/fund/history", fundH.GetAllHistory)                   // 全部净值历史汇总
				r.Get("/fund/summary", fundH.GetSummary)                      // 总盈亏统计
				r.Get("/fund/daily-profit", fundH.GetDailyProfit)             // 每日盈亏

				// 书签
				bmH := handler.NewBookmarkHandler(bookmarkStore)
				r.Get("/bookmarks", bmH.List)
				r.Post("/bookmarks", bmH.Create)
				r.Put("/bookmarks/{id}", bmH.Update)
				r.Patch("/bookmarks/{id}/open", bmH.MarkOpened)
				r.Delete("/bookmarks/{id}", bmH.Delete)

				// 待办
				todoH := handler.NewTodoHandler(todoStore)
				r.Get("/todos", todoH.List)
				r.Get("/todos/completed-dates", todoH.ListCompletedDates)
				r.Post("/todos", todoH.Create)
				r.Put("/todos/{id}", todoH.Update)
				r.Patch("/todos/{id}/toggle", todoH.ToggleDone)
				r.Patch("/todos/{id}/position", todoH.UpdatePosition)
				r.Delete("/todos/{id}", todoH.Delete)

				// 服务实例（动态）
				svcAdminH := handler.NewServiceAdminHandler(serviceStore)
				r.Get("/services", svcAdminH.List)
				r.Post("/services", svcAdminH.Create)
				r.Put("/services/{id}", svcAdminH.Update)
				r.Delete("/services/{id}", svcAdminH.Delete)

				// 融合站点
				fusionH := handler.NewFusionHandler(fusionStore)
				r.Get("/fusion", fusionH.List)
				r.Post("/fusion", fusionH.Create)
				r.Get("/fusion/{id}", fusionH.Get)
				r.Put("/fusion/{id}", fusionH.Update)
				r.Delete("/fusion/{id}", fusionH.Delete)
			})
		})
	})

	// SPA 静态文件服务
	fs := http.FileServer(http.Dir("/app/web/dist"))
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		if _, err := os.Stat("/app/web/dist" + r.URL.Path); os.IsNotExist(err) {
			http.ServeFile(w, r, "/app/web/dist/index.html")
			return
		}
		fs.ServeHTTP(w, r)
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

	// 7. 优雅启停
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

func checkExpiringSubscriptions(subStore *store.SubscriptionStore, notifStore *store.NotificationStore) {
	subs, err := subStore.GetExpiring(30)
	if err != nil {
		log.Printf("check expiring subscriptions: %v", err)
		return
	}
	for _, sub := range subs {
		days := int(time.Until(parseDateOrZero(sub.ExpireDate)).Hours() / 24)
		if days < 0 {
			notifStore.Push("subscription", "订阅已过期",
				fmt.Sprintf("%s 已过期", sub.Name))
		} else if days <= sub.NotifyDays {
			notifStore.Push("subscription", "订阅即将到期",
				fmt.Sprintf("%s 将在 %d 天后到期", sub.Name, days))
		}
	}
}

func parseDateOrZero(s string) time.Time {
	t, _ := time.Parse("2006-01-02", s[:10])
	return t
}
