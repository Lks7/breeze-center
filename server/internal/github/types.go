package github

import "time"

// User GitHub 用户信息
type User struct {
	Login             string    `json:"login"`
	Name              string    `json:"name"`
	AvatarURL         string    `json:"avatar_url"`
	Bio               string    `json:"bio"`
	Company           string    `json:"company"`
	Location          string    `json:"location"`
	Email             string    `json:"email"`
	Blog              string    `json:"blog"`
	PublicRepos       int       `json:"public_repos"`
	PublicGists       int       `json:"public_gists"`
	Followers         int       `json:"followers"`
	Following         int       `json:"following"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
	TwitterUsername   string    `json:"twitter_username"`
	Hireable          bool      `json:"hireable"`
}

// Repository GitHub 仓库信息
type Repository struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	FullName        string    `json:"full_name"`
	Description     string    `json:"description"`
	Private         bool      `json:"private"`
	Fork            bool      `json:"fork"`
	HTMLURL         string    `json:"html_url"`
	Homepage        string    `json:"homepage"`
	Language        string    `json:"language"`
	ForksCount      int       `json:"forks_count"`
	StargazersCount int       `json:"stargazers_count"`
	WatchersCount   int       `json:"watchers_count"`
	OpenIssuesCount int       `json:"open_issues_count"`
	DefaultBranch   string    `json:"default_branch"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	PushedAt        time.Time `json:"pushed_at"`
	Size            int       `json:"size"`
	Topics          []string  `json:"topics"`
}

// Event GitHub 事件（活动）
type Event struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Actor     Actor     `json:"actor"`
	Repo      EventRepo `json:"repo"`
	Payload   Payload   `json:"payload"`
	Public    bool      `json:"public"`
	CreatedAt time.Time `json:"created_at"`
}

// Actor 事件执行者
type Actor struct {
	Login      string `json:"login"`
	AvatarURL  string `json:"avatar_url"`
}

// EventRepo 事件关联仓库
type EventRepo struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

// Payload 事件负载（简化版）
type Payload struct {
	Action      string   `json:"action"`
	Ref         string   `json:"ref"`
	RefType     string   `json:"ref_type"`
	Size        int      `json:"size"`
	DistinctSize int     `json:"distinct_size"`
	Commits     []Commit `json:"commits"`
}

// Commit 提交信息
type Commit struct {
	SHA     string `json:"sha"`
	Message string `json:"message"`
	Author  Author `json:"author"`
	URL     string `json:"url"`
}

// Author 作者信息
type Author struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}
