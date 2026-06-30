import { Bookmark } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import type { Bookmark as BookmarkType } from "@/types/entities";

/**
 * BookmarkWidget — 快捷书签
 * 显示最近添加的书签，按 sort_order 排序
 */
export function BookmarkWidget({
  enterDelay,
  bookmarks = [],
  to = "/bookmarks",
}: {
  enterDelay?: number;
  bookmarks?: BookmarkType[];
  to?: string;
}) {
  const visible = [...bookmarks]
    .sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <WidgetCard
      title="快捷书签"
      icon={<Bookmark size={16} />}
      enterDelay={enterDelay}
      to={to}
    >
      {visible.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          暂无书签
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-1.5">
          {visible.map((b) => (
            <li key={b.id}>
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[var(--bg-card-hover)]"
                title={b.description || b.url}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                  style={{
                    background: "color-mix(in srgb, var(--accent-primary) 18%, transparent)",
                    color: "var(--accent-primary)",
                  }}
                >
                  {b.title.charAt(0).toUpperCase()}
                </span>
                <span
                  className="truncate text-xs transition group-hover:text-[var(--accent-primary)]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {b.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
