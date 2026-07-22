/**
 * CommandPalette — Spotlight 风格命令面板
 *
 * 按 / 或 Cmd+K 打开，搜索页面、服务、书签。
 * ↑↓ 导航 · Enter 打开 · Esc 关闭。
 *
 * 无搜索词时展示所有页面 + 服务（可浏览），
 * 有搜索词时 fuzzy 匹配所有数据源（含书签）。
 */

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  TrendingUp,
  Server,
  Layers,
  Rss,
  CreditCard,
  CheckSquare,
  Flame,
  Bookmark as BookmarkIcon,
  Bell,
  Github,
  FolderOpen,
  LayoutDashboard,
  ExternalLink,
  Command,
} from "lucide-react";
import { bookmarkAPI, serviceAPI } from "@/api/admin";

// ──────────── Page Definitions ────────────

interface PageEntry {
  to: string;
  label: string;
  icon: typeof Home;
  description: string;
}

const PAGES: PageEntry[] = [
  { to: "/", label: "首页", icon: Home, description: "个人中心" },
  { to: "/plans", label: "目标管理", icon: CheckSquare, description: "待办与习惯打卡" },
  { to: "/fund", label: "基金盈亏", icon: TrendingUp, description: "基金持仓与收益" },
  { to: "/services", label: "快捷导航", icon: Server, description: "所有接入服务" },
  { to: "/fusion", label: "融合站点", icon: Layers, description: "聚合内容展示" },
  { to: "/rss", label: "RSS 订阅", icon: Rss, description: "订阅源与文章" },
  { to: "/subscriptions", label: "订阅管理", icon: CreditCard, description: "订阅中心" },
  { to: "/habits", label: "习惯打卡", icon: Flame, description: "每日习惯追踪" },
  { to: "/bookmarks", label: "书签墙", icon: BookmarkIcon, description: "书签收集" },
  { to: "/notifications", label: "通知中心", icon: Bell, description: "系统通知" },
  { to: "/github", label: "GitHub", icon: Github, description: "代码仓库动态" },
  { to: "/files", label: "文件中心", icon: FolderOpen, description: "文件管理" },
  { to: "/admin", label: "后台管理", icon: LayoutDashboard, description: "管理所有数据" },
];

// ──────────── Fuzzy Search ────────────

function fuzzyScore(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  let consecutive = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (q[qi] === t[ti]) {
      qi++;
      consecutive++;
      score += consecutive * 2;
      if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "/") score += 5;
    } else {
      consecutive = 0;
    }
  }
  return qi === q.length ? Math.max(1, score) : 0;
}

// ──────────── Result Types ────────────

type ResultGroup = "页面" | "服务" | "书签";

interface SearchResult {
  id: string;
  group: ResultGroup;
  label: string;
  description: string;
  icon: typeof Home;
  iconColor?: string;
  statusDot?: "active" | "inactive" | "error";
  href?: string;
  external?: boolean;
  score: number;
  onSelect: () => void;
}

