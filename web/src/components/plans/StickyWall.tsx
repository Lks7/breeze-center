import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote } from "./StickyNote";
import type { Todo } from "../../types/entities";
import { todoAPI } from "../../api/admin";

interface StickyWallProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

export function StickyWall({ todos, onToggle, onEdit }: StickyWallProps) {
  const queryClient = useQueryClient();

  const updatePositionMutation = useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) =>
      todoAPI.updatePosition(id, x, y),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans", "todos"] });
    },
  });

  const handlePositionChange = (id: string, x: number, y: number) => {
    // 乐观更新：立即更新 UI
    queryClient.setQueryData(["plans", "todos"], (old: Todo[] | undefined) => {
      if (!old) return old;
      return old.map((t) => (t.id === id ? { ...t, position_x: x, position_y: y } : t));
    });
    // 发送到服务器
    updatePositionMutation.mutate({ id, x, y });
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {todos.map((todo) => (
        <StickyNote
          key={todo.id}
          todo={todo}
          onPositionChange={handlePositionChange}
          onToggle={onToggle}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
