package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/breeze/center/internal/fetcher"
	"github.com/breeze/center/internal/store"
	"github.com/google/uuid"
)

// ============================================================
// 基金持仓 Handler
//
// 接口清单：
//   GET    /api/v1/admin/fund/holdings                  列表（带盈亏计算）
//   POST   /api/v1/admin/fund/holdings                  新建
//   PUT    /api/v1/admin/fund/holdings/{id}             修改（含止盈止损）
//   DELETE /api/v1/admin/fund/holdings/{id}             删除
//   POST   /api/v1/admin/fund/update-navs               批量更新净值（写历史+预警检查）
//   POST   /api/v1/admin/fund/holdings/{id}/update-nav  单条更新净值
//   GET    /api/v1/admin/fund/summary                   总盈亏统计
//   GET    /api/v1/admin/fund/holdings/{id}/history     单只基金净值历史
//   GET    /api/v1/admin/fund/history                   全部净值历史汇总
// ============================================================

// FundHandler 处理基金持仓管理。
type FundHandler struct {
	store   *store.FundStore
	notif   *store.NotificationStore
}

// NewFundHandler 构造 FundHandler。
// notif 可为 nil（无通知时跳过预警推送）。
func NewFundHandler(fundStore *store.FundStore, notifStore *store.NotificationStore) *FundHandler {
	return &FundHandler{store: fundStore, notif: notifStore}
}

// FundHoldingInput 创建/修改基金持仓的输入。
type FundHoldingInput struct {
	Code             string  `json:"code"`
	Name             string  `json:"name"`
	BuyAmount        float64 `json:"buy_amount"`
	BuyNav           float64 `json:"buy_nav"`
	BuyDate          string  `json:"buy_date"`
	TargetProfitRate float64 `json:"target_profit_rate"` // 止盈率（小数，0.2=20%），0=不设置
	StopLossRate     float64 `json:"stop_loss_rate"`     // 止损率（小数，-0.1=-10%），0=不设置
}

// FundHoldingView 是返回给前端的持仓视图，包含计算字段。
type FundHoldingView struct {
	ID               string  `json:"id"`
	Code             string  `json:"code"`
	Name             string  `json:"name"`
	BuyAmount        float64 `json:"buy_amount"`
	BuyNav           float64 `json:"buy_nav"`
	BuyDate          string  `json:"buy_date"`
	CurrentNav       float64 `json:"current_nav"`
	Shares           float64 `json:"shares"`
	CurrentValue     float64 `json:"current_value"`
	Profit           float64 `json:"profit"`
	ProfitRate       float64 `json:"profit_rate"`
	LastUpdated      string  `json:"last_updated"`
	TargetProfitRate float64 `json:"target_profit_rate"`
	StopLossRate     float64 `json:"stop_loss_rate"`
	AlertTriggered   bool    `json:"alert_triggered"`
	CreatedAt        string  `json:"created_at"`
	UpdatedAt        string  `json:"updated_at"`
}

// FundSummary 总盈亏统计。
type FundSummary struct {
	TotalBuy     float64 `json:"total_buy"`
	TotalValue   float64 `json:"total_value"`
	TotalProfit  float64 `json:"total_profit"`
	TotalRate    float64 `json:"total_rate"`
	HoldingCount int     `json:"holding_count"`
	UpdatedCount int     `json:"updated_count"`
}

// FundNavHistoryView 净值历史视图。
type FundNavHistoryView struct {
	Nav        float64 `json:"nav"`
	RecordedAt string  `json:"recorded_at"`
}

