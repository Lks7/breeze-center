// Package model 定义 API 响应的通用包装与各端点专用模型。
package model

import "time"

// Response 是统一的 API 响应包装。
type Response[T any] struct {
	Success bool      `json:"success"`
	Data    T         `json:"data,omitempty"`
	Error   *ErrorBody `json:"error,omitempty"`
	Time    time.Time `json:"time"`
}

// ErrorBody 描述错误详情。
type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// HealthResponse 是 /api/health 的响应。
type HealthResponse struct {
	Status  string    `json:"status"`
	Version string    `json:"version"`
	UpSince time.Time `json:"up_since"`
}

// WidgetDataResponse 用于 widget 数据端点。
// 这里用 map 暂时承载任意结构的数据，后续可换成强类型。
type WidgetDataResponse struct {
	Type     string         `json:"type"`
	Source   string         `json:"source"`
	Cached   bool           `json:"cached"`
	Refresh  int            `json:"refresh_interval"`
	Payload  map[string]any `json:"payload"`
}
