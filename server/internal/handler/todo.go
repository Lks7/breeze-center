package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/breeze/center/internal/store"
)

// TodoHandler 处理待办 CRUD。
type TodoHandler struct{ store *store.TodoStore }

// NewTodoHandler 构造 TodoHandler。
func NewTodoHandler(s *store.TodoStore) *TodoHandler { return &TodoHandler{store: s} }

// List GET /api/v1/admin/todos
func (h *TodoHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.store.List()
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if items == nil {
		items = []store.Todo{}
	}
	writeList(w, items, len(items))
}

// Create POST /api/v1/admin/todos
func (h *TodoHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in store.TodoInput
	if !decodeJSON(w, r, &in) {
		return
	}
	t, err := h.store.Create(in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusCreated, t)
}

// Update PUT /api/v1/admin/todos/{id}
func (h *TodoHandler) Update(w http.ResponseWriter, r *http.Request) {
	var in store.TodoInput
	if !decodeJSON(w, r, &in) {
		return
	}
	t, err := h.store.Update(chi.URLParam(r, "id"), in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, t)
}

// ToggleDone PATCH /api/v1/admin/todos/{id}/toggle
func (h *TodoHandler) ToggleDone(w http.ResponseWriter, r *http.Request) {
	t, err := h.store.ToggleDone(chi.URLParam(r, "id"))
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, t)
}

// Delete DELETE /api/v1/admin/todos/{id}
func (h *TodoHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if err := h.store.Delete(chi.URLParam(r, "id")); err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "deleted"})
}
