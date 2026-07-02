package store

import (
	"database/sql"

	"github.com/google/uuid"
)

// ============================================================
// 基金持仓
// ============================================================

// FundHolding 是一个基金持仓记录。
type FundHolding struct {
	ID               string  `json:"id"`
	Code             string  `json:"code"`
	Name             string  `json:"name"`
	BuyAmount        float64 `json:"buy_amount"`
	BuyNav           float64 `json:"buy_nav"`
	BuyDate          string  `json:"buy_date"`
	CurrentNav       float64 `json:"current_nav"`
	Shares           float64 `json:"shares"`
	LastUpdated      string  `json:"last_updated"`
	TargetProfitRate float64 `json:"target_profit_rate"` // 止盈收益率（小数，0.2=20%），0=未设置
	StopLossRate     float64 `json:"stop_loss_rate"`     // 止损收益率（小数，-0.1=-10%），0=未设置
	AlertTriggered   bool    `json:"alert_triggered"`    // 本轮是否已触发预警（避免重复推送）
	CreatedAt        string  `json:"created_at"`
	UpdatedAt        string  `json:"updated_at"`
}

// FundNavHistory 是一条净值历史快照。
type FundNavHistory struct {
	ID         string  `json:"id"`
	HoldingID  string  `json:"holding_id"`
	Code       string  `json:"code"`
	Nav        float64 `json:"nav"`
	RecordedAt string  `json:"recorded_at"`
	CreatedAt  string  `json:"created_at"`
}

// FundStore 管理基金持仓。
type FundStore struct{ db *sql.DB }

// NewFundStore 构造一个 FundStore。
func NewFundStore(db *sql.DB) *FundStore { return &FundStore{db: db} }

const holdingColumns = `id, code, name, buy_amount, buy_nav, buy_date,
       COALESCE(current_nav, 0), COALESCE(shares, 0),
       last_updated, COALESCE(target_profit_rate, 0), COALESCE(stop_loss_rate, 0),
       COALESCE(alert_triggered, 0), created_at, updated_at`

func scanHolding(scanner interface{ Scan(...any) error }, h *FundHolding) error {
	var alertTriggered int
	err := scanner.Scan(
		&h.ID, &h.Code, &h.Name, &h.BuyAmount, &h.BuyNav, &h.BuyDate,
		&h.CurrentNav, &h.Shares, &h.LastUpdated,
		&h.TargetProfitRate, &h.StopLossRate,
		&alertTriggered, &h.CreatedAt, &h.UpdatedAt,
	)
	h.AlertTriggered = alertTriggered != 0
	return err
}

