package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/breeze/center/internal/store"
)

// RSSHandler 处理 RSS 源与文章。
type RSSHandler struct {
	store     *store.RSSStore
	scheduler interface{ FetchNow() }
}

// NewRSSHandler 构造 RSSHandler。
func NewRSSHandler(s *store.RSSStore, scheduler interface{ FetchNow() }) *RSSHandler {
	return &RSSHandler{store: s, scheduler: scheduler}
}

// ---- Sources ----

// ListSources GET /api/v1/admin/rss/sources
func (h *RSSHandler) ListSources(w http.ResponseWriter, r *http.Request) {
	srcs, err := h.store.ListSources()
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if srcs == nil {
		srcs = []store.RSSSource{}
	}
	writeList(w, srcs, len(srcs))
}

// CreateSource POST /api/v1/admin/rss/sources
func (h *RSSHandler) CreateSource(w http.ResponseWriter, r *http.Request) {
	var in store.RSSSourceInput
	if !decodeJSON(w, r, &in) {
		return
	}
	src, err := h.store.CreateSource(in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusCreated, src)
}

// UpdateSource PUT /api/v1/admin/rss/sources/{id}
func (h *RSSHandler) UpdateSource(w http.ResponseWriter, r *http.Request) {
	var in store.RSSSourceInput
	if !decodeJSON(w, r, &in) {
		return
	}
	src, err := h.store.UpdateSource(chi.URLParam(r, "id"), in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, src)
}

// DeleteSource DELETE /api/v1/admin/rss/sources/{id}
func (h *RSSHandler) DeleteSource(w http.ResponseWriter, r *http.Request) {
	if err := h.store.DeleteSource(chi.URLParam(r, "id")); err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ---- Articles ----

// ListArticles GET /api/v1/admin/rss/articles?source_id=&limit=
func (h *RSSHandler) ListArticles(w http.ResponseWriter, r *http.Request) {
	sourceID := r.URL.Query().Get("source_id")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	arts, err := h.store.ListArticles(sourceID, limit)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if arts == nil {
		arts = []store.RSSArticle{}
	}
	writeList(w, arts, len(arts))
}

// MarkArticleRead PATCH /api/v1/admin/rss/articles/{id}?read=true
func (h *RSSHandler) MarkArticleRead(w http.ResponseWriter, r *http.Request) {
	read := r.URL.Query().Get("read") != "false"
	if err := h.store.MarkArticleRead(chi.URLParam(r, "id"), read); err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, map[string]bool{"read": read})
}

// FetchNow POST /api/v1/admin/rss/fetch - 手动触发 RSS 抓取
func (h *RSSHandler) FetchNow(w http.ResponseWriter, r *http.Request) {
	if h.scheduler == nil {
		writeData(w, http.StatusServiceUnavailable, map[string]string{
			"error": "RSS scheduler not available",
		})
		return
	}

	// 异步触发抓取
	h.scheduler.FetchNow()

	writeData(w, http.StatusOK, map[string]string{
		"status":  "triggered",
		"message": "RSS fetch started in background",
	})
}