// toView 将 store 层实体转换为视图，并完成盈亏计算。
func toView(h store.FundHolding) FundHoldingView {
	v := FundHoldingView{
		ID:               h.ID,
		Code:             h.Code,
		Name:             h.Name,
		BuyAmount:        h.BuyAmount,
		BuyNav:           h.BuyNav,
		BuyDate:          h.BuyDate,
		CurrentNav:       h.CurrentNav,
		Shares:           h.Shares,
		LastUpdated:      h.LastUpdated,
		TargetProfitRate: h.TargetProfitRate,
		StopLossRate:     h.StopLossRate,
		AlertTriggered:   h.AlertTriggered,
		CreatedAt:        h.CreatedAt,
		UpdatedAt:        h.UpdatedAt,
	}
	if h.CurrentNav > 0 && h.Shares > 0 {
		v.CurrentValue = h.Shares * h.CurrentNav
		v.Profit = v.CurrentValue - h.BuyAmount
		if h.BuyAmount > 0 {
			v.ProfitRate = v.Profit / h.BuyAmount
		}
	}
	return v
}

// ListHoldings GET /api/v1/admin/fund/holdings
func (h *FundHandler) ListHoldings(w http.ResponseWriter, r *http.Request) {
	holdings, err := h.store.ListHoldings()
	if err != nil {
		handleStoreError(w, err)
		return
	}
	views := make([]FundHoldingView, 0, len(holdings))
	for _, ho := range holdings {
		views = append(views, toView(ho))
	}
	writeList(w, views, len(views))
}

// CreateHolding POST /api/v1/admin/fund/holdings
func (h *FundHandler) CreateHolding(w http.ResponseWriter, r *http.Request) {
	var in FundHoldingInput
	if !decodeJSON(w, r, &in) {
		return
	}
	if msg := validateInput(in); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	holding := &store.FundHolding{
		ID:               uuid.NewString(),
		Code:             in.Code,
		Name:             in.Name,
		BuyAmount:        in.BuyAmount,
		BuyNav:           in.BuyNav,
		BuyDate:          in.BuyDate,
		TargetProfitRate: in.TargetProfitRate,
		StopLossRate:     in.StopLossRate,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := h.store.CreateHolding(holding); err != nil {
		handleStoreError(w, err)
		return
	}

	writeData(w, http.StatusCreated, toView(*holding))
}

// UpdateHolding PUT /api/v1/admin/fund/holdings/{id}
func (h *FundHandler) UpdateHolding(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	var in FundHoldingInput
	if !decodeJSON(w, r, &in) {
		return
	}
	if msg := validateInput(in); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	existing, err := h.store.GetHolding(id)
	if err != nil {
		http.Error(w, "holding not found", http.StatusNotFound)
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	existing.Code = in.Code
	existing.Name = in.Name
	existing.BuyAmount = in.BuyAmount
	existing.BuyNav = in.BuyNav
	existing.BuyDate = in.BuyDate
	existing.TargetProfitRate = in.TargetProfitRate
	existing.StopLossRate = in.StopLossRate
	existing.UpdatedAt = now

	if err := h.store.UpdateHolding(existing); err != nil {
		handleStoreError(w, err)
		return
	}

	updated, err := h.store.GetHolding(id)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, toView(*updated))
}

// DeleteHolding DELETE /api/v1/admin/fund/holdings/{id}
func (h *FundHandler) DeleteHolding(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	if err := h.store.DeleteHolding(id, now); err != nil {
		handleStoreError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]bool{"deleted": true})
}

