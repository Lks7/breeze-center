package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/breeze/center/internal/store"
	"github.com/go-chi/chi/v5"
)

type SubscriptionHandler struct {
	store *store.SubscriptionStore
}

func NewSubscriptionHandler(s *store.SubscriptionStore) *SubscriptionHandler {
	return &SubscriptionHandler{store: s}
}

func (h *SubscriptionHandler) List(w http.ResponseWriter, r *http.Request) {
	subs, err := h.store.List()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	if subs == nil {
		subs = []store.Subscription{}
	}
	writeData(w, http.StatusOK, subs)
}

type CreateSubscriptionInput struct {
	Name        string  `json:"name"`
	Type        string  `json:"type"`
	Provider    string  `json:"provider"`
	ExpireDate  string  `json:"expire_date"`
	Price       float64 `json:"price"`
	Cycle       string  `json:"cycle"`
	Description string  `json:"description"`
	NotifyDays  int     `json:"notify_days"`
}

func (h *SubscriptionHandler) Create(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}

	var input CreateSubscriptionInput
	if err := json.Unmarshal(body, &input); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}

	id, err := h.store.Create(input.Name, input.Type, input.Provider, input.ExpireDate,
		input.Price, input.Cycle, input.Description, input.NotifyDays)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]string{"id": id})
}

func (h *SubscriptionHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}

	var input CreateSubscriptionInput
	if err := json.Unmarshal(body, &input); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}

	if err := h.store.Update(id, input.Name, input.Type, input.Provider, input.ExpireDate,
		input.Price, input.Cycle, input.Description, input.NotifyDays); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *SubscriptionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.store.Delete(id); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *SubscriptionHandler) GetExpiring(w http.ResponseWriter, r *http.Request) {
	daysStr := r.URL.Query().Get("days")
	days := 30
	if daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}
	subs, err := h.store.GetExpiring(days)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	if subs == nil {
		subs = []store.Subscription{}
	}
	writeData(w, http.StatusOK, subs)
}

func (h *SubscriptionHandler) Register(r chi.Router) {
	r.Get("/subscriptions", h.List)
	r.Post("/subscriptions", h.Create)
	r.Put("/subscriptions/{id}", h.Update)
	r.Delete("/subscriptions/{id}", h.Delete)
}

func (h *SubscriptionHandler) RegisterPublic(r chi.Router) {
	r.Get("/subscriptions/expiring", h.GetExpiring)
}
