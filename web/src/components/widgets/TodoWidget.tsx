import { CheckSquare, Square, Check, Loader2 } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import type { Todo } from "@/types/entities";

const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--status-error)",
  medium: "var(--status-warn)",
  low: "var(--status-ok)",
};

/**
 * TodoWidget — 今日待办（来自本地 todos 表）
 *
 * 数据由父组件传入；onToggle 让点击能切换完成状态（乐观更新交给父组件处理）。
 */
export function TodoWidget({
  enterDelay,
  todos = [],
  onToggle,
  togglingId,
  to = "/plans",
}: {
  enterDelay?: number;
  todos?: Todo[];
  onToggle?: (id: string) => void;
  togglingId?: string | null;
  to?: string;
}) {
  // 优先未完成，按 priority 排序（high > medium > low），最多 5 条
  const order = { high: 0, medium: 1, low: 2 };
  const visible = [...todos]
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 5);
  const remaining = todos.filter((t) => !t.done).length;

  return (
    <WidgetCard
      title="今日待办"
      icon={<CheckSquare size={16} />}
      enterDelay={enterDelay}
      to={to}
      actions={
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {remaining} 项未完成
        </span>
      }
    >
      {visible.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          暂无待办
        </p>
      ) : (
        <ul className="space-y-1">
          {visible.map((todo) => {
            const isToggling = togglingId === todo.id;
            return (
              <li key={todo.id}>
                <button
                  onClick={() => onToggle?.(todo.id)}
                  disabled={!onToggle || isToggling}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--bg-card-hover)] disabled:cursor-default"
                >
                  {isToggling ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                      style={{ color: "var(--accent-primary)" }}
                    />
                  ) : todo.done ? (
                    <Check size={15} style={{ color: "var(--status-ok)" }} />
                  ) : (
                    <Square size={15} style={{ color: "var(--text-muted)" }} />
                  )}
                  {todo.priority && !todo.done && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: PRIORITY_COLOR[todo.priority] }}
                    />
                  )}
                  <span
                    className="text-sm"
                    style={{
                      color: todo.done ? "var(--text-muted)" : "var(--text-primary)",
                      textDecoration: todo.done ? "line-through" : "none",
                    }}
                  >
                    {todo.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
