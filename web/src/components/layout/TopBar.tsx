import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Settings, Sun, Moon, BookOpen, RefreshCw } from "lucide-react";
import { poetryAPI } from "@/api/poetry";

/**
 * TopBar — 顶部栏
 * 时间 · 古诗 · 问候语 · 快捷搜索 · 主题切换
 */

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function greeting(hour: number) {
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜深了";
}

export interface TopBarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  const now = useNow();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][now.getDay()];

  // 古诗：30 分钟内复用缓存，避免频繁打上游 API
  const { data: poem, refetch, isFetching } = useQuery({
    queryKey: ["poetry", "random"],
    queryFn: poetryAPI.random,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 backdrop-blur-xl"
      style={{
        background: "color-mix(in srgb, var(--bg-primary) 70%, transparent)",
        borderBottom: "1px solid var(--border-card)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-lg"
          style={{ background: "var(--accent-gradient)" }}
        />
        <span className="text-base font-semibold tracking-tight">
          Breeze<span className="gradient-text">Center</span>
        </span>
      </div>

      {/* 搜索框 */}
      <div className="relative ml-2 hidden flex-1 max-w-md md:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          size={15}
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          placeholder="搜索服务、书签、文章…"
          className="w-full rounded-lg py-1.5 pl-9 pr-3 text-sm outline-none transition"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-3 text-sm">
        {/* 时间 + 古诗 + 问候 */}
        <div className="hidden items-center gap-3 lg:flex">
          <span style={{ color: "var(--text-secondary)" }}>
            {greeting(now.getHours())}，Breeze
          </span>
          <span className="h-3 w-px" style={{ background: "var(--border-card)" }} />
          <span className="font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>
            {hh}:{mm}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              :{ss}
            </span>
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            周{weekday}
          </span>
          <span className="h-3 w-px" style={{ background: "var(--border-card)" }} />
          {/* 古诗 */}
          {poem ? (
            <button
              onClick={() => refetch()}
              className="group flex items-center gap-1.5 text-xs transition"
              style={{ color: "var(--text-secondary)" }}
              title={`${poem.title} · ${poem.author}（${poem.dynasty}）\n${poem.content.join("\n")}\n\n点击换一首`}
            >
              <BookOpen
                size={12}
                style={{ color: "var(--accent-primary)" }}
                className="shrink-0"
              />
              <span className="max-w-[280px] truncate italic transition group-hover:text-[var(--accent-primary)]">
                「{poem.content[0]}」
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                — {poem.author}·{poem.dynasty}
              </span>
              <RefreshCw
                size={10}
                className={`shrink-0 transition ${isFetching ? "animate-spin" : "opacity-0 group-hover:opacity-100"}`}
                style={{ color: "var(--text-muted)" }}
              />
            </button>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              加载诗句…
            </span>
          )}
        </div>

        {/* 移动端只显时间 */}
        <div className="flex items-center gap-2 lg:hidden">
          <span className="font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>
            {hh}:{mm}
          </span>
        </div>

        {/* 主题切换 */}
        <button
          onClick={onToggleTheme}
          className="btn-ghost"
          aria-label="切换主题"
          title="切换主题"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* 设置 */}
        <button className="btn-ghost" aria-label="设置" title="设置">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
