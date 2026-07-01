package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/breeze/center/internal/store"
	"github.com/go-chi/chi/v5"
)

type SettingsHandler struct {
	store *store.SettingsStore
}

func NewSettingsHandler(s *store.SettingsStore) *SettingsHandler {
	return &SettingsHandler{store: s}
}

func (h *SettingsHandler) Get(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	value, err := h.store.Get(key)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]string{"value": value})
}

func (h *SettingsHandler) Set(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", err.Error())
		return
	}

	var input struct {
		Value string `json:"value"`
	}
	if err := json.Unmarshal(body, &input); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_JSON", err.Error())
		return
	}

	if err := h.store.Set(key, input.Value); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", err.Error())
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *SettingsHandler) Register(r chi.Router) {
	r.Get("/settings/{key}", h.Get)
	r.Put("/settings/{key}", h.Set)
}