// ListHoldings 返回所有未删除的基金持仓。
func (s *FundStore) ListHoldings() ([]FundHolding, error) {
	rows, err := s.db.Query(`
		SELECT ` + holdingColumns + `
		FROM fund_holdings WHERE deleted_at='' ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var holdings []FundHolding
	for rows.Next() {
		var h FundHolding
		if err := scanHolding(rows, &h); err != nil {
			return nil, err
		}
		holdings = append(holdings, h)
	}
	return holdings, rows.Err()
}

// GetHolding 根据ID获取单个持仓。
func (s *FundStore) GetHolding(id string) (*FundHolding, error) {
	var h FundHolding
	var alertTriggered int
	err := s.db.QueryRow(`
		SELECT `+holdingColumns+`
		FROM fund_holdings WHERE id=? AND deleted_at=''`, id).Scan(
		&h.ID, &h.Code, &h.Name, &h.BuyAmount, &h.BuyNav, &h.BuyDate,
		&h.CurrentNav, &h.Shares, &h.LastUpdated,
		&h.TargetProfitRate, &h.StopLossRate,
		&alertTriggered, &h.CreatedAt, &h.UpdatedAt)
	if err != nil {
		return nil, err
	}
	h.AlertTriggered = alertTriggered != 0
	return &h, nil
}

// CreateHolding 创建新的基金持仓。
func (s *FundStore) CreateHolding(h *FundHolding) error {
	if h.BuyNav > 0 {
		h.Shares = h.BuyAmount / h.BuyNav
	}
	_, err := s.db.Exec(`
		INSERT INTO fund_holdings (id, code, name, buy_amount, buy_nav, buy_date, shares,
		       target_profit_rate, stop_loss_rate, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		h.ID, h.Code, h.Name, h.BuyAmount, h.BuyNav, h.BuyDate, h.Shares,
		h.TargetProfitRate, h.StopLossRate, h.CreatedAt, h.UpdatedAt)
	return err
}

// UpdateCurrentNav 更新持仓的当前净值，同时写入 fund_nav_history 历史表。
func (s *FundStore) UpdateCurrentNav(id string, currentNav float64, timestamp string) error {
	// 先查出 code 用于历史记录
	var code string
	_ = s.db.QueryRow(`SELECT code FROM fund_holdings WHERE id=?`, id).Scan(&code)

	_, err := s.db.Exec(`
		UPDATE fund_holdings SET current_nav=?, last_updated=?, updated_at=?, alert_triggered=0
		WHERE id=? AND deleted_at=''`,
		currentNav, timestamp, timestamp, id)
	if err != nil {
		return err
	}

	// 写入历史（每次抓取都留一条快照）
	if code != "" {
		_, _ = s.db.Exec(`
			INSERT INTO fund_nav_history (id, holding_id, code, nav, recorded_at, created_at)
			VALUES (?, ?, ?, ?, ?, ?)`,
			uuid.NewString(), id, code, currentNav, timestamp, timestamp)
	}
	return nil
}

// UpdateHolding 更新持仓的购买信息与预警设置。
// shares 会根据新的 buy_amount / buy_nav 重新计算。
func (s *FundStore) UpdateHolding(h *FundHolding) error {
	if h.BuyNav > 0 {
		h.Shares = h.BuyAmount / h.BuyNav
	}
	_, err := s.db.Exec(`
		UPDATE fund_holdings
		SET code=?, name=?, buy_amount=?, buy_nav=?, buy_date=?, shares=?,
		    target_profit_rate=?, stop_loss_rate=?, alert_triggered=0, updated_at=?
		WHERE id=? AND deleted_at=''`,
		h.Code, h.Name, h.BuyAmount, h.BuyNav, h.BuyDate, h.Shares,
		h.TargetProfitRate, h.StopLossRate, h.UpdatedAt, h.ID)
	return err
}

// MarkAlertTriggered 标记某持仓已触发预警，避免重复推送。
func (s *FundStore) MarkAlertTriggered(id string) error {
	_, err := s.db.Exec(`UPDATE fund_holdings SET alert_triggered=1 WHERE id=?`, id)
	return err
}

// DeleteHolding 软删除持仓。
func (s *FundStore) DeleteHolding(id string, timestamp string) error {
	_, err := s.db.Exec(`UPDATE fund_holdings SET deleted_at=? WHERE id=?`, timestamp, id)
	return err
}

// ============================================================
// 净值历史
// ============================================================

// ListHistory 返回某持仓的净值历史，按时间正序。
func (s *FundStore) ListHistory(holdingID string, limit int) ([]FundNavHistory, error) {
	if limit <= 0 {
		limit = 365
	}
	rows, err := s.db.Query(`
		SELECT id, holding_id, code, nav, recorded_at, created_at
		FROM fund_nav_history
		WHERE holding_id=?
		ORDER BY recorded_at ASC
		LIMIT ?`, holdingID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []FundNavHistory
	for rows.Next() {
		var h FundNavHistory
		if err := rows.Scan(&h.ID, &h.HoldingID, &h.Code, &h.Nav, &h.RecordedAt, &h.CreatedAt); err != nil {
			return nil, err
		}
		history = append(history, h)
	}
	return history, rows.Err()
}

// ListAllHistory 返回所有持仓的净值历史汇总，按时间正序。
// 用于绘制整体累计收益曲线。
func (s *FundStore) ListAllHistory(limit int) ([]FundNavHistory, error) {
	if limit <= 0 {
		limit = 1000
	}
	rows, err := s.db.Query(`
		SELECT id, holding_id, code, nav, recorded_at, created_at
		FROM fund_nav_history
		ORDER BY recorded_at ASC
		LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []FundNavHistory
	for rows.Next() {
		var h FundNavHistory
		if err := rows.Scan(&h.ID, &h.HoldingID, &h.Code, &h.Nav, &h.RecordedAt, &h.CreatedAt); err != nil {
			return nil, err
		}
		history = append(history, h)
	}
	return history, rows.Err()
}
