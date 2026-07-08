package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/breeze/center/internal/store"
)

// CheckInHandler 处理打卡相关 API。
type CheckInHandler struct {
	todoStore    *store.TodoStore
	checkInStore *store.CheckInStore
}

// NewCheckInHandler 构造 CheckInHandler。
func NewCheckInHandler(ts *store.TodoStore, cs *store.CheckInStore) *CheckInHandler {
	return &CheckInHandler{todoStore: ts, checkInStore: cs}
}

// Register 注册公开路由。
func (h *CheckInHandler) Register(r chi.Router) {
	r.Get("/habits", h.ListHabits)
	r.Get("/habits/{id}/stats", h.HabitStats)
	r.Post("/check-ins", h.CreateCheckIn)
	r.Delete("/check-ins/{id}", h.DeleteCheckIn)
	r.Delete("/check-ins/delete-by-date", h.DeleteCheckInByDate)
	r.Get("/check-ins", h.ListCheckIns)
	r.Get("/check-ins/batch", h.BatchListCheckIns)
}

// HabitWithCheckIn 习惯目标 + 今日打卡状态 + 连胜。
type HabitWithCheckIn struct {
	store.Todo
	TodayChecked bool   `json:"today_checked"`
	TodayStatus  string `json:"today_status"` // "success" | "failure" | ""
	Streak       int    `json:"streak"`
}

// ListHabits GET /api/v1/habits
func (h *CheckInHandler) ListHabits(w http.ResponseWriter, r *http.Request) {
	habits, err := h.todoStore.ListHabits()
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if habits == nil {
		habits = []store.Todo{}
	}

	result := make([]HabitWithCheckIn, len(habits))
	for i, hab := range habits {
		checked, status, _ := h.checkInStore.CheckToday(hab.ID)
		dates, _ := h.checkInStore.GetAllDates(hab.ID)
		streak := store.CalcCurrentStreak(dates)
		result[i] = HabitWithCheckIn{
			Todo:         hab,
			TodayChecked: checked,
			TodayStatus:  status,
			Streak:       streak,
		}
	}
	writeList(w, result, len(result))
}

// CreateCheckIn POST /api/v1/check-ins
func (h *CheckInHandler) CreateCheckIn(w http.ResponseWriter, r *http.Request) {
	var in struct {
		TodoID    string `json:"todo_id"`
		CheckDate string `json:"check_date"` // 可选，默认今天
		Status    string `json:"status"`    // 可选，默认 "success"
	}
	if !decodeJSON(w, r, &in) {
		return
	}
	if in.TodoID == "" {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "todo_id is required")
		return
	}
	date := in.CheckDate
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	status := in.Status
	if status == "" {
		status = "success"
	}
	// 验证待办存在
	todo, err := h.todoStore.GetByID(in.TodoID)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if !todo.IsHabit {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "todo is not a habit")
		return
	}

	// Create 内部会自动处理：已有记录则更新 status，没有则新建
	c, err := h.checkInStore.Create(in.TodoID, date, status)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusCreated, c)
}

// DeleteCheckIn DELETE /api/v1/check-ins/{id}
func (h *CheckInHandler) DeleteCheckIn(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.checkInStore.Delete(id); err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ListCheckIns GET /api/v1/check-ins?todo_id=xxx&month=2026-07
func (h *CheckInHandler) ListCheckIns(w http.ResponseWriter, r *http.Request) {
	todoID := r.URL.Query().Get("todo_id")
	if todoID == "" {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "todo_id is required")
		return
	}
	monthStr := r.URL.Query().Get("month")
	if monthStr == "" {
		monthStr = time.Now().Format("2006-01")
	}
	t, err := time.Parse("2006-01", monthStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid month format, use YYYY-MM")
		return
	}
	dates, err := h.checkInStore.ListByMonth(todoID, t.Year(), t.Month())
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if dates == nil {
		dates = []string{}
	}
	writeData(w, http.StatusOK, dates)
}

// DeleteCheckInByDate DELETE /api/v1/check-ins/delete-by-date?todo_id=xxx&date=2026-07-07
func (h *CheckInHandler) DeleteCheckInByDate(w http.ResponseWriter, r *http.Request) {
	todoID := r.URL.Query().Get("todo_id")
	date := r.URL.Query().Get("date")
	if todoID == "" || date == "" {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "todo_id and date are required")
		return
	}
	if err := h.checkInStore.DeleteByDate(todoID, date); err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// BatchListCheckIns GET /api/v1/check-ins/batch?todo_ids=id1,id2&month=2026-07
func (h *CheckInHandler) BatchListCheckIns(w http.ResponseWriter, r *http.Request) {
	ids := r.URL.Query().Get("todo_ids")
	monthStr := r.URL.Query().Get("month")
	if ids == "" {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "todo_ids is required (comma-separated)")
		return
	}
	if monthStr == "" {
		monthStr = time.Now().Format("2006-01")
	}
	t, err := time.Parse("2006-01", monthStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid month format, use YYYY-MM")
		return
	}

	todoIDs := splitCSV(ids)
	result, err := h.checkInStore.ListAllByMonth(todoIDs, t.Year(), t.Month())
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if result == nil {
		result = map[string]map[string]string{}
	}
	writeData(w, http.StatusOK, result)
}

// splitCSV splits a comma-separated string, filtering empty entries.
func splitCSV(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// HabitStats GET /api/v1/habits/{id}/stats
func (h *CheckInHandler) HabitStats(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	todo, err := h.todoStore.GetByID(id)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if !todo.IsHabit {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "todo is not a habit")
		return
	}
	stats, err := h.checkInStore.CalculateStats(todo.ID, todo.HabitFrequency, todo.HabitTarget)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, stats)
}

