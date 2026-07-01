package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/breeze/center/internal/store"
)

// FusionHandler 融合站点处理器
type FusionHandler struct {
	store *store.FusionStore
}

// NewFusionHandler 创建融合站点处理器
func NewFusionHandler(store *store.FusionStore) *FusionHandler {
	return &FusionHandler{store: store}
}

// List 获取所有融合站点
func (h *FusionHandler) List(w http.ResponseWriter, r *http.Request) {
	sites, err := h.store.List()
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if sites == nil {
		sites = []store.FusionSite{}
	}

	writeData(w, http.StatusOK, sites)
}

// Get 获取单个融合站点
func (h *FusionHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	site, err := h.store.Get(id)
	if err != nil {
		handleStoreError(w, err)
		return
	}

	writeData(w, http.StatusOK, site)
}

// Create 创建融合站点
func (h *FusionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input store.FusionSiteInput
	if !decodeJSON(w, r, &input) {
		return
	}

	site, err := h.store.Create(input)
	if err != nil {
		handleStoreError(w, err)
		return
	}

	writeData(w, http.StatusCreated, site)
}

// Update 更新融合站点
func (h *FusionHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var input store.FusionSiteInput
	if !decodeJSON(w, r, &input) {
		return
	}

	site, err := h.store.Update(id, input)
	if err != nil {
		handleStoreError(w, err)
		return
	}

	writeData(w, http.StatusOK, site)
}

// Delete 删除融合站点
func (h *FusionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if err := h.store.Delete(id); err != nil {
		handleStoreError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]bool{"deleted": true})
}
