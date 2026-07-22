import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Pin, PinOff, Trash } from "lucide-react";
import gsap from "gsap";
import type { Todo } from "../../types/entities";

interface StickyNoteProps {
  todo: Todo;
  onPositionChange: (id: string, x: number, y: number) => void;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
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

export function StickyNote({ todo, onPositionChange, onToggle, onEdit, onDelete }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pinned, setPinned] = useState(false);
  const initialRotation = useRef(Math.random() * 6 - 3);
  const noteRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  
  // 根据文字长度计算便利贴宽度
  const noteWidth = useMemo(() => {
    const textLen = todo.text.length;
    const hasDueDate = !!todo.due_date;
    const baseWidth = 160 + Math.min(textLen, 50) * 3;
    const dueDateExtra = hasDueDate ? 16 : 0;
    return Math.min(Math.max(baseWidth + dueDateExtra, 160), 320);
  }, [todo.text, todo.due_date]);

  // 拖拽偏移记录
  const dragOffset = useRef({ x: 0, y: 0 });

  // 拖拽：直接更新 left/top，不依赖 GSAP transform
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("input, button")) return;
    if (!noteRef.current || pinned) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    // GSAP 视觉：微微抬起
    gsap.to(noteRef.current, {
      scale: 1.03,
      boxShadow: "6px 6px 24px rgba(0,0,0,0.2)",
      duration: 0.15,
      ease: "power2.out",
    });
    
    dragOffset.current = {
      x: e.clientX - todo.position_x,
      y: e.clientY - todo.position_y,
    };
    
    // Z 轴提升
    document.querySelectorAll("[data-sticky-note]").forEach(el => {
      (el as HTMLElement).style.zIndex = "1";
    });
    noteRef.current.style.zIndex = "100";
  }, [todo.position_x, todo.position_y, pinned]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // 计算新位置
    const rawX = e.clientX - dragOffset.current.x;
    const rawY = e.clientY - dragOffset.current.y;
    
    // 限制在视口内
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const clampedX = Math.max(0, Math.min(rawX, viewportW - noteWidth));
    const clampedY = Math.max(0, Math.min(rawY, viewportH - 80));
    
    // 直接保存新位置（触发 React Query 乐观更新）
    onPositionChange(todo.id, Math.round(clampedX), Math.round(clampedY));
  }, [isDragging, noteWidth, todo.id, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (!noteRef.current) return;
    
    // GSAP 恢复视觉样式
    gsap.to(noteRef.current, {
      scale: 1,
      boxShadow: "none",
      duration: 0.2,
      ease: "power2.out",
    });
  }, []);

  // hover 效果：GSAP 处理
  const handleMouseEnter = useCallback(() => {
    if (isDragging) return;
    if (!paperRef.current) return;
    gsap.to(paperRef.current, {
      scale: 1.05,
      rotate: initialRotation.current * 0.5,
      duration: 0.2,
      ease: "power2.out",
    });
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) return;
    if (!paperRef.current) return;
    gsap.to(paperRef.current, {
      scale: 1,
      rotate: 0,
      duration: 0.2,
      ease: "power2.out",
    });
  }, [isDragging]);

  const handleToggle = () => {
    if (todo.done) {
      onToggle(todo.id);
    } else {
      if (noteRef.current) {
        const note = noteRef.current;
        const trashX = window.innerWidth - 110;
        const trashY = window.innerHeight - 110;
        const deltaX = trashX - todo.position_x;
        const deltaY = trashY - todo.position_y;
        
        // 清除残留动画
        gsap.killTweensOf(note);
        
        const tl = gsap.timeline({
          onComplete: () => {
            onToggle(todo.id);
          }
        });
        
        // 1. 预感 - 纸片轻轻一颤 (0-0.12s)
        tl.to(note, {
          scale: 1.08,
          rotate: `-=${5}`,
          duration: 0.08,
          ease: 'power2.out',
        });
        
        // 2. 尖叫回缩 - 快速缩小 + 3D翻转 (0.12-0.35s)
        tl.to(note, {
          scale: 0.6,
          scaleX: 0.65,
          scaleY: 0.55,
          rotate: `+=${180 + Math.random() * 90}`,
          rotateY: 180,
          rotateX: 120,
          borderRadius: '1rem',
          duration: 0.23,
          ease: 'back.in(2)',
        });
        
        // 3. 漩涡吸入 - 一边旋转一边被吸到垃圾桶 (0.35-0.85s)
        // X轴：被吸入垃圾桶
        tl.to(note, {
          x: deltaX,
          duration: 0.5,
          ease: 'power4.in',
        }, 0.35);
        
        // Y轴：轻微上抛后快速下坠
        tl.to(note, {
          y: -60,
          duration: 0.15,
          ease: 'power1.out',
        }, 0.35);
        
        tl.to(note, {
          y: deltaY + 20, // 略微超过垃圾桶（被吸过头）
          duration: 0.35,
          ease: 'power3.in',
        }, 0.5);
        
        // 高速旋转（像被漩涡卷进去）
        tl.to(note, {
          rotate: `+=${720 + Math.random() * 360}`,
          rotateY: 360,
          rotateX: 360,
          duration: 0.5,
          ease: 'power1.in',
        }, 0.35);
        
        // 继续缩小成一点
        tl.to(note, {
          scale: 0.15,
          scaleX: 0.2,
          scaleY: 0.1,
          borderRadius: '50%',
          duration: 0.5,
          ease: 'power3.in',
        }, 0.35);
        
        // 4. 最后弹跳消失 (0.85-1.0s)
        tl.to(note, {
          scale: 0.01,
          opacity: 0,
          duration: 0.15,
          ease: 'power2.in',
        });
      } else {
        setTimeout(() => {
          onToggle(todo.id);
        }, 1000);
      }
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 组件卸载时清除 GSAP 动画
  useEffect(() => {
    // 设置初始旋转角度
    if (noteRef.current) {
      gsap.set(noteRef.current, { rotate: initialRotation.current });
    }
    
    return () => {
      if (noteRef.current) {
        gsap.killTweensOf(noteRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={noteRef}
      data-sticky-note
      className={`absolute select-none ${pinned ? "cursor-default" : "cursor-move"}`}
      style={{
        left: `${todo.position_x}px`,
        top: `${todo.position_y}px`,
        width: `${noteWidth}px`,
        perspective: "800px",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onEdit(todo)}
    >
      {/* 纸张本身，带纹理和阴影 */}
      <div
        ref={paperRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full p-4 rounded-lg flex flex-col select-none"
        style={{
          backgroundColor: priorityColors[todo.priority],
          backgroundImage: `
            linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)
          `,
          boxShadow: `3px 3px 12px ${priorityShadows[todo.priority]}, 1px 1px 0 ${priorityDarker[todo.priority]}`,
        }}
      >
        {/* 钉住按钮 - 取代气泡装饰 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPinned(!pinned);
          }}
          className="absolute -top-2.5 left-1 rounded-full transition-all hover:scale-110 active:scale-90 z-10"
          style={{
            color: pinned ? "var(--accent-primary)" : "rgba(0,0,0,0.3)",
            opacity: pinned ? 1 : 0.6,
            filter: pinned ? "drop-shadow(0 0 3px rgba(59,130,246,0.5))" : "none",
          }}
          title={pinned ? "取消钉住（可拖动）" : "钉住（禁止拖动）"}
        >
          {pinned ? <Pin size={20} /> : <PinOff size={18} />}
        </button>

        {/* 删除按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(todo.id);
          }}
          className="absolute -top-2 right-1 rounded-full p-1 transition-all hover:scale-110 active:scale-90 hover:bg-red-100 z-10"
          style={{
            color: "rgba(239,68,68,0.5)",
            opacity: 0.5,
          }}
          title="删除待办"
        >
          <Trash size={16} />
        </button>

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
      </div>
    </div>
  );
}
