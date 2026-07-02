package fetcher

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/breeze/center/internal/store"
)

// ============================================================
// 基金净值定时抓取调度器
//
// 设计：
//   - 每个交易日 15:30（北京时间）自动抓取所有持仓的最新净值
//   - 周末（周六/周日）跳过 —— A 股基金周末不更新净值
//   - 节假日暂不处理（节假日数据会在下一个交易日补上）
//   - 启动时如果当天 15:30 已过且当天还没抓过，立即补抓一次
//
// 每次抓取后：store.UpdateCurrentNav 会自动写入 fund_nav_history；
// checkAlertForHolding 负责止盈止损预警检查 + 推送通知。
// ============================================================

// FundScheduler 基金净值定时抓取调度器。
type FundScheduler struct {
	store  *store.FundStore
	notif  *store.NotificationStore
	cancel context.CancelFunc
}

// NewFundScheduler 构造调度器。notif 可为 nil。
func NewFundScheduler(fundStore *store.FundStore, notifStore *store.NotificationStore) *FundScheduler {
	return &FundScheduler{store: fundStore, notif: notifStore}
}

// Start 启动调度器。
func (s *FundScheduler) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	s.cancel = cancel

	go s.checkStartupCatchUp()

	// 每分钟检查一次是否到了 15:30
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				s.maybeFetch()
			case <-ctx.Done():
				log.Println("[Fund Scheduler] Stopped")
				return
			}
		}
	}()

	log.Println("[Fund Scheduler] Started (daily at 15:30 CST on trading days)")
}

// Stop 优雅停止。
func (s *FundScheduler) Stop() {
	if s.cancel != nil {
		s.cancel()
	}
}

// maybeFetch 检查当前时间是否满足抓取条件，满足则执行。
func (s *FundScheduler) maybeFetch() {
	now := time.Now()

	if weekday := now.Weekday(); weekday == time.Saturday || weekday == time.Sunday {
		return
	}

	// 只在 15:30-15:31 这一分钟窗口内触发
	if now.Hour() != 15 || now.Minute() != 30 {
		return
	}

	if s.alreadyFetchedToday() {
		return
	}

	log.Println("[Fund Scheduler] Triggering daily NAV fetch (15:30)...")
	s.fetchAll()
}

// checkStartupCatchUp 启动时检查：交易日且 15:30 已过但当天还没抓过，补抓一次。
func (s *FundScheduler) checkStartupCatchUp() {
	now := time.Now()
	if weekday := now.Weekday(); weekday == time.Saturday || weekday == time.Sunday {
		return
	}
	if now.Hour() < 15 || (now.Hour() == 15 && now.Minute() < 30) {
		return
	}
	if s.alreadyFetchedToday() {
		return
	}
	log.Println("[Fund Scheduler] Startup catch-up: fetching today's NAV...")
	s.fetchAll()
}

// alreadyFetchedToday 检查所有持仓的 last_updated 是否都是今天。
func (s *FundScheduler) alreadyFetchedToday() bool {
	holdings, err := s.store.ListHoldings()
	if err != nil || len(holdings) == 0 {
		return true
	}
	today := time.Now().Format("2006-01-02")
	for _, h := range holdings {
		if len(h.LastUpdated) < 10 || h.LastUpdated[:10] != today {
			return false
		}
	}
	return true
}

// fetchAll 抓取所有持仓的最新净值。
func (s *FundScheduler) fetchAll() {
	holdings, err := s.store.ListHoldings()
	if err != nil {
		log.Printf("[Fund Scheduler] ListHoldings failed: %v\n", err)
		return
	}
	if len(holdings) == 0 {
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	updated := 0

	for _, ho := range holdings {
		info, err := FetchFundNav(ho.Code)
		if err != nil {
			log.Printf("[Fund Scheduler] Fetch %s failed: %v\n", ho.Code, err)
			continue
		}
		if info.IsNotFound {
			log.Printf("[Fund Scheduler] %s: fund code not found\n", ho.Code)
			continue
		}

		if err := s.store.UpdateCurrentNav(ho.ID, info.Nav, now); err != nil {
			log.Printf("[Fund Scheduler] UpdateCurrentNav %s failed: %v\n", ho.Code, err)
			continue
		}

		// 同步基金名称
		if info.Name != "" && info.Name != ho.Name {
			ho.Name = info.Name
			ho.UpdatedAt = now
			_ = s.store.UpdateHolding(&ho)
		}

		// 预警检查
		profitRate := 0.0
		if ho.BuyNav > 0 {
			profitRate = (info.Nav - ho.BuyNav) / ho.BuyNav
		}
		s.checkAlertForHolding(ho, profitRate)

		updated++
	}

	log.Printf("[Fund Scheduler] Fetch completed: %d/%d updated\n", updated, len(holdings))
}

// checkAlertForHolding 止盈止损预警检查。
func (s *FundScheduler) checkAlertForHolding(ho store.FundHolding, profitRate float64) {
	if ho.AlertTriggered {
		return
	}

	var title, msg string

	if ho.TargetProfitRate > 0 && profitRate >= ho.TargetProfitRate {
		title = "基金止盈提醒"
		msg = fmt.Sprintf("%s（%s）收益率已达 %.2f%%，超过止盈线 %.2f%%",
			ho.Name, ho.Code, profitRate*100, ho.TargetProfitRate*100)
	} else if stopRate := normalizeStopRate(ho.StopLossRate); stopRate < 0 && profitRate <= stopRate {
		title = "基金止损提醒"
		msg = fmt.Sprintf("%s（%s）收益率已跌至 %.2f%%，跌破止损线 %.2f%%",
			ho.Name, ho.Code, profitRate*100, stopRate*100)
	} else {
		return
	}

	if s.notif != nil {
		s.notif.Push("fund", title, msg)
	}
	_ = s.store.MarkAlertTriggered(ho.ID)
	log.Printf("[Fund Scheduler] Alert triggered: %s - %s\n", ho.Code, title)
}

// normalizeStopRate 允许用户输入正数表示"跌 X%"，内部统一转负数。
func normalizeStopRate(r float64) float64 {
	if r > 0 {
		return -r
	}
	return r
}