// ──────────── Component ────────────

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 获取服务数据（仅面板打开时拉取）
  const { data: services = [] } = useQuery({
    queryKey: ["command-palette", "services"],
    queryFn: serviceAPI.list,
    staleTime: 60 * 1000,
    enabled: isOpen,
  });

  // 获取书签数据
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["command-palette", "bookmarks"],
    queryFn: bookmarkAPI.list,
    staleTime: 60 * 1000,
    enabled: isOpen,
  });

  // ── 构建搜索结果 ──

  const results = useMemo<SearchResult[]>(() => {
    const out: SearchResult[] = [];

    // 1) 页面：永远展示，有查询词时过滤
    for (const p of PAGES) {
      const s = Math.max(
        fuzzyScore(query, p.label),
        fuzzyScore(query, p.description),
        fuzzyScore(query, p.to),
      );
      if (s > 0) {
        out.push({
          id: `page-${p.to}`,
          group: "页面",
          label: p.label,
          description: p.to,
          icon: p.icon,
          score: s,
          href: p.to,
          onSelect: () => {
            navigate(p.to);
            onClose();
          },
        });
      }
    }

    // 2) 服务：无查询词时全展示（替代原来的 ServiceNav）
    for (const s of services) {
      const score = Math.max(
        fuzzyScore(query, s.name),
        fuzzyScore(query, s.description || ""),
        fuzzyScore(query, s.category),
      );
      if (score > 0) {
        out.push({
          id: `svc-${s.id}`,
          group: "服务",
          label: s.name,
          description: s.description || s.url?.replace(/^https?:\/\//, "") || s.category,
          icon: Server,
          iconColor: s.icon_color,
          statusDot:
            s.status === "active"
              ? "active"
              : s.status === "error"
                ? "error"
                : "inactive",
          score,
          external: true,
          onSelect: () => {
            window.open(s.url, "_blank", "noopener");
            onClose();
          },
        });
      }
    }

    // 3) 书签：仅在有搜索词时展示（否则噪音太大）
    if (query) {
      for (const b of bookmarks) {
        const score = Math.max(
          fuzzyScore(query, b.title),
          fuzzyScore(query, b.description || ""),
          fuzzyScore(query, b.url || ""),
        );
        if (score > 0) {
          out.push({
            id: `bm-${b.id}`,
            group: "书签",
            label: b.title,
            description: b.url?.replace(/^https?:\/\//, "") || "",
            icon: BookmarkIcon,
            score,
            external: true,
            onSelect: () => {
              window.open(b.url, "_blank", "noopener");
              onClose();
            },
          });
        }
      }
    }

    // 按评分降序排列（同 group 内）
    return out.sort((a, b) => b.score - a.score);
  }, [query, services, bookmarks, navigate, onClose]);

  // ── 生命周期 ──

  // 打开时重置状态
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // autoFocus 在 portal + AnimatePresence 下不稳定，手动聚焦
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // 结果变化时重置选中
  useEffect(() => {
    setSelectedIndex(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [results.length]);

  // ── 键盘导航 ──

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          // 自动滚动到可见区域
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].onSelect();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, onClose],
  );

  // 选中项变化时确保可见
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // ── 分组 ──

  const grouped = useMemo(() => {
    const map = new Map<ResultGroup, SearchResult[]>();
    for (const r of results) {
      const arr = map.get(r.group) ?? [];
      arr.push(r);
      map.set(r.group, arr);
    }
    return Array.from(map.entries());
  }, [results]);

  // ── 渲染 ──

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="command-palette-backdrop"
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] sm:pt-[15vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {/* 背景毛玻璃遮罩 */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 主卡片 */}
        <motion.div
          key="command-palette-card"
          className="relative z-10 mx-4 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
          }}
          initial={{ opacity: 0, scale: 0.94, y: -24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -24 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── 搜索输入区域 ── */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-card)" }}
          >
            <Search size={18} className="shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索页面、服务、书签…"
              className="flex-1 text-base outline-none bg-transparent placeholder:text-sm"
              style={{ color: "var(--text-primary)" }}
              autoFocus
            />
            {!query && (
              <kbd
                className="hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-card)",
                }}
              >
                <Command size={12} />K
              </kbd>
            )}
          </div>

          {/* ── 搜索结果区域 ── */}
          <div ref={listRef} className="max-h-[55vh] overflow-y-auto px-2 py-2">
            {grouped.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-16"
                style={{ color: "var(--text-muted)" }}
              >
                <Search size={40} className="opacity-20" />
                <p className="text-sm">没有找到匹配结果</p>
                <p className="text-xs opacity-60">试试其他关键词</p>
              </div>
            ) : (
              grouped.map(([group, items], gi) => {
                // 计算这组在全球索引中的起始位置
                let globalOffset = 0;
                for (let i = 0; i < gi; i++) {
                  globalOffset += grouped[i][1].length;
                }

                return (
                  <div key={group}>
                    {/* 分组标题 */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {group === "页面" && "📄"}
                      {group === "服务" && "🔗"}
                      {group === "书签" && "🔖"}
                      {group}
                      <span className="font-normal opacity-50">{items.length}</span>
                    </div>

                    {/* 结果项 */}
                    {items.map((item, ii) => {
                      const actualIdx = globalOffset + ii;
                      const isSelected = actualIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          data-selected={isSelected ? "true" : undefined}
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all"
                          style={{
                            background: isSelected
                              ? "color-mix(in srgb, var(--accent-primary) 12%, transparent)"
                              : "transparent",
                          }}
                          onClick={item.onSelect}
                          onMouseEnter={() => setSelectedIndex(actualIdx)}
                        >
                          {/* 图标 */}
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              background: item.iconColor
                                ? `${item.iconColor}18`
                                : "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
                              color: item.iconColor || "var(--accent-primary)",
                            }}
                          >
                            <item.icon size={16} />
                          </span>

                          {/* 文字 */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {highlightMatch(item.label, query)}
                            </p>
                            <p
                              className="text-xs truncate mt-0.5"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {item.description}
                            </p>
                          </div>

                          {/* 服务状态点 */}
                          {item.statusDot && (
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{
                                background:
                                  item.statusDot === "active"
                                    ? "var(--status-success)"
                                    : item.statusDot === "error"
                                      ? "var(--status-error)"
                                      : "var(--text-muted)",
                              }}
                              title={
                                item.statusDot === "active"
                                  ? "在线"
                                  : item.statusDot === "error"
                                    ? "异常"
                                    : "离线"
                              }
                            />
                          )}

                          {/* 外部链接指示 */}
                          {item.external && (
                            <ExternalLink
                              size={12}
                              className="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                              style={{ color: "var(--text-muted)" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* ── 底部快捷键提示 ── */}
          <div
            className="flex items-center justify-between px-5 py-2.5 text-xs"
            style={{
              borderTop: "1px solid var(--border-card)",
              color: "var(--text-muted)",
            }}
          >
            <div className="flex items-center gap-3">
              <KbdIcon>↑↓</KbdIcon>
              <span>导航</span>
              <KbdIcon>↵</KbdIcon>
              <span>打开</span>
              <KbdIcon>Esc</KbdIcon>
              <span>关闭</span>
            </div>
            <span className="hidden sm:inline text-[11px] opacity-60">
              {results.length} 个结果
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// ──────────── 辅助组件 ────────────

/** 快捷键徽标 */
function KbdIcon({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="rounded px-1.5 py-0.5 text-[11px] font-mono"
      style={{
        background: "var(--bg-primary)",
        border: "1px solid var(--border-card)",
      }}
    >
      {children}
    </kbd>
  );
}

/** 模糊搜索高亮：将匹配到的字符加粗并换色 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const q = query.toLowerCase();
  const t = text;
  const tLower = t.toLowerCase();

  // 找到匹配位置
  const indices: number[] = [];
  let qi = 0;
  for (let ti = 0; ti < tLower.length && qi < q.length; ti++) {
    if (q[qi] === tLower[ti]) {
      indices.push(ti);
      qi++;
    }
  }

  if (indices.length === 0) return text;

  // 构建高亮片段
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;

  for (const idx of indices) {
    if (idx > lastIdx) {
      parts.push(text.slice(lastIdx, idx));
    }
    parts.push(
      <strong
        key={idx}
        className="font-semibold"
        style={{ color: "var(--accent-primary)" }}
      >
        {text[idx]}
      </strong>,
    );
    lastIdx = idx + 1;
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts;
}
