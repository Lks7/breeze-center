import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import type { WidgetId } from "@/hooks/useHomeSettings";

interface Props {
  id: WidgetId;
  children: ReactNode;
}

/**
 * DraggableWidget - 可拖拽的 Widget 包装器
 * 
 * 使用 @dnd-kit/sortable 实现拖拽排序
 */
export function DraggableWidget({ id, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* 拖拽手柄 */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-10 cursor-grab rounded-lg p-1.5 opacity-0 transition-all hover:opacity-100 group-hover:opacity-60"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
        }}
        title="拖动调整位置"
      >
        <GripVertical size={14} style={{ color: "var(--text-muted)" }} />
      </button>
      
      {/* Widget 内容 */}
      <div className="group">
        {children}
      </div>
    </div>
  );
}
