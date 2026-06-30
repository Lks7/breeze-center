package handler

import (
	"net/http"

	"github.com/breeze/center/internal/config"
	"github.com/breeze/center/internal/service"
)

// WidgetsHandler 处理 widget 配置与数据请求。
type WidgetsHandler struct {
	registry *service.Registry
}

// NewWidgetsHandler 构造一个 WidgetsHandler。
func NewWidgetsHandler(reg *service.Registry) *WidgetsHandler {
	return &WidgetsHandler{registry: reg}
}

// List 返回所有 widget 配置（按 refresh_interval 升序）。
func (h *WidgetsHandler) List(w http.ResponseWriter, r *http.Request) {
	widgets := h.registry.Widgets()
	// 确保空时输出 [] 而不是 null
	if widgets == nil {
		widgets = []config.MergedService{}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    widgets,
		"count":   len(widgets),
	})
}

// Data 返回指定 widget 类型的数据。
// 当前阶段返回 mock 数据，后续接入 proxy 真实拉取。
func (h *WidgetsHandler) Data(w http.ResponseWriter, r *http.Request) {
	widgetType := r.URL.Query().Get("type")
	if widgetType == "" {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "missing required query param: type")
		return
	}

	payload := mockWidgetData(widgetType)
	if payload == nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "no widget data for type: "+widgetType)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data": map[string]any{
			"type":            widgetType,
			"source":          "mock",
			"cached":          false,
			"refresh_interval": 300,
			"payload":         payload,
		},
	})
}

// mockWidgetData 按类型返回占位数据。
// 真实数据由后续的 proxy 服务从外部 API 拉取。
func mockWidgetData(t string) any {
	switch t {
	case "rss-feed":
		return map[string]any{
			"items": []map[string]any{
				{"title": "Astro 6 发布：内容集合与 Server Islands 全面升级", "source": "Astro Blog", "date": "2h", "url": "#"},
				{"title": "用 Go 搭建轻量级个人 API 网关的实践", "source": "Breeze 的博客", "date": "5h", "url": "#"},
				{"title": "React 19 新特性：Actions 与 useOptimistic 深度解析", "source": "Hacker News", "date": "8h", "url": "#"},
				{"title": "自托管系列（三）：用 Tailscale 组建私有网络", "source": "Self Hosted", "date": "1d", "url": "#"},
				{"title": "Tailwind CSS v4 迁移指南：从配置到 CSS-first", "source": "Tailwind Labs", "date": "2d", "url": "#"},
			},
		}
	case "stat-card":
		return map[string]any{
			"value":  12,
			"unit":   "commits",
			"trend":  8,
			"trend_label": "本周",
		}
	case "status-list":
		return map[string]any{
			"services": []map[string]any{
				{"name": "Blog", "url": "blog.breeze.dev", "status": "ok", "latency": "42ms"},
				{"name": "Gitea", "url": "git.breeze.dev", "status": "ok", "latency": "18ms"},
				{"name": "NAS", "url": "nas.breeze.dev", "status": "ok", "latency": "8ms"},
				{"name": "Vaultwarden", "url": "vault.breeze.dev", "status": "ok", "latency": "31ms"},
				{"name": "Uptime Kuma", "url": "status.breeze.dev", "status": "warn", "latency": "280ms"},
				{"name": "Jellyfin", "url": "media.breeze.dev", "status": "idle", "latency": ""},
			},
			"summary": map[string]any{
				"total":  6,
				"ok":     4,
				"warn":   1,
				"error":  0,
				"idle":   1,
			},
		}
	case "todo-list":
		return map[string]any{
			"items": []map[string]any{
				{"id": "1", "text": "完成 breeze-center 首页设计", "done": true, "priority": "high"},
				{"id": "2", "text": "搭建 Go 后端骨架", "done": false, "priority": "high"},
				{"id": "3", "text": "写 RSS 聚合 Widget", "done": false, "priority": "medium"},
				{"id": "4", "text": "部署 Docker 到 NAS", "done": false, "priority": "low"},
				{"id": "5", "text": "整理本周读书笔记", "done": false, "priority": "medium"},
			},
		}
	case "link-grid":
		return map[string]any{
			"links": []map[string]any{
				{"name": "GitHub", "url": "https://github.com", "icon": "github"},
				{"name": "V2EX", "url": "https://v2ex.com", "icon": "message-square"},
				{"name": "Hacker News", "url": "https://news.ycombinator.com", "icon": "newspaper"},
				{"name": "MDN", "url": "https://developer.mozilla.org", "icon": "book"},
				{"name": "Go Docs", "url": "https://go.dev/doc/", "icon": "code"},
				{"name": "React Docs", "url": "https://react.dev", "icon": "atom"},
			},
		}
	default:
		return nil
	}
}
