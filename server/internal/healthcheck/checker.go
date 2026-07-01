package healthcheck

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"
)

// Service 表示需要健康检查的服务
type Service struct {
	ID  string
	URL string
}

// Result 健康检查结果
type Result struct {
	ID       string
	Status   string // "active" | "error"
	Latency  int64  // 毫秒
	Error    string
	CheckedAt time.Time
}

// Checker 健康检查器
type Checker struct {
	db       *sql.DB
	client   *http.Client
	interval time.Duration
	cancel   context.CancelFunc
}

// NewChecker 创建健康检查器
func NewChecker(db *sql.DB, interval time.Duration) *Checker {
	return &Checker{
		db: db,
		client: &http.Client{
			Timeout: 10 * time.Second, // HTTP 超时 10 秒
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse // 不自动跟随重定向
			},
		},
		interval: interval,
	}
}

// Start 启动健康检查调度器（后台 goroutine）
func (c *Checker) Start(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	c.cancel = cancel

	// 立即执行一次
	c.checkAll(ctx)

	// 定时执行
	ticker := time.NewTicker(c.interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				log.Println("[HealthCheck] Scheduler stopped")
				return
			case <-ticker.C:
				c.checkAll(ctx)
			}
		}
	}()

	log.Printf("[HealthCheck] Scheduler started (interval: %v)", c.interval)
}

// Stop 停止健康检查调度器
func (c *Checker) Stop() {
	if c.cancel != nil {
		c.cancel()
	}
}

// checkAll 检查所有启用的服务
func (c *Checker) checkAll(ctx context.Context) {
	services, err := c.getActiveServices()
	if err != nil {
		log.Printf("[HealthCheck] Failed to get services: %v", err)
		return
	}

	if len(services) == 0 {
		return
	}

	log.Printf("[HealthCheck] Checking %d service(s)...", len(services))

	for _, svc := range services {
		select {
		case <-ctx.Done():
			return
		default:
			result := c.check(svc)
			if err := c.updateServiceStatus(result); err != nil {
				log.Printf("[HealthCheck] Failed to update service %s: %v", svc.ID, err)
			} else {
				log.Printf("[HealthCheck] %s → %s (latency: %dms)", svc.URL, result.Status, result.Latency)
			}
		}
	}
}

// getActiveServices 从数据库获取所有需要检查的服务
func (c *Checker) getActiveServices() ([]Service, error) {
	query := `
		SELECT id, url 
		FROM services 
		WHERE deleted_at = '' 
		  AND url != ''
		  AND status != 'inactive'
		ORDER BY sort_order
	`
	rows, err := c.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []Service
	for rows.Next() {
		var svc Service
		if err := rows.Scan(&svc.ID, &svc.URL); err != nil {
			return nil, err
		}
		services = append(services, svc)
	}

	return services, rows.Err()
}

// check 执行单个服务的健康检查
func (c *Checker) check(svc Service) Result {
	result := Result{
		ID:        svc.ID,
		CheckedAt: time.Now(),
	}

	start := time.Now()
	resp, err := c.client.Get(svc.URL)
	latency := time.Since(start).Milliseconds()

	if err != nil {
		result.Status = "error"
		result.Error = err.Error()
		result.Latency = 0
		// 记录详细错误日志
		log.Printf("[HealthCheck] %s failed: %v", svc.URL, err)
		return result
	}
	defer resp.Body.Close()

	result.Latency = latency

	// HTTP 2xx/3xx 认为是健康
	if resp.StatusCode >= 200 && resp.StatusCode < 400 {
		result.Status = "active"
	} else {
		result.Status = "error"
		result.Error = resp.Status
		log.Printf("[HealthCheck] %s returned %s", svc.URL, resp.Status)
	}

	return result
}

// updateServiceStatus 将健康检查结果写入数据库
func (c *Checker) updateServiceStatus(result Result) error {
	query := `
		UPDATE services 
		SET status = ?, 
		    updated_at = ?
		WHERE id = ?
	`
	_, err := c.db.Exec(query, result.Status, result.CheckedAt.Format(time.RFC3339), result.ID)
	return err
}
