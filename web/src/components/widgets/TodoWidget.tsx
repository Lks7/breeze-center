import { CheckSquare, Square, Check, Loader2, Flame } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import type { Todo, Habit } from "@/types/entities";

const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--status-error)",
  medium: "var(--status-warn)",
  low: "var(--status-ok)",
};

interface TodoWidgetProps {
  enterDelay?: number;
  /** 待办列表 */
  todos?: Todo[];
  /** 待办切换完成 */
  onToggle?: (id: string) => void;
  /** 正在切换的待办 ID */
  togglingId?: string | null;
  /** 习惯列表（含今日打卡状态） */
  habits?: Habit[];
  /** 习惯打卡 */
  onHabitCheckIn?: (id: string) => void;
  /** 正在打卡的习惯 ID */
  checkingHabitId?: string | null;
  /** 点击跳转目标 */
  to?: string;
}

/**
 * TodoWidget — 首页仪表盘组件
 *
 * 展示今日待办 + 待打卡习惯（二合一）。
 */
export function TodoWidget({
  enterDelay,
  todos = [],
  onToggle,
  togglingId,
  habits = [],
  onHabitCheckIn,
  checkingHabitId,
  to = "/plans",
}: TodoWidgetProps) {
  // 待办：优先未完成，按优先级排序，最多 5 条
  const order = { high: 0, medium: 1, low: 2 };
  const visibleTodos = [...todos]
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 5);

  // 未打卡习惯（最多 3 条）
  const uncheckedHabits = habits
    .filter((h) => !h.today_checked)
    .slice(0, 3);

  const remaining = todos.filter((t) => !t.done).length;
  const habitPending = uncheckedHabits.length;

  const hasTodos = visibleTodos.length > 0;
  const hasHabits = uncheckedHabits.length > 0;

  return (
    <WidgetCard
      title="今日待办"
      icon={<CheckSquare size={16} />}
      enterDelay={enterDelay}
      to={to}
      actions={
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {remaining} 项待办
          {habitPending > 0 && ` · ${habitPending} 项打卡`}
        </span>
      }
    >
      {!hasTodos && !hasHabits ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          今天都完成了 🎉
        </p>
      ) : (
        <div className="space-y-1">
          {/* 待办列表 */}
          {visibleTodos.map((todo) => {
            const isToggling = togglingId === todo.id;
            return (
              <div key={todo.id}>
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
                    className="text-sm truncate"
                    style={{
                      color: todo.done ? "var(--text-muted)" : "var(--text-primary)",
                      textDecoration: todo.done ? "line-through" : "none",
                    }}
                  >
                    {todo.text}
                  </span>
                </button>
              </div>
            );
          })}

          {/* 待打卡习惯分隔线 */}
          {hasTodos && hasHabits && (
            <div className="border-t pt-1 mt-1" style={{ borderColor: "var(--border-card)" }} />
          )}

          {/* 待打卡习惯 */}
          {uncheckedHabits.map((habit) => {
            const isChecking = checkingHabitId === habit.id;
            return (
              <div key={habit.id}>
                <button
                  onClick={() => onHabitCheckIn?.(habit.id)}
                  disabled={!onHabitCheckIn || isChecking}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--bg-card-hover)] disabled:cursor-default"
                >
                  {isChecking ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                      style={{ color: "#f97316" }}
                    />
                  ) : (
                    <Flame size={15} style={{ color: "#f97316" }} />
                  )}
                  <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {habit.text}
                  </span>
                  <span
                    className="ml-auto rounded px-1.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: "color-mix(in srgb, #f97316 15%, transparent)",
                      color: "#f97316",
                    }}
                  >
                    打卡
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
