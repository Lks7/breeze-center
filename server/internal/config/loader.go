package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/BurntSushi/toml"
)

// Loader 负责从 config/ 目录读取并合并配置。
type Loader struct {
	configDir string
}

// NewLoader 创建一个指向指定 config 目录的加载器。
func NewLoader(configDir string) *Loader {
	return &Loader{configDir: configDir}
}

// Load 读取 site.toml + services/ + providers/personal/，
// 返回合并后的站点配置与服务列表。
func (l *Loader) Load() (*SiteConfig, []MergedService, error) {
	site, err := l.loadSite()
	if err != nil {
		return nil, nil, err
	}

	templates, err := l.loadServiceTemplates()
	if err != nil {
		return nil, nil, err
	}

	merged, err := l.loadProviderInstances(templates)
	if err != nil {
		return nil, nil, err
	}

	return site, merged, nil
}

// loadSite 读取 config/site.toml。
func (l *Loader) loadSite() (*SiteConfig, error) {
	path := filepath.Join(l.configDir, "site.toml")
	var site SiteConfig
	if _, err := toml.DecodeFile(path, &site); err != nil {
		return nil, fmt.Errorf("decode site.toml: %w", err)
	}
	if site.Server.Port == 0 {
		site.Server.Port = 8080
	}
	if site.Language == "" {
		site.Language = "zh-CN"
	}
	if len(site.Server.CORSOrigins) == 0 {
		// 默认允许本机前端开发端口
		site.Server.CORSOrigins = []string{"http://localhost:4321", "http://127.0.0.1:4321"}
	}
	return &site, nil
}

// loadServiceTemplates 扫描 config/services/*.toml，建立 id → template 映射。
func (l *Loader) loadServiceTemplates() (map[string]ServiceTemplate, error) {
	dir := filepath.Join(l.configDir, "services")
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("read services dir: %w", err)
	}

	templates := make(map[string]ServiceTemplate, len(entries))
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".toml") {
			continue
		}
		path := filepath.Join(dir, e.Name())
		var t ServiceTemplate
		if _, err := toml.DecodeFile(path, &t); err != nil {
			return nil, fmt.Errorf("decode %s: %w", e.Name(), err)
		}
		if t.ID == "" {
			// 用文件名作为兜底 id
			t.ID = strings.TrimSuffix(e.Name(), ".toml")
		}
		templates[t.ID] = t
	}
	return templates, nil
}

// loadProviderInstances 扫描 config/providers/personal/*.toml，
// 对每个实例找 base_service 合并字段。
func (l *Loader) loadProviderInstances(templates map[string]ServiceTemplate) ([]MergedService, error) {
	dir := filepath.Join(l.configDir, "providers", "personal")
	entries, err := os.ReadDir(dir)
	if err != nil {
		// providers 目录可以为空（仅有模板无实例是合法状态）
		return []MergedService{}, nil
	}

	var merged []MergedService
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".toml") {
			continue
		}
		path := filepath.Join(dir, e.Name())
		var p ProviderInstance
		if _, err := toml.DecodeFile(path, &p); err != nil {
			return nil, fmt.Errorf("decode %s: %w", e.Name(), err)
		}

		tpl, ok := templates[p.BaseService]
		if !ok {
			return nil, fmt.Errorf("provider %s references unknown base_service %q", e.Name(), p.BaseService)
		}

		merged = append(merged, mergeService(tpl, p, strings.TrimSuffix(e.Name(), ".toml")))
	}
	return merged, nil
}

// mergeService 把模板与实例合并为最终的 MergedService。
//
// 合并规则：
//   - 模板字段作为默认值
//   - 实例的 instance 字段直接挂载
//   - 实例的 override.widget 整体覆盖模板的 widget
func mergeService(tpl ServiceTemplate, p ProviderInstance, fileSlug string) MergedService {
	widget := tpl.Widget
	if p.Override != nil {
		widget = p.Override.Widget
	}
	if widget.Type == "" {
		widget.Type = tpl.Widget.Type
	}
	if widget.Title == "" {
		widget.Title = tpl.Widget.Title
	}
	if widget.RefreshInterval == 0 {
		widget.RefreshInterval = tpl.Widget.RefreshInterval
	}

	return MergedService{
		ID:          fileSlug,
		BaseID:      tpl.ID,
		Name:        tpl.Name,
		Category:    tpl.Category,
		Description: tpl.Description,
		Icon:        tpl.Icon,
		Widget:      widget,
		Instance:    p.Instance,
		HealthCheck: tpl.HealthCheck,
	}
}
