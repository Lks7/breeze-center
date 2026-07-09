import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowLeft,
  Bookmark,
  CalendarPlus,
  Clock3,
  ExternalLink,
  Filter,
  Hash,
  Inbox,
  Loader2,
  Plus,
  Save,
  Tags,
  Trash2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GradientText } from "@/components/ui/GradientText";
import { bookmarkAPI } from "@/api/admin";
import type { Bookmark as BookmarkType } from "@/types/entities";

const GROUP_LABEL: Record<string, string> = {
  general: "常用",
  later: "稍后再读",
  dev: "开发",
  tech: "技术",
  life: "生活",
  read: "阅读",
};

type BookmarkDraft = Pick<
  BookmarkType,
  | "title"
  | "url"
  | "description"
  | "summary"
  | "category"
  | "tags"
  | "thumbnail_url"
  | "icon"
  | "sort_order"
>;

export function BookmarksPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const pageRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [quickUrl, setQuickUrl] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [group, setGroup] = useState("later");
  const [tags, setTags] = useState("稍后再读");
  const [batchText, setBatchText] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [activeTag, setActiveTag] = useState("all");
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BookmarkType | null>(null);

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["bookmarks", "list"],
    queryFn: bookmarkAPI.list,
  });

  useEffect(() => {
    const url = searchParams.get("url");
    const title = searchParams.get("title");
    if (url) setQuickUrl(url);
    if (title) setQuickTitle(title);
  }, [searchParams]);

  const createMutation = useMutation({
    mutationFn: (body: Partial<BookmarkType>) => bookmarkAPI.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks", "list"] });
      setQuickUrl("");
      setQuickTitle("");
      setFormError("");
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (drafts: BookmarkDraft[]) => {
      await Promise.all(drafts.map((draft) => bookmarkAPI.create(draft)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks", "list"] });
      setBatchText("");
      setFormError("");
    },
  });

  const openMutation = useMutation({
    mutationFn: bookmarkAPI.markOpened,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks", "list"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: bookmarkAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks", "list"] });
      setDeleteTarget(null);
    },
  });

  const groups = useMemo(
    () => unique(bookmarks.map((item) => item.category || "general")).sort(),
    [bookmarks]
  );
  const allTags = useMemo(
    () => unique(bookmarks.flatMap((item) => parseTags(item.tags))).sort(),
    [bookmarks]
  );

  const filtered = useMemo(() => {
    return bookmarks
      .filter((item) => activeGroup === "all" || item.category === activeGroup)
      .filter((item) => activeTag === "all" || parseTags(item.tags).includes(activeTag))
      .sort((a, b) => {
        const staleDiff = unopenedDays(b) - unopenedDays(a);
        if (staleDiff !== 0) return staleDiff;
        return a.sort_order - b.sort_order;
      });
  }, [activeGroup, activeTag, bookmarks]);

  const grouped = useMemo(() => {
    const map = new Map<string, BookmarkType[]>();
    for (const item of filtered) {
      const key = item.category || "general";
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  useEffect(() => {
    if (!captureRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        captureRef.current,
        { autoAlpha: 0, y: 12, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }
      );
    }, captureRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (isLoading || !pageRef.current) return;
    const cards = pageRef.current.querySelectorAll("[data-bookmark-card]");
    if (cards.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.34,
          ease: "power2.out",
          stagger: { each: 0.035, from: "start" },
        }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [activeGroup, activeTag, filtered.length, isLoading]);

  function buildDraft(url: string, title?: string): BookmarkDraft {
    const normalizedUrl = normalizeUrl(url);
    const cleanTitle = title?.trim() || deriveTitle(normalizedUrl);
    return {
      title: cleanTitle,
      url: normalizedUrl,
      description: "",
      summary: "",
      category: group.trim() || "later",
      tags: tags.trim(),
      thumbnail_url: "",
      icon: "",
      sort_order: 0,
    };
  }

  function submitQuick(e: FormEvent) {
    e.preventDefault();
    if (!quickUrl.trim()) {
      setFormError("请输入 URL");
      return;
    }
    const draft = buildDraft(quickUrl, quickTitle);
    if (!isValidHttpUrl(draft.url)) {
      setFormError("URL 格式不正确");
      return;
    }
    createMutation.mutate(draft);
  }

  function submitBatch() {
    const drafts = batchText
      .split(/\r?\n/)
      .map((line) => parseBatchLine(line, group, tags))
      .filter((draft): draft is BookmarkDraft => !!draft);
    if (drafts.length === 0) {
      setFormError("粘贴一行或多行 URL 后再保存");
      return;
    }
    batchMutation.mutate(drafts);
  }

  return (
    <div ref={pageRef} className="mx-auto w-full max-w-6xl px-6 py-6">
      <div className="mb-5 flex items-center gap-3">
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

      <GlassCard ref={captureRef} interactive={false} className="mb-5 !p-4">
        <form onSubmit={submitQuick} className="space-y-3">
          <div className="flex items-center gap-2">
            <Inbox size={16} style={{ color: "var(--accent-primary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              快速收集
            </h2>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Enter 保存单条，批量区域可一次粘贴多行
            </span>
          </div>

          <div className="grid gap-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_120px_180px_auto]">
            <input
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="bookmark-input"
              autoComplete="off"
            />
            <input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="标题可选"
              className="bookmark-input"
              autoComplete="off"
            />
            <input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="分组"
              list="bookmark-group-options"
              className="bookmark-input"
              autoComplete="off"
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="标签，逗号分隔"
              list="bookmark-tag-options"
              className="bookmark-input"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:opacity-50"
              style={{ background: "var(--accent-gradient)" }}
            >
              {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              保存
            </button>
          </div>
          <datalist id="bookmark-group-options">
            {groups.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <datalist id="bookmark-tag-options">
            {allTags.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </form>

        {(groups.length > 0 || allTags.length > 0) && (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {groups.length > 0 && (
              <SuggestionRow label="已有分组">
                {groups.slice(0, 10).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGroup(item)}
                    className="bookmark-suggestion"
                  >
                    {groupLabel(item)}
                  </button>
                ))}
              </SuggestionRow>
            )}
            {allTags.length > 0 && (
              <SuggestionRow label="已有标签">
                {allTags.slice(0, 12).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTags(toggleTag(tags, item).join(", "))}
                    className="bookmark-suggestion"
                  >
                    {item}
                  </button>
                ))}
              </SuggestionRow>
            )}
          </div>
        )}

        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            rows={3}
            placeholder={"批量粘贴：每行一个 URL，也支持「标题 https://...」"}
            className="bookmark-input resize-none"
          />
          <button
            type="button"
            onClick={submitBatch}
            disabled={batchMutation.isPending}
            className="inline-flex min-w-28 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50"
            style={{
              border: "1px solid var(--border-card)",
              color: "var(--text-primary)",
              background: "var(--bg-card)",
            }}
          >
            {batchMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            批量保存
          </button>
        </div>

        {formError && (
          <p className="mt-2 text-xs" style={{ color: "var(--status-error)" }}>
            {formError}
          </p>
        )}
      </GlassCard>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter size={14} style={{ color: "var(--text-muted)" }} />
        <FilterChip active={activeGroup === "all"} onClick={() => setActiveGroup("all")}>
          全部分组
        </FilterChip>
        {groups.map((item) => (
          <FilterChip key={item} active={activeGroup === item} onClick={() => setActiveGroup(item)}>
            {groupLabel(item)}
          </FilterChip>
        ))}
        <span className="mx-1 h-5 w-px" style={{ background: "var(--border-card)" }} />
        <Hash size={14} style={{ color: "var(--text-muted)" }} />
        <FilterChip active={activeTag === "all"} onClick={() => setActiveTag("all")}>
          全部标签
        </FilterChip>
        {allTags.map((item) => (
          <FilterChip key={item} active={activeTag === item} onClick={() => setActiveTag(item)}>
            {item}
          </FilterChip>
        ))}
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
            在上方粘贴 URL 就能开始收集
          </p>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard interactive={false} className="py-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            当前筛选下没有书签
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {grouped.map(([cat, items]) => (
            <section key={cat}>
              <h2
                className="mb-3 flex items-center gap-2 text-xs font-medium uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                {groupLabel(cat)}
                <span className="font-mono normal-case">{items.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <BookmarkCard
                    key={item.id}
                    bookmark={item}
                    onOpen={() => openMutation.mutate(item.id)}
                    onDelete={() => setDeleteTarget(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除书签"
        message={`确定删除「${deleteTarget?.title ?? ""}」吗？`}
        confirmLabel={deleteMutation.isPending ? "删除中..." : "删除"}
        cancelLabel="取消"
        variant="danger"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function SuggestionRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <span className="mt-1 shrink-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function BookmarkCard({
  bookmark,
  onOpen,
  onDelete,
}: {
  bookmark: BookmarkType;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const days = unopenedDays(bookmark);
  const tags = parseTags(bookmark.tags);
  const summary = bookmark.summary || bookmark.description;
  const staleColor = days >= 30 ? "var(--status-warn)" : "var(--text-muted)";

  return (
    <GlassCard data-bookmark-card className="group relative !p-4">
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-3 top-3 z-10 rounded-md p-1.5 transition hover:brightness-110"
        title="删除书签"
        style={{
          background: "color-mix(in srgb, var(--status-error) 10%, var(--bg-card))",
          color: "var(--status-error)",
        }}
      >
        <Trash2 size={13} />
      </button>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        className="block"
      >
        <div className="flex items-start gap-3">
          <BookmarkThumb bookmark={bookmark} />
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-sm font-medium transition group-hover:text-[var(--accent-primary)]"
              style={{ color: "var(--text-primary)" }}
            >
              {bookmark.title}
            </h3>
            {summary && (
              <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {summary}
              </p>
            )}
            <p className="mt-1 flex items-center gap-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>
              <ExternalLink size={10} />
              {bookmark.url.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
                style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
              >
                <Tags size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="inline-flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <CalendarPlus size={11} />
            保存 {formatDate(bookmark.created_at)}
          </span>
          <span className="inline-flex items-center gap-1" style={{ color: staleColor }}>
            <Clock3 size={11} />
            未打开 {days} 天
          </span>
        </div>
      </a>
    </GlassCard>
  );
}

function BookmarkThumb({ bookmark }: { bookmark: BookmarkType }) {
  if (bookmark.thumbnail_url) {
    return (
      <img
        src={bookmark.thumbnail_url}
        alt=""
        className="h-12 w-16 shrink-0 rounded object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  if (bookmark.icon && /^https?:\/\//i.test(bookmark.icon)) {
    return (
      <img
        src={bookmark.icon}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg object-contain p-1"
        style={{ background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
      style={{
        background: "color-mix(in srgb, var(--accent-primary) 18%, transparent)",
        color: "var(--accent-primary)",
      }}
    >
      {bookmark.title.charAt(0).toUpperCase()}
    </span>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-2.5 py-1 text-xs transition"
      style={{
        border: "1px solid var(--border-card)",
        background: active ? "var(--accent-primary)" : "var(--bg-card)",
        color: active ? "white" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function parseBatchLine(line: string, group: string, tags: string): BookmarkDraft | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const tokens = trimmed.split(/\s+/);
  const urlToken = tokens.find((token) => looksLikeUrl(token));
  if (!urlToken) return null;
  const url = normalizeUrl(urlToken);
  if (!isValidHttpUrl(url)) return null;
  const title = trimmed.replace(urlToken, "").trim() || deriveTitle(url);
  return {
    title,
    url,
    description: "",
    summary: "",
    category: group.trim() || "later",
    tags: tags.trim(),
    thumbnail_url: "",
    icon: "",
    sort_order: 0,
  };
}

function parseTags(value: string): string[] {
  return unique(
    (value || "")
      .split(/[,，\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  );
}

function toggleTag(value: string, tag: string): string[] {
  const current = parseTags(value);
  if (current.includes(tag)) {
    return current.filter((item) => item !== tag);
  }
  return [...current, tag];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^www\./i.test(value) || /^[\w-]+(\.[\w-]+)+/.test(value);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function deriveTitle(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function unopenedDays(bookmark: BookmarkType): number {
  const base = bookmark.last_opened_at || bookmark.created_at;
  const time = new Date(base).getTime();
  if (!base || Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function formatDate(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

function groupLabel(value: string): string {
  return GROUP_LABEL[value] ?? value;
}
