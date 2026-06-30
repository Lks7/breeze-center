package fetcher

import (
	"context"
	"log"
	"time"

	"github.com/breeze/center/internal/store"
)

// Scheduler 负责定时抓取所有启用的 RSS 源
type Scheduler struct {
	store    *store.RSSStore
	interval time.Duration
	timeout  time.Duration
	cancel   context.CancelFunc
}

// NewScheduler 创建调度器
func NewScheduler(store *store.RSSStore, interval, timeout time.Duration) *Scheduler {
	return &Scheduler{
		store:    store,
		interval: interval,
		timeout:  timeout,
	}
}

// Start 启动定时抓取（后台 goroutine）
func (s *Scheduler) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel

	// 启动时立即执行一次
	go s.fetchAll()

	// 定时执行
	go func() {
		ticker := time.NewTicker(s.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				s.fetchAll()
			case <-ctx.Done():
				log.Println("[RSS Scheduler] Stopped")
				return
			}
		}
	}()

	log.Printf("[RSS Scheduler] Started (interval: %v, timeout: %v)\n", s.interval, s.timeout)
}

// Stop 优雅停止调度器
func (s *Scheduler) Stop() {
	if s.cancel != nil {
		s.cancel()
	}
}

// fetchAll 抓取所有启用的 RSS 源
func (s *Scheduler) fetchAll() {
	log.Println("[RSS Scheduler] Starting fetch cycle...")

	sources, err := s.store.GetEnabledSources()
	if err != nil {
		log.Printf("[RSS Scheduler] Failed to get enabled sources: %v\n", err)
		return
	}

	if len(sources) == 0 {
		log.Println("[RSS Scheduler] No enabled sources")
		return
	}

	successCount := 0
	totalArticles := 0

	for _, source := range sources {
		inserted, err := s.fetchOne(source)
		if err != nil {
			log.Printf("[RSS Scheduler] Failed to fetch %s (%s): %v\n", source.Name, source.URL, err)
			continue
		}

		successCount++
		totalArticles += inserted
		log.Printf("[RSS Scheduler] Fetched %s: %d new articles\n", source.Name, inserted)
	}

	log.Printf("[RSS Scheduler] Fetch cycle completed: %d/%d sources succeeded, %d new articles\n",
		successCount, len(sources), totalArticles)
}

// fetchOne 抓取单个 RSS 源
func (s *Scheduler) fetchOne(source store.RSSSource) (int, error) {
	// 1. 抓取并解析 RSS
	articles, err := FetchRSS(source.URL, s.timeout)
	if err != nil {
		// 更新 last_fetched 即使失败（记录尝试过）
		_ = s.store.UpdateSourceFetchTime(source.ID, err.Error())
		return 0, err
	}

	// 2. 转换为 store.ArticleInput
	var inputs []store.ArticleInput
	for _, a := range articles {
		inputs = append(inputs, store.ArticleInput{
			SourceID:    source.ID,
			Title:       a.Title,
			URL:         a.URL,
			Excerpt:     a.Excerpt,
			PublishedAt: a.PublishedAt.Format(time.RFC3339),
		})
	}

	// 3. 批量插入（去重）
	inserted, err := s.store.InsertArticles(inputs)
	if err != nil {
		_ = s.store.UpdateSourceFetchTime(source.ID, err.Error())
		return 0, err
	}

	// 4. 更新 last_fetched（成功）
	if err := s.store.UpdateSourceFetchTime(source.ID, ""); err != nil {
		log.Printf("[RSS Scheduler] Failed to update fetch time for %s: %v\n", source.Name, err)
	}

	return inserted, nil
}

// FetchNow 立即抓取所有启用的源（供手动触发）
func (s *Scheduler) FetchNow() {
	go s.fetchAll()
}
