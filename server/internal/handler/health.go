// Package handler 实现 breeze-center 的 HTTP 端点。
package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/breeze/center/internal/model"
)

const version = "0.1.0"

var upSince = time.Now()

// Health 返回服务健康状态。
func Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, model.Response[model.HealthResponse]{
		Success: true,
		Data: model.HealthResponse{
			Status:  "ok",
			Version: version,
			UpSince: upSince,
		},
		Time: time.Now(),
	})
}

// writeJSON 是统一的 JSON 响应工具。
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeError 是统一错误响应工具。
func writeError(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, model.Response[any]{
		Success: false,
		Error: &model.ErrorBody{
			Code:    code,
			Message: msg,
		},
		Time: time.Now(),
	})
}
