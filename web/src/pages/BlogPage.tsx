import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2, Search } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { blogAPI } from "@/api/admin";
import type { BlogPost } from "@/types/entities";
import { formatRelativeTime } from "@/utils/time";

export function BlogPage() {
  const [query, setQuery] = useState("");
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog", "posts"],
    queryFn: blogAPI.list,
  });

  // 仅展示已发布的，按 published_at 倒序
  const published = posts
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.published_at || b.created_at).localeCompare(a.published_at || a.created_at));

  // 客户端搜索（标题 + 标签 + 摘要）
  const filtered = query.trim()
    ? published.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.toLowerCase().includes(q)
        );
      })
    : published;

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
          <GradientText>博客文章</GradientText>
        </h1>
        <Link
          to="/admin/blog"
          className="btn-ghost ml-auto"
          style={{ border: "1px solid var(--border-card)" }}
          title="管理文章"
        >
          <BookOpen size={14} />
          管理
        </Link>
      </div>

      {/* 搜索 */}
      <div className="relative mb-6">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索文章标题、标签、摘要..."
          className="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div
          className="flex items-center gap-2 py-12 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard interactive={false} className="py-16 text-center">
          <BookOpen
            size={32}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            {query ? "没有匹配的文章" : "还没有已发布的文章"}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            前往{" "}
            <Link
              to="/admin/blog"
              className="underline"
              style={{ color: "var(--accent-primary)" }}
            >
              管理后台
            </Link>{" "}
            发布第一篇
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const tags = post.tags
    ? post.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <GlassCard className="group cursor-pointer !p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2
            className="text-lg font-medium transition group-hover:text-[var(--accent-primary)]"
            style={{ color: "var(--text-primary)" }}
          >
            {post.title}
          </h2>
          {post.excerpt && (
            <p
              className="mt-1 line-clamp-2 text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {post.excerpt}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded px-1.5 py-0.5"
                style={{
                  background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
                  color: "var(--accent-primary)",
                }}
              >
                #{tag}
              </span>
            ))}
            <span style={{ color: "var(--text-muted)" }}>
              · {formatRelativeTime(post.published_at || post.created_at)}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