// UpdateNavs POST /api/v1/admin/fund/update-navs
// 批量更新所有持仓的最新净值。单个失败不影响其他。
// 每次成功更新后：1) 写入净值历史 2) 检查止盈止损预警。
func (h *FundHandler) UpdateNavs(w http.ResponseWriter, r *http.Request) {
	holdings, err := h.store.ListHoldings()
	if err != nil {
		handleStoreError(w, err)
		return
	}

	type updateResult struct {
		Code        string  `json:"code"`
		Name        string  `json:"name"`
		Nav         float64 `json:"nav"`
		NavDate     string  `json:"nav_date"`
		ProfitRate  float64 `json:"profit_rate"`
		Gsz         float64 `json:"gsz"`         // 盘中估算值
		Gszzl       float64 `json:"gszzl"`       // 估算涨跌幅(%)
		GzTime      string  `json:"gz_time"`     // 估算时间
		Alert       string  `json:"alert,omitempty"` // 触发预警时填 "take_profit" / "stop_loss"
		Success     bool    `json:"success"`
		Error       string  `json:"error,omitempty"`
	}

	now := time.Now().UTC().Format(time.RFC3339)
	results := make([]updateResult, 0, len(holdings))
	updated := 0

	for _, ho := range holdings {
		info, err := fetcher.FetchFundNav(ho.Code)
		if err != nil {
			results = append(results, updateResult{
				Code: ho.Code, Name: ho.Name, Success: false,
				Error: err.Error(),
			})
			continue
		}
		if info.IsNotFound {
			results = append(results, updateResult{
				Code: ho.Code, Name: ho.Name, Success: false,
				Error: "基金代码不存在",
			})
			continue
		}
		if err := h.store.UpdateCurrentNav(ho.ID, info.Nav, now); err != nil {
			results = append(results, updateResult{
				Code: ho.Code, Name: ho.Name, Success: false,
				Error: "更新数据库失败: " + err.Error(),
			})
			continue
		}

		// 计算当前盈亏率用于预警检查
		profitRate := 0.0
		if ho.BuyNav > 0 {
			profitRate = (info.Nav - ho.BuyNav) / ho.BuyNav
		}
		alert := h.checkAlert(ho, profitRate)

		results = append(results, updateResult{
			Code: ho.Code, Name: info.Name, Nav: info.Nav,
			NavDate: info.NavDate, ProfitRate: profitRate,
			Gsz: info.Gsz, Gszzl: info.Gszzl, GzTime: info.GzTime,
			Alert: alert, Success: true,
		})
		updated++
	}

	writeData(w, http.StatusOK, map[string]interface{}{
		"updated": updated,
		"total":   len(holdings),
		"results": results,
	})
}

// UpdateOneNav POST /api/v1/admin/fund/holdings/{id}/update-nav
func (h *FundHandler) UpdateOneNav(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}

	holding, err := h.store.GetHolding(id)
	if err != nil {
		http.Error(w, "holding not found", http.StatusNotFound)
		return
	}

	info, err := fetcher.FetchFundNav(holding.Code)
	if err != nil {
		http.Error(w, "抓取净值失败: "+err.Error(), http.StatusBadGateway)
		return
	}
	if info.IsNotFound {
		http.Error(w, "基金代码不存在", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	if err := h.store.UpdateCurrentNav(holding.ID, info.Nav, now); err != nil {
		handleStoreError(w, err)
		return
	}

	if info.Name != "" && info.Name != holding.Name {
		holding.Name = info.Name
		holding.UpdatedAt = now
		_ = h.store.UpdateHolding(holding)
	}

	// 预警检查
	profitRate := 0.0
	if holding.BuyNav > 0 {
		profitRate = (info.Nav - holding.BuyNav) / holding.BuyNav
	}
	h.checkAlert(*holding, profitRate)

	updated, err := h.store.GetHolding(id)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, toView(*updated))
}

// GetHoldingHistory GET /api/v1/admin/fund/holdings/{id}/history?limit=90
func (h *FundHandler) GetHoldingHistory(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "missing id", http.StatusBadRequest)
		return
	}
	limit := parseLimit(r, 365)

	history, err := h.store.ListHistory(id, limit)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	views := make([]FundNavHistoryView, 0, len(history))
	for _, hi := range history {
		views = append(views, FundNavHistoryView{
			Nav: hi.Nav, RecordedAt: hi.RecordedAt,
		})
	}
	writeList(w, views, len(views))
}

