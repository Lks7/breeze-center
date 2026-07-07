import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  const [isCompleting, setIsCompleting] = useState(false);

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

  const handleToggle = () => {
    if (todo.done) {
      // 如果是取消完成，直接切换
      onToggle(todo.id);
    } else {
      // 如果是标记完成，先播放动画
      setIsCompleting(true);
      setTimeout(() => {
        onToggle(todo.id);
      }, 800); // 动画持续时间
    }
  };

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

  // 计算飞向垃圾桶的目标位置（右下角）
  const trashPosition = {
    x: window.innerWidth - 100,
    y: window.innerHeight - 100,
  };

  return (
    <motion.div
      className={`absolute w-48 h-48 p-4 rounded-lg shadow-lg cursor-move ${
        priorityColors[todo.priority]
      }`}
      style={{
        left: `${todo.position_x}px`,
        top: `${todo.position_y}px`,
        transform: `rotate(${Math.random() * 6 - 3}deg)`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onEdit(todo)}
      whileHover={{ scale: 1.05 }}
      animate={isCompleting ? "completing" : "normal"}
      variants={{
        normal: {
          scale: 1,
          rotate: Math.random() * 6 - 3,
          opacity: 1,
        },
        completing: {
          scale: [1, 0.8, 0.3],
          rotate: [0, 180, 360, 720],
          x: trashPosition.x - todo.position_x,
          y: trashPosition.y - todo.position_y,
              opacity: [1, 1, 0],
            },
          }}
          transition={{
            duration: 0.8,
            times: [0, 0.3, 1],
            ease: "easeInOut",
          }}
        >
          <div className="flex items-start gap-2 mb-2">
            <input
              type="checkbox"
              checked={todo.done}
              onChange={handleToggle}
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
        </motion.div>
  );
}
