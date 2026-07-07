import { useState, useEffect } from "react";
import type { Todo } from "../../types/entities";

interface StickyNoteProps {
  todo: Todo;
  onPositionChange: (id: string, x: number, y: number) => void;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

const priorityColors = {
  high: "bg-red-200",
  medium: "bg-yellow-200",
  low: "bg-blue-200",
};

export function StickyNote({ todo, onPositionChange, onToggle, onEdit }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("input, button")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - todo.position_x,
      y: e.clientY - todo.position_y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    onPositionChange(todo.id, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      className={`absolute w-48 h-48 p-4 rounded-lg shadow-lg cursor-move transform transition-transform hover:scale-105 ${
        priorityColors[todo.priority]
      } ${todo.done ? "opacity-60" : ""}`}
      style={{
        left: `${todo.position_x}px`,
        top: `${todo.position_y}px`,
        transform: `rotate(${Math.random() * 6 - 3}deg)`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onEdit(todo)}
    >
      <div className="flex items-start gap-2 mb-2">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          className="mt-1"
        />
        <div className="flex-1 text-sm font-medium break-words">
          {todo.text}
        </div>
      </div>
      {todo.due_date && (
        <div className="text-xs text-gray-600 mt-2">
          📅 {todo.due_date}
        </div>
      )}
    </div>
  );
}
