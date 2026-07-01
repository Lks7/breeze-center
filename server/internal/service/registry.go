// Package service 提供 breeze-center 的服务注册表与查询能力。
// 当前实现基于内存中持有的配置快照；后续可叠加 SQLite 缓存或外部数据源。
package service

import (
	"sort"
	"sync"

	"github.com/breeze/center/internal/config"
)

// Registry 是已加载服务的查询入口。
type Registry struct {
	mu       sync.RWMutex
	services []config.MergedService
	byID     map[string]config.MergedService
}

// NewRegistry 基于 loader 加载结果创建注册表。
func NewRegistry(merged []config.MergedService) *Registry {
	r := &Registry{
		services: merged,
		byID:     make(map[string]config.MergedService, len(merged)),
	}
	for _, s := range merged {
		r.byID[s.ID] = s
	}
	return r
}

// All 返回所有服务，按 category 然后 name 排序。
func (r *Registry) All() []config.MergedService {
	r.mu.RLock()
	defer r.mu.RUnlock()

	out := make([]config.MergedService, len(r.services))
	copy(out, r.services)
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Category != out[j].Category {
			return out[i].Category < out[j].Category
		}
		return out[i].Name < out[j].Name
	})
	return out
}

// Get 按 id 返回单个服务。第二个返回值表示是否存在。
func (r *Registry) Get(id string) (config.MergedService, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.byID[id]
	return s, ok
}

// ByCategory 返回按 category 分组的服务。
func (r *Registry) ByCategory() map[string][]config.MergedService {
	r.mu.RLock()
	defer r.mu.RUnlock()

	out := make(map[string][]config.MergedService)
	for _, s := range r.services {
		out[s.Category] = append(out[s.Category], s)
	}
	return out
}

// Widgets 返回所有服务的 widget 配置，按 refresh_interval 升序。
func (r *Registry) Widgets() []config.MergedService {
	r.mu.RLock()
	defer r.mu.RUnlock()

	out := make([]config.MergedService, len(r.services))
	copy(out, r.services)
	sort.SliceStable(out, func(i, j int) bool {
		return out[i].Widget.RefreshInterval < out[j].Widget.RefreshInterval
	})
	return out
}

// ReloadFromMerged 直接使用已合并的服务列表重新加载注册表
func (r *Registry) ReloadFromMerged(merged []config.MergedService) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.services = merged
	r.byID = make(map[string]config.MergedService, len(merged))
	for _, s := range merged {
		r.byID[s.ID] = s
	}
}
