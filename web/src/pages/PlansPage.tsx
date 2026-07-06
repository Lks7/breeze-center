import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Square,
  Trash2,
  Plus,
  Loader2,
  Calendar,
  Flag,
  Repeat,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { todoAPI } from "@/api/admin";
import type { Todo } from "@/types/entities";

type Priority = Todo["priority"];

const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  high: {
    label: "高优先级",
    color: "var(--status-error)",
    bg: "color-mix(in srgb, var(--status-error) 10%, transparent)",
  },
  medium: {
    label: "中优先级",
    color: "var(--status-warn)",
    bg: "color-mix(in srgb, var(--status-warn) 10%, transparent)",
  },
  low: {
    label: "低优先级",
    color: "var(--status-ok)",
    bg: "color-mix(in srgb, var(--status-ok) 10%, transparent)",
  },
};

export function PlansPage() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [isHabit, setIsHabit] = useState(false);
  const [habitFrequency, setHabitFrequency] = useState<string>("daily");

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["plans", "todos"],
    queryFn: todoAPI.list,
  });

  const createMut = useMutation({
    mutationFn: () =>
      todoAPI.create({
        text,
        priority,
        is_habit: isHabit,
        habit_frequency: isHabit ? habitFrequency : "",
        habit_target: 0,
      } as Partial<Todo>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans", "todos"] });
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
      setText("");
    },
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => todoAPI.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans", "todos"] });
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => todoAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans", "todos"] });
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
    },
  });

  // 按优先级分组
  const groups: Record<Priority, Todo[]> = { high: [], medium: [], low: [] };
  for (const t of todos) {
    groups[t.priority]?.push(t);
  }

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const remainCount = total - doneCount;
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      {/* 顶部返回 + 标题 */}
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
          <GradientText>计划管理</GradientText>
        </h1>
        <Link
          to="/check-in"
          className="btn-ghost ml-auto text-sm"
          style={{ border: "1px solid var(--border-card)" }}
        >
          <Repeat size={15} />
          习惯打卡
        </Link>
      </div>

      {/* 摘要条 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="总待办" value={total} />
        <SummaryCard label="未完成" value={remainCount} highlight />
        <SummaryCard label="已完成" value={doneCount} />
        <SummaryCard label="完成率" value={`${completionRate}%`} />
      </div>

      {/* 快速添加 */}
      <GlassCard className="mb-6 !p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) createMut.mutate();
          }}
          className="flex items-center gap-2"
        >
          <Plus
            size={16}
            style={{ color: "var(--accent-primary)" }}
            className="ml-1 shrink-0"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="添加待办，回车提交..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            autoFocus
          />
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--bg-card)" }}>
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className="rounded px-2 py-1 text-xs transition"
                style={{
                  background:
                    priority === p ? PRIORITY_META[p].bg : "transparent",
                  color: priority === p ? PRIORITY_META[p].color : "var(--text-muted)",
                }}
              >
                {PRIORITY_META[p].label.charAt(0)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
            <input
              type="checkbox"
              checked={isHabit}
              onChange={(e) => setIsHabit(e.target.checked)}
            />
            习惯
          </label>
          {isHabit && (
            <select
              value={habitFrequency}
              onChange={(e) => setHabitFrequency(e.target.value)}
              className="rounded-lg px-1.5 py-1 text-xs outline-none"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                color: "var(--text-primary)",
              }}
            >
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          )}
          <button
            type="submit"
            disabled={createMut.isPending || !text.trim()}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--accent-gradient)" }}
          >
            {createMut.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            添加
          </button>
        </form>
      </GlassCard>

      {/* 三列看板 */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      ) : total === 0 ? (
        <GlassCard interactive={false} className="py-16 text-center">
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            还没有待办事项
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            在上方输入框添加第一条
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <PriorityColumn
              key={p}
              priority={p}
              items={groups[p]}
              onToggle={(id) => toggleMut.mutate(id)}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 摘要卡片
// ============================================================

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <GlassCard interactive={false} className="!p-4">
      <div
        className="text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <div
        className="count-rise mt-1 font-mono text-2xl font-bold tabular-nums"
        style={{
          color: highlight ? "var(--accent-primary)" : "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </GlassCard>
  );
}

// ============================================================
// 优先级列
// ============================================================

function PriorityColumn({
  priority,
  items,
  onToggle,
  onDelete,
}: {
  priority: Priority;
  items: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = PRIORITY_META[priority];
  const undone = items.filter((t) => !t.done).length;

  return (
    <div className="flex flex-col gap-3">
      {/* 列头 */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{ background: meta.bg }}
      >
        <Flag size={13} style={{ color: meta.color }} fill="currentColor" />
        <span className="text-sm font-medium" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs font-mono"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
          }}
        >
          {undone}/{items.length}
        </span>
      </div>

      {/* 待办列表 */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div
            className="rounded-lg border border-dashed py-8 text-center text-xs"
            style={{
              borderColor: "var(--border-card)",
              color: "var(--text-muted)",
            }}
          >
            暂无
          </div>
        ) : (
          items.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={() => onToggle(t.id)}
              onDelete={() => onDelete(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// 单条待办
// ============================================================

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = PRIORITY_META[todo.priority];
  return (
    <GlassCard className="group relative flex items-start gap-2.5 overflow-hidden !p-3">
      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0 transition hover:scale-110"
        title={todo.done ? "标记为未完成" : "标记为已完成"}
      >
        {todo.done ? (
          <Check
            size={16}
            style={{ color: "var(--status-ok)" }}
            fill="currentColor"
          />
        ) : (
          <Square size={16} style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm leading-relaxed transition"
          style={{
            color: todo.done ? "var(--text-muted)" : "var(--text-primary)",
            textDecoration: todo.done ? "line-through" : "none",
          }}
        >
          {todo.text}
        </p>
        {todo.due_date && (
          <div
            className="mt-1 flex items-center gap-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Calendar size={11} />
            {todo.due_date}
          </div>
        )}
        {todo.is_habit && (
          <div
            className="mt-1 flex items-center gap-1 text-xs"
            style={{ color: "var(--accent-primary)" }}
          >
            <Repeat size={11} />
            习惯
          </div>
        )}
      </div>

      {/* 左侧优先级色条 */}
      <span
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: meta.color }}
      />

      <button
        onClick={onDelete}
        className="shrink-0 opacity-0 transition group-hover:opacity-100"
        style={{ color: "var(--status-error)" }}
        title="删除"
      >
        <Trash2 size={13} />
      </button>
    </GlassCard>
  );
}
