import { Rss } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import type { RSSArticle } from "@/types/entities";
import { formatRelativeTime } from "@/utils/time";

/**
 * RssFeedWidget — RSS 文章流
 * 
 * 显示从外部 RSS 源抓取的最新文章。
 */
export function RssFeedWidget({
  enterDelay,
  articles = [],
  to = "/blog",
}: {
  enterDelay?: number;
  articles?: RSSArticle[];
  to?: string;
}) {
  const recent = articles.slice(0, 5);

  return (
    <WidgetCard
      title="文章动态"
      icon={<Rss size={16} />}
      status={recent.length > 0 ? "ok" : "idle"}
      enterDelay={enterDelay}
      to={to}
    >
      {recent.length === 0 ? (
        <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          暂无文章，请添加 RSS 订阅源
        </p>
      ) : (
        <ul className="scroll-hidden -mx-1 max-h-[220px] space-y-1 overflow-y-auto pr-1">
          {recent.map((article) => (
            <li key={article.id}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 rounded-lg px-2 py-2 transition hover:bg-[var(--bg-card-hover)]"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--accent-primary)" }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="line-clamp-2 text-sm transition group-hover:text-[var(--accent-primary)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {article.title}
                  </p>
                  {article.excerpt && (
                    <p
                      className="mt-0.5 line-clamp-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {article.excerpt}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatRelativeTime(article.published_at || article.fetched_at)}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
