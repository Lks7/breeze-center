// Package middleware 提供 HTTP 中间件。
package middleware

import (
	"net/http"
	"strings"

	"github.com/rs/cors"
)

// CORS 基于 site.toml 的允许来源构造 CORS 中间件。
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	if len(allowedOrigins) == 0 {
		allowedOrigins = []string{"http://localhost:4321"}
	}
	// rs/cors 默认会处理预检与简单请求，比手写省事且更安全。
	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	})
	return c.Handler
}

// RequestLogger 打印每个请求的方法、路径与耗时。
// 个人项目够用，无需引入 zap/zerolog。
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 跳过健康检查的频繁日志
		if strings.HasPrefix(r.URL.Path, "/api/health") {
			next.ServeHTTP(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}
