package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/breeze/center/internal/github"
)

// GitHubHandler GitHub API 处理器
type GitHubHandler struct {
	client *github.Client
}

// NewGitHubHandler 创建 GitHub 处理器
func NewGitHubHandler(username, token string) *GitHubHandler {
	return &GitHubHandler{
		client: github.NewClient(username, token),
	}
}

// GetUser 获取 GitHub 用户信息
func (h *GitHubHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	user, err := h.client.GetUser()
	if err != nil {
		log.Printf("[GitHub] Failed to get user: %v", err)
		respondJSON(w, http.StatusOK, &github.User{Login: "Lks7"})
		return
	}
	respondJSON(w, http.StatusOK, user)
}

// GetRepos 获取 GitHub 仓库列表
func (h *GitHubHandler) GetRepos(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 30
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	repos, err := h.client.GetRepos(limit)
	if err != nil {
		log.Printf("[GitHub] Failed to get repos: %v", err)
		respondJSON(w, http.StatusOK, []github.Repository{})
		return
	}
	respondJSON(w, http.StatusOK, repos)
}

// GetPopularRepos 获取最受欢迎的仓库
func (h *GitHubHandler) GetPopularRepos(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}
	repos, err := h.client.GetPopularRepos(limit)
	if err != nil {
		log.Printf("[GitHub] Failed to get popular repos: %v", err)
		respondJSON(w, http.StatusOK, []github.Repository{})
		return
	}
	respondJSON(w, http.StatusOK, repos)
}

// GetEvents 获取最近活动
func (h *GitHubHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 30
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}
	events, err := h.client.GetEvents(limit)
	if err != nil {
		log.Printf("[GitHub] Failed to get events: %v", err)
		respondJSON(w, http.StatusOK, []github.Event{})
		return
	}
	respondJSON(w, http.StatusOK, events)
}

// respondJSON 返回 JSON 响应（辅助函数）
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
