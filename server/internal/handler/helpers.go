package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/breeze/center/internal/store"
)

// decodeJSON 解析请求体到目标对象，统一处理错误。
func decodeJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON: "+err.Error())
		return false
	}
	return true
}

// handleStoreError 把 store 层错误映射到合适的 HTTP 状态码。
func handleStoreError(w http.ResponseWriter, err error) {
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}
	writeError(w, http.StatusInternalServerError, "STORE_ERROR", err.Error())
}

// writeData 写入标准成功响应。
func writeData(w http.ResponseWriter, status int, data any) {
	writeJSON(w, status, map[string]any{
		"success": true,
		"data":    data,
	})
}

// writeList 写入列表响应，附带 count 字段。
func writeList(w http.ResponseWriter, items any, count int) {
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    items,
		"count":   count,
	})
}
