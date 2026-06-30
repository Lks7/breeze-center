import { Rss } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import type { BlogPost } from "@/types/entities";
import { formatRelativeTime } from "@/utils/time";

/**
 * RssFeedWidget — 最新文章列表（来自本地博客 SQLite 数据）
 *
 * 之前是 mock RSS 文章流，现在改为读取 blogAPI 的真实文章。
 * 名字保留 RssFeedWidget 是因为后续接入真实 RSS 抓取后这里会混合显示。
 */
export function RssFeedWidget({
  enterDelay,
  posts = [],
  to = "/blog",
}: {
  enterDelay?: number;
  posts?: BlogPost[];
  to?: string;
}) {
  const recent = posts
    .filter((p) => p.status === "published")
    .slice(0, 5);

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
          暂无已发布文章
        </p>
      ) : (
        <ul className="scroll-hidden -mx-1 max-h-[220px] space-y-1 overflow-y-auto pr-1">
          {recent.map((post) => (
            <li key={post.id}>
              <a
                href="#"
                className="group flex items-start gap-2 rounded-lg px-2 py-2 transition hover:bg-[var(--bg-card-hover)]"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--accent-primary)" }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm transition group-hover:text-[var(--accent-primary)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {post.tags
                      ? post.tags.split(",").slice(0, 2).join(" · ")
                      : "未分类"}
                    {" · "}
                    {formatRelativeTime(post.published_at || post.created_at)}
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
