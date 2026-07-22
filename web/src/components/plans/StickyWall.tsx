import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { StickyNote } from "./StickyNote";
import { TrashBin } from "./TrashBin";
import { CompletedDrawer } from "./CompletedDrawer";
import type { Todo } from "../../types/entities";
import { todoAPI } from "../../api/admin";

interface StickyWallProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const QUADRANTS = [
  {
    key: "high",
    label: "P0 · 重要紧急",
    icon: "🔥",
    style: { top: "0", left: "0", width: "50%", height: "50%" },
    bg: "rgba(239,68,68,0.05)",
    borderColor: "rgba(239,68,68,0.2)",
    textColor: "rgba(239,68,68,0.35)",
  },
  {
    key: "medium",
    label: "P1 · 重要不紧急",
    icon: "📋",
    style: { top: "0", right: "0", width: "50%", height: "50%" },
    bg: "rgba(234,179,8,0.05)",
    borderColor: "rgba(234,179,8,0.2)",
    textColor: "rgba(234,179,8,0.35)",
  },
  {
    key: "low",
    label: "P2 · 低优待办",
    icon: "💡",
    style: { bottom: "0", left: "0", width: "50%", height: "50%" },
    bg: "rgba(59,130,246,0.05)",
    borderColor: "rgba(59,130,246,0.2)",
    textColor: "rgba(59,130,246,0.35)",
  },
  {
    key: "done",
    label: "✅ 已完成",
    icon: "",
    style: { bottom: "0", right: "0", width: "50%", height: "50%" },
    bg: "rgba(34,197,94,0.05)",
    borderColor: "rgba(34,197,94,0.2)",
    textColor: "rgba(34,197,94,0.35)",
  },
];

export function StickyWall({ todos, onToggle, onEdit, onDelete }: StickyWallProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updatePositionMutation = useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) =>
      todoAPI.updatePosition(id, x, y),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "todos"] });
    },
  });

  const handlePositionChange = (id: string, x: number, y: number) => {
    // 乐观更新：立即更新 UI（不卡手）
    queryClient.setQueryData(["plans", "todos"], (old: Todo[] | undefined) => {
      if (!old) return old;
      return old.map((t) => (t.id === id ? { ...t, position_x: x, position_y: y } : t));
    });
    
    // 防抖：只保存最后一次位置（避免 SQLite 锁死）
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updatePositionMutation.mutate({ id, x, y });
    }, 150);
  };

  const completedTodos = todos.filter((t) => t.done);

  return (
    <div className="relative w-full min-h-screen">
      {/* 四象限背景层 */}
      {QUADRANTS.map((q) => (
        <div
          key={q.key}
          className="absolute flex items-start justify-start pointer-events-none"
          style={{
            ...q.style,
            background: q.bg,
            borderRight: q.key !== "high" && q.key !== "low" ? "none" : `1px solid ${q.borderColor}`,
            borderBottom: q.key !== "high" && q.key !== "medium" ? "none" : `1px solid ${q.borderColor}`,
          }}
        >
          {/* 象限标签 */}
          <div className="flex flex-col items-start gap-1">
            <span
              className="text-lg font-bold tracking-wider select-none"
              style={{
                color: q.textColor,
                padding: "1rem 1.5rem 0",
              }}
            >
              {q.icon} {q.label}
            </span>
            <span
              className="text-xs select-none"
              style={{
                color: q.textColor,
                padding: "0 1.5rem",
                opacity: 0.5,
              }}
            >
              拖拽便利贴到此区域
            </span>
          </div>
        </div>
      ))}
      
      {/* 便利贴层 */}
      {todos.filter(t => !t.done).map((todo) => (
        <StickyNote
          key={todo.id}
          todo={todo}
          onPositionChange={handlePositionChange}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      
      {/* 垃圾桶 */}
      <TrashBin
        completedCount={completedTodos.length}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />
      
      {/* 已完成抽屉 */}
      <CompletedDrawer
        isOpen={isDrawerOpen}
        completedTodos={completedTodos}
        onClose={() => setIsDrawerOpen(false)}
        onRestore={onToggle}
      />
    </div>
  );
}
