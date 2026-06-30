import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, Loader2, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { bookmarkAPI } from "@/api/admin";
import type { Bookmark as BookmarkType } from "@/types/entities";

const CATEGORY_LABEL: Record<string, string> = {
  general: "常用",
  dev: "开发",
  tech: "技术",
  life: "生活",
  read: "阅读",
};

export function BookmarksPage() {
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["bookmarks", "list"],
    queryFn: bookmarkAPI.list,
  });

  // 按分类分组
  const grouped = new Map<string, BookmarkType[]>();
  for (const b of bookmarks) {
    const arr = grouped.get(b.category) ?? [];
    arr.push(b);
    grouped.set(b.category, arr);
  }
  const categories = [...grouped.keys()].sort();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6">
      {/* 顶部 */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          className="btn-ghost"
          style={{ border: "1px solid var(--border-card)" }}
        >
          <ArrowLeft size={15} />
          首页
        </Link>
        <h1 className="text-2xl font-semibold">
          <GradientText>书签墙</GradientText>
        </h1>
        <Link
          to="/admin/bookmarks"
          className="btn-ghost ml-auto"
          style={{ border: "1px solid var(--border-card)" }}
          title="管理书签"
        >
          <Bookmark size={14} />
          管理
        </Link>
      </div>

      {isLoading ? (
        <div
          className="flex items-center gap-2 py-12 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      ) : bookmarks.length === 0 ? (
        <GlassCard interactive={false} className="py-16 text-center">
          <Bookmark
            size={32}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            还没有书签
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            前往{" "}
            <Link
              to="/admin/bookmarks"
              className="underline"
              style={{ color: "var(--accent-primary)" }}
            >
              管理后台
            </Link>{" "}
            添加第一个书签
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const items = (grouped.get(cat) ?? []).sort(
              (a, b) => a.sort_order - b.sort_order
            );
            return (
              <section key={cat}>
                <h2
                  className="mb-3 text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  {CATEGORY_LABEL[cat] ?? cat}
                  <span className="ml-2 font-mono normal-case" style={{ color: "var(--text-muted)" }}>
                    {items.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((b) => (
                    <BookmarkCard key={b.id} bookmark={b} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookmarkCard({ bookmark }: { bookmark: BookmarkType }) {
  return (
    <GlassCard className="group !p-4">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          style={{
            background: "color-mix(in srgb, var(--accent-primary) 18%, transparent)",
            color: "var(--accent-primary)",
          }}
        >
          {bookmark.title.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-medium transition group-hover:text-[var(--accent-primary)]"
            style={{ color: "var(--text-primary)" }}
          >
            {bookmark.title}
          </h3>
          {bookmark.description && (
            <p
              className="mt-0.5 line-clamp-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {bookmark.description}
            </p>
          )}
          <p
            className="mt-1 flex items-center gap-1 truncate text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <ExternalLink size={10} />
            {bookmark.url.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </a>
    </GlassCard>
  );
}
