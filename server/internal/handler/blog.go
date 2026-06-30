package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/breeze/center/internal/store"
)

// BlogHandler 处理博客文章的 CRUD。
type BlogHandler struct{ store *store.BlogStore }

// NewBlogHandler 构造 BlogHandler。
func NewBlogHandler(s *store.BlogStore) *BlogHandler { return &BlogHandler{store: s} }

// List GET /api/v1/admin/blog/posts
func (h *BlogHandler) List(w http.ResponseWriter, r *http.Request) {
	posts, err := h.store.List()
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if posts == nil {
		posts = []store.BlogPost{}
	}
	writeList(w, posts, len(posts))
}

// Get GET /api/v1/admin/blog/posts/{id}
func (h *BlogHandler) Get(w http.ResponseWriter, r *http.Request) {
	p, err := h.store.Get(chi.URLParam(r, "id"))
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, p)
}

// Create POST /api/v1/admin/blog/posts
func (h *BlogHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in store.BlogPostInput
	if !decodeJSON(w, r, &in) {
		return
	}
	p, err := h.store.Create(in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusCreated, p)
}

// Update PUT /api/v1/admin/blog/posts/{id}
func (h *BlogHandler) Update(w http.ResponseWriter, r *http.Request) {
	var in store.BlogPostInput
	if !decodeJSON(w, r, &in) {
		return
	}
	p, err := h.store.Update(chi.URLParam(r, "id"), in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, p)
}

// Delete DELETE /api/v1/admin/blog/posts/{id}
func (h *BlogHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if err := h.store.Delete(chi.URLParam(r, "id")); err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "deleted"})
}
