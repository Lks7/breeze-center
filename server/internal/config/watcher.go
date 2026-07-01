package config

import (
	"log"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// Watcher 监听配置文件变化并触发重新加载
type Watcher struct {
	loader   *Loader
	watcher  *fsnotify.Watcher
	mu       sync.RWMutex
	site     *SiteConfig
	services []MergedService
	onChange func(*SiteConfig, []MergedService)
}

// NewWatcher 创建配置监听器
func NewWatcher(loader *Loader, onChange func(*SiteConfig, []MergedService)) (*Watcher, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	w := &Watcher{
		loader:   loader,
		watcher:  watcher,
		onChange: onChange,
	}

	return w, nil
}

// Start 启动配置文件监听
func (w *Watcher) Start() error {
	// 监听整个 config 目录及其子目录
	configDir := w.loader.configDir
	if err := w.addRecursive(configDir); err != nil {
		return err
	}

	// 后台监听文件变化
	go w.watch()

	log.Printf("[ConfigWatcher] Started watching %s", configDir)
	return nil
}

// Stop 停止监听
func (w *Watcher) Stop() error {
	return w.watcher.Close()
}

// addRecursive 递归添加目录监听
func (w *Watcher) addRecursive(dir string) error {
	if err := w.watcher.Add(dir); err != nil {
		return err
	}

	// 监听子目录
	subdirs := []string{"services", "providers"}
	for _, sub := range subdirs {
		subpath := filepath.Join(dir, sub)
		if err := w.watcher.Add(subpath); err != nil {
			log.Printf("[ConfigWatcher] Warning: cannot watch %s: %v", subpath, err)
		}
	}

	// 监听 providers/personal
	personalPath := filepath.Join(dir, "providers", "personal")
	if err := w.watcher.Add(personalPath); err != nil {
		log.Printf("[ConfigWatcher] Warning: cannot watch %s: %v", personalPath, err)
	}

	return nil
}

// watch 监听文件变化事件
func (w *Watcher) watch() {
	// 防抖：避免短时间内多次触发重载
	var debounceTimer *time.Timer
	const debounceDelay = 500 * time.Millisecond

	for {
		select {
		case event, ok := <-w.watcher.Events:
			if !ok {
				return
			}

			// 只关心 .toml 文件的写入和创建事件
			if filepath.Ext(event.Name) != ".toml" {
				continue
			}
			if event.Op&(fsnotify.Write|fsnotify.Create) == 0 {
				continue
			}

			log.Printf("[ConfigWatcher] Detected change: %s", event.Name)

			// 防抖：取消之前的定时器，重新开始计时
			if debounceTimer != nil {
				debounceTimer.Stop()
			}

			debounceTimer = time.AfterFunc(debounceDelay, func() {
				w.reload()
			})

		case err, ok := <-w.watcher.Errors:
			if !ok {
				return
			}
			log.Printf("[ConfigWatcher] Error: %v", err)
		}
	}
}

// reload 重新加载配置
func (w *Watcher) reload() {
	log.Println("[ConfigWatcher] Reloading configuration...")

	site, services, err := w.loader.Load()
	if err != nil {
		log.Printf("[ConfigWatcher] Reload failed: %v", err)
		return
	}

	w.mu.Lock()
	w.site = site
	w.services = services
	w.mu.Unlock()

	log.Printf("[ConfigWatcher] Configuration reloaded: %d services", len(services))

	// 触发回调通知外部
	if w.onChange != nil {
		w.onChange(site, services)
	}
}

// GetCurrent 获取当前配置（线程安全）
func (w *Watcher) GetCurrent() (*SiteConfig, []MergedService) {
	w.mu.RLock()
	defer w.mu.RUnlock()
	return w.site, w.services
}
