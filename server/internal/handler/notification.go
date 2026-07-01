package handler

import (
	"net/http"
	"strconv"

	"github.com/breeze/center/internal/store"

	"github.com/go-chi/chi/v5"
)

type NotificationHandler struct {
	store *store.NotificationStore
}

func NewNotificationHandler(db *store.NotificationStore) *NotificationHandler {
	return &NotificationHandler{store: db}
}

func (h *NotificationHandler) List(w http.ResponseWriter, r *http.Request) {
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}
	notifs, err := h.store.List(limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	if notifs == nil {
		notifs = []store.Notification{}
	}
	writeData(w, http.StatusOK, notifs)
}

func (h *NotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.MarkRead(id); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	if err := h.store.MarkAllRead(); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *NotificationHandler) Clear(w http.ResponseWriter, r *http.Request) {
	if err := h.store.Clear(); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *NotificationHandler) Register(r chi.Router) {
	r.Get("/notifications", h.List)
	r.Put("/notifications/{id}/read", h.MarkRead)
	r.Put("/notifications/read-all", h.MarkAllRead)
	r.Delete("/notifications", h.Clear)
}
