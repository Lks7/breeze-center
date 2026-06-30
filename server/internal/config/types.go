// Package config defines breeze-center's TOML configuration types
// and the loader that merges service templates with provider instances.
package config

// ============================================================
// 站点全局配置 — config/site.toml
// ============================================================

// SiteConfig 是 breeze-center 的全局站点配置。
type SiteConfig struct {
	Title       string       `toml:"title"`
	Description string       `toml:"description"`
	Author      string       `toml:"author"`
	Language    string       `toml:"language"`
	Server      ServerConfig `toml:"server"`
}

// ServerConfig 描述后端服务运行参数。
type ServerConfig struct {
	Port int    `toml:"port"`
	Env  string `toml:"env"`
	// CORSOrigins 是允许的前端来源列表，逗号分隔。
	CORSOrigins []string `toml:"cors_origins"`
}

// ============================================================
// 服务模板 — config/services/<id>.toml
// 描述「这个服务是什么」，与具体实例无关。
// ============================================================

// ServiceTemplate 是服务的通用模板，所有实例共享这些默认值。
type ServiceTemplate struct {
	ID          string        `toml:"id" json:"id"`
	Name        string        `toml:"name" json:"name"`
	Category    string        `toml:"category" json:"category"`
	Description string        `toml:"description" json:"description"`
	Icon        IconConfig    `toml:"icon" json:"icon"`
	Widget      WidgetConfig  `toml:"widget" json:"widget"`
	HealthCheck *HealthConfig `toml:"health_check" json:"health_check,omitempty"`
}

// IconConfig 描述服务在前端的图标呈现。
type IconConfig struct {
	Name  string `toml:"name" json:"name"`
	Color string `toml:"color" json:"color"`
}

// WidgetConfig 描述该服务挂载的 Widget 类型与展示参数。
type WidgetConfig struct {
	Type            string         `toml:"type" json:"type"`
	Title           string         `toml:"title" json:"title"`
	RefreshInterval int            `toml:"refresh_interval" json:"refresh_interval"`
	Display         map[string]any `toml:"display" json:"display"`
}

// HealthConfig 描述健康检查规则。
type HealthConfig struct {
	Endpoint string `toml:"endpoint" json:"endpoint"`
	Method   string `toml:"method" json:"method"`
	Timeout  int    `toml:"timeout" json:"timeout"` // 秒
}

// ============================================================
// 提供者实例 — config/providers/<owner>/<id>.toml
// 描述「breeze 如何使用这个服务」，仅覆写差异字段。
// ============================================================

// ProviderInstance 描述一个具体的个人实例，通过 BaseService 继承模板。
type ProviderInstance struct {
	BaseService string          `toml:"base_service" json:"base_service"`
	Instance    InstanceConfig  `toml:"instance" json:"instance"`
	Override    *OverrideConfig `toml:"override,omitempty" json:"override,omitempty"`
}

// InstanceConfig 描述实例的具体地址与凭证引用。
type InstanceConfig struct {
	Name           string `toml:"name" json:"name"`
	URL            string `toml:"url" json:"url"`
	APIEndpoint    string `toml:"api_endpoint" json:"api_endpoint"`
	RSSURL         string `toml:"rss_url" json:"rss_url"`
	CredentialsRef string `toml:"credentials_ref" json:"credentials_ref"`
	Status         string `toml:"status" json:"status"` // active | inactive | error
}

// OverrideConfig 允许实例覆写模板的 widget 配置。
type OverrideConfig struct {
	Widget WidgetConfig `toml:"widget"`
}

// ============================================================
// 合并后的服务 — 给 API 返回用
// ============================================================

// MergedService 是模板与实例合并后的最终结果，前端直接消费。
type MergedService struct {
	ID          string         `json:"id"`
	BaseID      string         `json:"base_id"`
	Name        string         `json:"name"`
	Category    string         `json:"category"`
	Description string         `json:"description"`
	Icon        IconConfig     `json:"icon"`
	Widget      WidgetConfig   `json:"widget"`
	Instance    InstanceConfig `json:"instance"`
	HealthCheck *HealthConfig  `json:"health_check,omitempty"`
}
