package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/breeze/center/internal/store"
)

// ServiceAdminHandler 处理服务实例的 CRUD（管理端）。
//
// 与 ServicesHandler（只读）不同，这个提供完整的增删改查，
// 让 breeze 能在后台动态添加/编辑/删除服务，而无需改 TOML。
type ServiceAdminHandler struct{ store *store.ServiceStore }

// NewServiceAdminHandler 构造 ServiceAdminHandler。
func NewServiceAdminHandler(s *store.ServiceStore) *ServiceAdminHandler {
	return &ServiceAdminHandler{store: s}
}

// List GET /api/v1/admin/services
func (h *ServiceAdminHandler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.store.List()
	if err != nil {
		handleStoreError(w, err)
		return
	}
	if items == nil {
		items = []store.ServiceEntry{}
	}
	writeList(w, items, len(items))
}

// Create POST /api/v1/admin/services
func (h *ServiceAdminHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in store.ServiceInput
	if !decodeJSON(w, r, &in) {
		return
	}
	s, err := h.store.Create(in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusCreated, s)
}

// Update PUT /api/v1/admin/services/{id}
func (h *ServiceAdminHandler) Update(w http.ResponseWriter, r *http.Request) {
	var in store.ServiceInput
	if !decodeJSON(w, r, &in) {
		return
	}
	s, err := h.store.Update(chi.URLParam(r, "id"), in)
	if err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, s)
}

// Delete DELETE /api/v1/admin/services/{id}
func (h *ServiceAdminHandler) Delete(w http.ResponseWriter, r *http.Request) {
	if err := h.store.Delete(chi.URLParam(r, "id")); err != nil {
		handleStoreError(w, err)
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "deleted"})
}
