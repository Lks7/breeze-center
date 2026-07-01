package github

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client GitHub API 客户端
type Client struct {
	username string
	token    string // 可选
	client   *http.Client
	baseURL  string
}

// NewClient 创建 GitHub API 客户端
func NewClient(username, token string) *Client {
	return &Client{
		username: username,
		token:    token,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseURL: "https://api.github.com",
	}
}

// doRequest 执行 HTTP 请求
func (c *Client) doRequest(path string) ([]byte, error) {
	url := c.baseURL + path
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	// 设置 User-Agent（GitHub API 要求）
	req.Header.Set("User-Agent", "breeze-center")
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	// 如果有 token，添加认证头
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// 检查 HTTP 状态码
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %s (status: %d)", string(body), resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// GetUser 获取用户信息
func (c *Client) GetUser() (*User, error) {
	path := fmt.Sprintf("/users/%s", c.username)
	data, err := c.doRequest(path)
	if err != nil {
		return nil, err
	}

	var user User
	if err := json.Unmarshal(data, &user); err != nil {
		return nil, err
	}

	return &user, nil
}

// GetRepos 获取用户的公开仓库列表
func (c *Client) GetRepos(limit int) ([]Repository, error) {
	path := fmt.Sprintf("/users/%s/repos?sort=updated&per_page=%d", c.username, limit)
	data, err := c.doRequest(path)
	if err != nil {
		return nil, err
	}

	var repos []Repository
	if err := json.Unmarshal(data, &repos); err != nil {
		return nil, err
	}

	return repos, nil
}

// GetEvents 获取用户的最近活动
func (c *Client) GetEvents(limit int) ([]Event, error) {
	path := fmt.Sprintf("/users/%s/events/public?per_page=%d", c.username, limit)
	data, err := c.doRequest(path)
	if err != nil {
		return nil, err
	}

	var events []Event
	if err := json.Unmarshal(data, &events); err != nil {
		return nil, err
	}

	return events, nil
}

// GetPopularRepos 获取最受欢迎的仓库（按 stars 排序）
func (c *Client) GetPopularRepos(limit int) ([]Repository, error) {
	// GitHub API 不直接支持按 stars 排序，需要获取全部后排序
	repos, err := c.GetRepos(100) // 获取最近 100 个仓库
	if err != nil {
		return nil, err
	}

	// 按 stars 倒序排序
	for i := 0; i < len(repos)-1; i++ {
		for j := i + 1; j < len(repos); j++ {
			if repos[j].StargazersCount > repos[i].StargazersCount {
				repos[i], repos[j] = repos[j], repos[i]
			}
		}
	}

	// 返回前 N 个
	if len(repos) > limit {
		repos = repos[:limit]
	}

	return repos, nil
}
