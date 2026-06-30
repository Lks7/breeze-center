import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Square, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { todoAPI } from "@/api/admin";
import type { Todo } from "@/types/entities";

const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--status-error)",
  medium: "var(--status-warn)",
  low: "var(--status-ok)",
};

export function TodoAdmin() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Todo["priority"]>("medium");

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["admin", "todos"],
    queryFn: todoAPI.list,
  });

  const createMut = useMutation({
    mutationFn: () =>
      todoAPI.create({ text, priority } as Partial<Todo>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
      setText("");
    },
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => todoAPI.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "todos"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => todoAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "todos"] }),
  });

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div className="px-8 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          待办管理
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          快速增删待办事项 · {remaining} 项未完成
        </p>
      </header>

      {/* 快速添加 */}
      <GlassCard className="mb-4 !p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) createMut.mutate();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="添加待办..."
            className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              color: "var(--text-primary)",
            }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Todo["priority"])}
            className="rounded-lg px-2 py-1.5 text-sm outline-none"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              color: "var(--text-primary)",
            }}
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <button
            type="submit"
            disabled={createMut.isPending || !text.trim()}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent-gradient)" }}
          >
            {createMut.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            添加
          </button>
        </form>
      </GlassCard>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      ) : (
        <div className="space-y-1.5">
          {todos.map((t) => (
            <GlassCard key={t.id} className="flex items-center gap-2 !p-3">
              <button
                onClick={() => toggleMut.mutate(t.id)}
                className="shrink-0"
              >
                {t.done ? (
                  <Check size={15} style={{ color: "var(--status-ok)" }} />
                ) : (
                  <Square size={15} style={{ color: "var(--text-muted)" }} />
                )}
              </button>
              {!t.done && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: PRIORITY_COLOR[t.priority] }}
                />
              )}
              <span
                className="flex-1 text-sm"
                style={{
                  color: t.done ? "var(--text-muted)" : "var(--text-primary)",
                  textDecoration: t.done ? "line-through" : "none",
                }}
              >
                {t.text}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t.priority}
              </span>
              <button
                onClick={() => deleteMut.mutate(t.id)}
                className="btn-ghost !p-1"
                style={{ color: "var(--status-error)" }}
              >
                <Trash2 size={13} />
              </button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
