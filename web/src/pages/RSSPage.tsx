import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { rssAPI } from "@/api/admin";
import { Rss, ExternalLink, Calendar } from "lucide-react";
import { formatRelativeTime } from "@/utils/time";

/**
 * RSSPage — RSS 文章阅读页面
 * 
 * 展示所有 RSS 订阅源的文章列表，支持按订阅源筛选。
 */
export function RSSPage() {
  const [theme, toggleTheme] = useTheme();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const { data: articles = [], isLoading, error: articlesError } = useQuery({
    queryKey: ["rss", "articles"],
    queryFn: () => rssAPI.listArticles({ limit: 100 }),
    retry: 2,
    staleTime: 30 * 1000, // 30秒内复用缓存
  });

  const { data: sources = [], error: sourcesError } = useQuery({
    queryKey: ["rss", "sources"],
    queryFn: rssAPI.listSources,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5分钟内复用缓存
  });

  // 创建 source ID 到 source 的映射
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // 筛选文章
  const filteredArticles = selectedSourceId
    ? articles.filter((a) => a.source_id === selectedSourceId)
    : articles;

  // 统计每个订阅源的文章数量
  const sourceStats = new Map<string, number>();
  articles.forEach((a) => {
    sourceStats.set(a.source_id, (sourceStats.get(a.source_id) || 0) + 1);
  });

  return (
    <>
      <TopBar theme={theme} onToggleTheme={toggleTheme} />
      <main className="mx-auto w-full max-w-4xl px-6 py-6">
        {/* 页头 */}
        <div className="glass-card mb-6 p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-primary)" }}
            >
              <Rss size={24} style={{ color: "var(--bg-primary)" }} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                RSS 订阅
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {sources.length} 个订阅源，
                {selectedSourceId
                  ? `${filteredArticles.length} / ${articles.length} 篇文章`
                  : `${articles.length} 篇文章`}
              </p>
            </div>
          </div>
        </div>

        {/* 订阅源标签筛选器 */}
        {sources.length > 0 && (
          <div className="glass-card mb-6 p-4">
            <div className="flex flex-wrap gap-2">
              {/* 全部标签 */}
              <button
                onClick={() => setSelectedSourceId(null)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 ${
                  selectedSourceId === null
                    ? "ring-2 ring-[var(--accent-primary)]"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  background: selectedSourceId === null ? "var(--accent-primary)" : "var(--bg-card)",
                  color: selectedSourceId === null ? "var(--bg-primary)" : "var(--text-primary)",
                }}
              >
                全部 ({articles.length})
              </button>

              {/* 各订阅源标签 */}
              {sources.map((source) => {
                const count = sourceStats.get(source.id) || 0;
                const isSelected = selectedSourceId === source.id;
                return (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSourceId(source.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 ${
                      isSelected ? "ring-2" : "opacity-70 hover:opacity-100"
                    }`}
                    style={{
                      background: isSelected ? source.icon_color : "var(--bg-card)",
                      color: isSelected ? "#ffffff" : "var(--text-primary)",
                      ...(isSelected && { '--tw-ring-color': source.icon_color } as React.CSSProperties),
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: isSelected ? "#ffffff" : source.icon_color }}
                    />
                    {source.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
        {(articlesError || sourcesError) && (
          <div className="glass-card p-12 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, #ef4444 20%, transparent)" }}
            >
              <Rss size={32} style={{ color: "#ef4444" }} />
            </div>
            <h2
              className="mb-2 text-lg font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              加载失败
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {articlesError?.message || sourcesError?.message || "网络请求失败，请稍后重试"}
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
        {!isLoading && !articlesError && !sourcesError && articles.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Rss
              size={48}
              className="mx-auto mb-4"
              style={{ color: "var(--text-muted)" }}
            />
            <h2
              className="mb-2 text-lg font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              暂无文章
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              请在管理后台添加 RSS 订阅源并抓取文章
            </p>
            <a
              href="/admin/rss"
              className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
              style={{
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
              }}
            >
              前往管理后台
            </a>
          </div>
        )}

        {/* 筛选后无结果 */}
        {!isLoading && !articlesError && !sourcesError && articles.length > 0 && filteredArticles.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              该订阅源暂无文章
            </p>
          </div>
        )}

        {/* 文章列表 */}
        {!isLoading && !articlesError && !sourcesError && filteredArticles.length > 0 && (
          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const source = sourceMap.get(article.source_id);
              return (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card block p-5 transition-all hover:scale-[1.02]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    {source && (
                      <>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: source.icon_color }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: source.icon_color }}
                        >
                          {source.name}
                        </span>
                      </>
                    )}
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      •
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatRelativeTime(article.published_at || article.fetched_at)}
                      </span>
                    </div>
                  </div>

                  <h2
                    className="mb-2 text-lg font-semibold leading-snug group-hover:text-[var(--accent-primary)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {article.title}
                  </h2>

                  {article.excerpt && (
                    <p
                      className="mb-3 line-clamp-2 text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--accent-primary)" }}>
                    <span>阅读原文</span>
                    <ExternalLink size={12} />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
