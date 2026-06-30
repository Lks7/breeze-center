package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"time"
)

// PoetryHandler 代理外部古诗 API。
//
// 设计理由：
//   - 客户端直连外部 API 可能遇到 CORS 限制
//   - 后端代理可以做内存缓存，避免每次刷新都打上游
//   - 与项目其他 /api/v1/* 端点风格统一
type PoetryHandler struct {
	client *http.Client
}

// NewPoetryHandler 构造一个 PoetryHandler。
// 复用单例 http.Client（连接池），超时 5s。
func NewPoetryHandler() *PoetryHandler {
	return &PoetryHandler{
		client: &http.Client{Timeout: 5 * time.Second},
	}
}

// poetryResponse 是上游 API 的响应结构（只取需要的字段）。
type poetryResponse struct {
	Data struct {
		ID      int      `json:"id"`
		Title   string   `json:"title"`
		Content []string `json:"content"`
		Author  struct {
			Name string `json:"name"`
		} `json:"author"`
		Dynasty struct {
			Name string `json:"name"`
		} `json:"dynasty"`
	} `json:"data"`
}

// Random GET /api/v1/poetry/random
// 返回一首随机古诗，字段精简后送给前端。
func (h *PoetryHandler) Random(w http.ResponseWriter, r *http.Request) {
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, "https://poetry.palemoky.com/api/poems/random", nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "BUILD_REQUEST", err.Error())
		return
	}
	resp, err := h.client.Do(req)
	if err != nil {
		writeError(w, http.StatusBadGateway, "UPSTREAM_ERROR", err.Error())
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		writeError(w, http.StatusBadGateway, "UPSTREAM_STATUS", "upstream returned "+resp.Status)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "READ_BODY", err.Error())
		return
	}

	var pr poetryResponse
	if err := json.Unmarshal(body, &pr); err != nil {
		writeError(w, http.StatusInternalServerError, "PARSE_BODY", err.Error())
		return
	}

	// 精简输出，不直接透传上游结构
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data": map[string]any{
			"title":   pr.Data.Title,
			"content": pr.Data.Content,
			"author":  pr.Data.Author.Name,
			"dynasty": pr.Data.Dynasty.Name,
		},
	})
}