// GetAllHistory GET /api/v1/admin/fund/history?limit=1000
func (h *FundHandler) GetAllHistory(w http.ResponseWriter, r *http.Request) {
	limit := parseLimit(r, 1000)

	history, err := h.store.ListAllHistory(limit)
	if err != nil {
		handleStoreError(w, err)
		return
	}

	type item struct {
		HoldingID  string  `json:"holding_id"`
		Code       string  `json:"code"`
		Nav        float64 `json:"nav"`
		RecordedAt string  `json:"recorded_at"`
	}
	views := make([]item, 0, len(history))
	for _, hi := range history {
		views = append(views, item{
			HoldingID: hi.HoldingID, Code: hi.Code,
			Nav: hi.Nav, RecordedAt: hi.RecordedAt,
		})
	}
	writeList(w, views, len(views))
}

// GetSummary GET /api/v1/admin/fund/summary
func (h *FundHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	holdings, err := h.store.ListHoldings()
	if err != nil {
		handleStoreError(w, err)
		return
	}

	var s FundSummary
	s.HoldingCount = len(holdings)
	for _, ho := range holdings {
		s.TotalBuy += ho.BuyAmount
		if ho.CurrentNav > 0 && ho.Shares > 0 {
			s.TotalValue += ho.Shares * ho.CurrentNav
			s.UpdatedCount++
		}
	}
	s.TotalProfit = s.TotalValue - s.TotalBuy
	if s.TotalBuy > 0 {
		s.TotalRate = s.TotalProfit / s.TotalBuy
	}
	writeData(w, http.StatusOK, s)
}

// ============================================================
// 预警检查
// ============================================================

// checkAlert 检查某持仓是否触发止盈/止损预警。
// 触发条件：设置了阈值 && 当前未触发过 && 实际盈亏率越过阈值。
// 触发后：1) 推送通知 2) 标记 alert_triggered=1。
// 返回触发类型（空字符串=未触发）。
func (h *FundHandler) checkAlert(ho store.FundHolding, profitRate float64) string {
	if ho.AlertTriggered {
		return "" // 本轮已触发过，不重复推送
	}

	var alertType string
	var title, msg string

	// 止盈：profitRate >= target_profit_rate（正值）
	if ho.TargetProfitRate > 0 && profitRate >= ho.TargetProfitRate {
		alertType = "take_profit"
		title = "基金止盈提醒"
		msg = fmt.Sprintf("%s（%s）收益率已达 %.2f%%，超过止盈线 %.2f%%",
			ho.Name, ho.Code,
			profitRate*100, ho.TargetProfitRate*100)
	}

	// 止损：profitRate <= stop_loss_rate（负值）
	// stop_loss_rate 用户输入负数（如 -0.1 = -10%），或正数也会转成负数语义
	stopRate := ho.StopLossRate
	if stopRate > 0 {
		stopRate = -stopRate // 允许用户输入正数表示"跌 10%"
	}
	if stopRate < 0 && profitRate <= stopRate {
		alertType = "stop_loss"
		title = "基金止损提醒"
		msg = fmt.Sprintf("%s（%s）收益率已跌至 %.2f%%，跌破止损线 %.2f%%",
			ho.Name, ho.Code,
			profitRate*100, stopRate*100)
	}

	if alertType == "" {
		return ""
	}

	// 推送通知
	if h.notif != nil {
		h.notif.Push("fund", title, msg)
	}
	_ = h.store.MarkAlertTriggered(ho.ID)
	return alertType
}

// ============================================================
// 工具函数
// ============================================================

func parseLimit(r *http.Request, defaultVal int) int {
	q := r.URL.Query().Get("limit")
	if q == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(q)
	if err != nil || n <= 0 {
		return defaultVal
	}
	return n
}

// validateInput 校验输入字段，返回非空字符串表示错误信息。
func validateInput(in FundHoldingInput) string {
	if in.Code == "" {
		return "基金代码不能为空"
	}
	if len(in.Code) != 6 {
		return "基金代码必须是 6 位"
	}
	if in.BuyAmount <= 0 {
		return "购买金额必须大于 0"
	}
	if in.BuyNav <= 0 {
		return "购买净值必须大于 0"
	}
	if in.BuyDate == "" {
		return "购买日期不能为空"
	}
	return ""
}
