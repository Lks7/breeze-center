package handler

import (
	"net/http"

	"github.com/breeze/center/internal/store"

	"github.com/go-chi/chi/v5"
)

type PomodoroHandler struct {
	store *store.PomodoroStore
}

func NewPomodoroHandler(db *store.PomodoroStore) *PomodoroHandler {
	return &PomodoroHandler{store: db}
}

func (h *PomodoroHandler) GetToday(w http.ResponseWriter, r *http.Request) {
	count, err := h.store.TodayCount()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]any{"count": count})
}

func (h *PomodoroHandler) Increment(w http.ResponseWriter, r *http.Request) {
	count, err := h.store.Increment()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]any{"count": count})
}

func (h *PomodoroHandler) Register(r chi.Router) {
	r.Get("/api/v1/pomodoro/today", h.GetToday)
	r.Post("/api/v1/pomodoro/increment", h.Increment)
}
