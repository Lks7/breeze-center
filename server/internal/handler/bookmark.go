package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/breeze/center/internal/store"
)

// BookmarkHandler 处理书签 CRUD。
type BookmarkHandler struct{ store *store.BookmarkStore }

// NewBookmarkHandler 构造 BookmarkHandler。
func NewBookmarkHandler(s *store.BookmarkStore) *BookmarkHandler { return &BookmarkHandler{store: s} }

// List GET /api/v1/admin/bookmarks
func (h *BookmarkHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.store.List()
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if items == nil {
		items = []store.Bookmark{}
	}
	writeList(w, items, len(items))
}

// Create POST /api/v1/admin/bookmarks
func (h *BookmarkHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in store.BookmarkInput
	if !decodeJSON(w, r, &in) {
		return
	}
	b, err := h.store.Create(in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusCreated, b)
}

// Update PUT /api/v1/admin/bookmarks/{id}
func (h *BookmarkHandler) Update(w http.ResponseWriter, r *http.Request) {
	var in store.BookmarkInput
	if !decodeJSON(w, r, &in) {
		return
	}
	b, err := h.store.Update(chi.URLParam(r, "id"), in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, b)
}

// MarkOpened PATCH /api/v1/admin/bookmarks/{id}/open
func (h *BookmarkHandler) MarkOpened(w http.ResponseWriter, r *http.Request) {
	b, err := h.store.MarkOpened(chi.URLParam(r, "id"))
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, b)
}

// Delete DELETE /api/v1/admin/bookmarks/{id}
func (h *BookmarkHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if err := h.store.Delete(chi.URLParam(r, "id")); err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "deleted"})
}
