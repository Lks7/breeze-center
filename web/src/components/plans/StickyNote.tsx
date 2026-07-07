import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Todo } from "../../types/entities";

interface StickyNoteProps {
  todo: Todo;
  onPositionChange: (id: string, x: number, y: number) => void;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

const priorityColors: Record<string, string> = {
  high: "#fecaca",
  medium: "#fef08a",
  low: "#bfdbfe",
};

const priorityShadows: Record<string, string> = {
  high: "rgba(185,28,28,0.25)",
  medium: "rgba(161,98,7,0.25)",
  low: "rgba(29,78,216,0.25)",
};

const priorityDarker: Record<string, string> = {
  high: "#fca5a5",
  medium: "#fde047",
  low: "#93c5fd",
};

export function StickyNote({ todo, onPositionChange, onToggle, onEdit }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCompleting, setIsCompleting] = useState(false);
  const initialRotation = useRef(Math.random() * 6 - 3);
  const noteSize = useRef(192); // w-48 = 192px

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
      onToggle(todo.id);
    } else {
      setIsCompleting(true);
      setTimeout(() => {
        onToggle(todo.id);
      }, 1000); // 延长到1秒看揉皱效果
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

  // 计算飞向垃圾桶的目标（右下角）
  const trashX = window.innerWidth - 110;
  const trashY = window.innerHeight - 110;

  return (
    <motion.div
      className="absolute cursor-move"
      style={{
        left: `${todo.position_x}px`,
        top: `${todo.position_y}px`,
        width: `${noteSize.current}px`,
        height: `${noteSize.current}px`,
        perspective: "800px",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onEdit(todo)}
      animate={isCompleting ? "completing" : "normal"}
      exit="exit"
      variants={{
        normal: {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          rotate: initialRotation.current,
          filter: "brightness(1)",
          transition: { duration: 0.3 },
        },
        completing: {
          // 阶段1 (0-30%): 快速揉皱 - 纸张被捏成团
          // 阶段2 (30-60%): 揉成纸团，随机滚动
          // 阶段3 (60-90%): 纸团飞向垃圾桶
          // 阶段4 (90-100%): 落入垃圾桶，弹跳
          x: [0, 0, 0, trashX - todo.position_x],
          y: [0, 0, -40, trashY - todo.position_y],
          scale: [1, 0.85, 0.5, 0.3],
          scaleX: [1, 1.1, 0.7, 0.35],
          scaleY: [1, 0.9, 0.6, 0.25],
          rotate: [initialRotation.current, initialRotation.current + 45, initialRotation.current + 360, initialRotation.current + 720],
          rotateY: [0, 0, 180, 360],
          rotateX: [0, 0, 90, 180],
          boxShadow: [
            `3px 3px 12px ${priorityShadows[todo.priority]}, 1px 1px 0 ${priorityDarker[todo.priority]}`,
            `2px 2px 8px ${priorityShadows[todo.priority]}, 0.5px 0.5px 0 ${priorityDarker[todo.priority]}`,
            `1px 1px 4px ${priorityShadows[todo.priority]}`,
            `0px 0px 2px ${priorityShadows[todo.priority]}`,
          ],
          opacity: [1, 1, 0.9, 0],
          filter: ["brightness(1)", "brightness(0.95)", "brightness(0.85)", "brightness(0.75)"],
          transition: {
            duration: 1,
            times: [0, 0.3, 0.6, 1],
            ease: "easeInOut",
          },
        },
      }}
    >
      {/* 纸张本身，带纹理和阴影 */}
      <motion.div
        className="w-full h-full p-4 rounded-lg flex flex-col"
        style={{
          backgroundColor: priorityColors[todo.priority],
          backgroundImage: `
            linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
          `,
          boxShadow: `3px 3px 12px ${priorityShadows[todo.priority]}, 1px 1px 0 ${priorityDarker[todo.priority]}`,
        }}
        whileHover={{ scale: 1.05, rotate: initialRotation.current * 0.5 }}
        animate={isCompleting ? {
          borderRadius: ["0.5rem", "0.75rem", "1rem", "1.5rem"],
          transition: { duration: 1, times: [0, 0.3, 0.6, 1] },
        } : {}}
      >
        {/* 图钉/胶带装饰 */}
        <div
          className="absolute -top-2 -left-1 w-6 h-4 rounded-full opacity-60"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.3))",
            border: "1px solid rgba(0,0,0,0.1)",
            transform: `rotate(${-initialRotation.current * 2}deg)`,
          }}
        />

        <div className="flex items-start gap-2 mb-2 flex-1">
          <input
            type="checkbox"
            checked={todo.done}
            onChange={handleToggle}
            className="mt-1 w-4 h-4 accent-green-500"
          />
          <div className="flex-1 text-sm font-medium break-words leading-relaxed text-gray-700">
            {todo.text}
          </div>
        </div>

        {todo.due_date && (
          <div className="text-xs text-gray-500 mt-2 border-t border-gray-300/50 pt-2">
            📅 {todo.due_date}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
