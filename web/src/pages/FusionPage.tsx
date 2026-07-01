import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { TopBar } from "@/components/layout/TopBar";
import { fusionAPI, type FusionSite } from "@/api/fusion";
import { Layers, ExternalLink, AlertCircle, ArrowLeft } from "lucide-react";

/**
 * FusionPage — 融合页面
 * 
 * 全屏嵌入模式：点击站点后 iframe 占满整个屏幕（除了导航栏）
 */
export function FusionPage() {
  const [theme, toggleTheme] = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSite, setSelectedSite] = useState<FusionSite | null>(null);

  const { data: sites = [], isLoading, error } = useQuery({
    queryKey: ["fusion", "sites"],
    queryFn: fusionAPI.list,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: 2,
  });

  // 从 URL 参数中读取站点 ID 并自动选中
  useEffect(() => {
    const siteId = searchParams.get("site");
    if (siteId && sites.length > 0) {
      const site = sites.find((s: FusionSite) => s.id === siteId);
      if (site) {
        setSelectedSite(site);
      }
    }
  }, [searchParams, sites]);

  // 选中站点时更新 URL
  const handleSelectSite = (site: FusionSite) => {
    setSelectedSite(site);
    setSearchParams({ site: site.id });
  };

  // 返回列表时清除 URL 参数
  const handleBackToList = () => {
    setSelectedSite(null);
    setSearchParams({});
  };

  // 如果已选择站点，使用全屏布局
  if (selectedSite) {
    return (
      <div className="flex h-screen flex-col">
        {/* 顶部导航栏 */}
        <TopBar theme={theme} onToggleTheme={toggleTheme} />

        {/* 站点控制栏 */}
        <div
          className="flex items-center justify-between border-b px-6 py-3"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-card)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all hover:scale-105"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-primary)",
              }}
            >
              <ArrowLeft size={16} />
              返回
            </button>
            <div
              className="h-8 w-8 flex items-center justify-center rounded-lg"
              style={{ background: selectedSite.icon_color }}
            >
              <Layers size={16} style={{ color: "white" }} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {selectedSite.name}
              </h3>
            </div>
          </div>
          <a
            href={selectedSite.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all hover:scale-105"
            style={{
              background: "var(--accent-primary)",
              color: "var(--bg-primary)",
            }}
          >
            新窗口打开
            <ExternalLink size={14} />
          </a>
        </div>

        {/* 全屏 iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={selectedSite.url}
            className="h-full w-full border-0"
            title={selectedSite.name}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            onError={(e) => {
              console.error('Failed to load site:', selectedSite.url, e);
            }}
          />
        </div>
      </div>
    );
  }

  // 列表视图（默认）
  return (
    <div className="flex h-screen flex-col">
      <TopBar theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-6 py-6">
          {/* 页头 */}
          <div className="glass-card mb-6 p-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--accent-primary)" }}
              >
                <Layers size={24} style={{ color: "var(--bg-primary)" }} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold gradient-text"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  融合中心
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  点击站点卡片即可全屏嵌入浏览
                </p>
              </div>
            </div>
          </div>

          {/* 加载状态 */}
          {isLoading && (
            <div className="glass-card p-12 text-center">
              <div
                className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                style={{ borderColor: "var(--accent-primary)" }}
              />
              <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
                加载中...
              </p>
            </div>
          )}

          {/* 错误状态 */}
          {error && !isLoading && (
            <div className="glass-card p-12 text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, #ef4444 20%, transparent)" }}
              >
                <AlertCircle size={32} style={{ color: "#ef4444" }} />
              </div>
              <h2
                className="mb-2 text-lg font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                加载失败
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                无法加载融合站点列表
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--bg-primary)",
                }}
              >
                重新加载
              </button>
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && !error && sites.length === 0 && (
            <div className="glass-card p-12 text-center">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--accent-primary) 20%, transparent)" }}
              >
                <Layers size={32} style={{ color: "var(--accent-primary)" }} />
              </div>
              <h2
                className="mb-2 text-lg font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                暂无融合站点
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                前往管理后台添加站点
              </p>
              <a
                href="/admin/fusion"
                className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--bg-primary)",
                }}
              >
                前往添加
              </a>
            </div>
          )}

          {/* 站点卡片网格 */}
          {!isLoading && !error && sites.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site: FusionSite) => (
                <button
                  key={site.id}
                  onClick={() => handleSelectSite(site)}
                  className="glass-card p-6 text-left transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: site.icon_color }}
                    >
                      <Layers size={24} style={{ color: "white" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-lg font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {site.name}
                      </h3>
                      {site.description && (
                        <p
                          className="mt-1 text-sm line-clamp-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {site.description}
                        </p>
                      )}
                      <p
                        className="mt-2 text-xs truncate"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        {site.url}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
