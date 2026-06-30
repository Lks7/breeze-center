package handler

import (
	"net/http"

	"github.com/breeze/center/internal/config"
	"github.com/breeze/center/internal/service"
	"github.com/go-chi/chi/v5"
)

// ServicesHandler 持有服务注册表引用。
type ServicesHandler struct {
	registry *service.Registry
}

// NewServicesHandler 构造一个 ServicesHandler。
func NewServicesHandler(reg *service.Registry) *ServicesHandler {
	return &ServicesHandler{registry: reg}
}

// List 返回所有服务，支持 ?category= 过滤。
func (h *ServicesHandler) List(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")

	var services []config.MergedService
	if category != "" {
		grouped := h.registry.ByCategory()
		services = grouped[category]
	} else {
		services = h.registry.All()
	}
	if services == nil {
		services = []config.MergedService{}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    services,
		"count":   len(services),
	})
}

// Get 返回单个服务详情。
func (h *ServicesHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s, ok := h.registry.Get(id)
	if !ok {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "service not found: "+id)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    s,
	})
}

// Categories 返回所有服务分类。
func (h *ServicesHandler) Categories(w http.ResponseWriter, r *http.Request) {
	grouped := h.registry.ByCategory()
	categories := make([]map[string]any, 0, len(grouped))
	for cat, items := range grouped {
		categories = append(categories, map[string]any{
			"id":       cat,
			"name":     categoryDisplayName(cat),
			"count":    len(items),
			"services": items,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    categories,
	})
}

// categoryDisplayName 把分类 id 翻译成中文展示名。
func categoryDisplayName(id string) string {
	switch id {
	case "content":
		return "内容创作"
	case "self-hosted":
		return "自建服务"
	case "data":
		return "数据仪表"
	case "plan":
		return "计划管理"
	case "subscription":
		return "信息订阅"
	case "entertainment":
		return "娱乐"
	default:
		return id
	}
}
