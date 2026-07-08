import { useRef, useCallback } from "react";
import { Check, X, Loader2, Flame, Target, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useScaleBounce } from "@/hooks/useGSAPAnimation";
import type { Habit } from "@/types/entities";

interface HabitCardProps {
  habit: Habit;
  onCheckIn: (todoId: string) => void;
  onCheckInFail?: (todoId: string) => void;
  onDelete?: (todoId: string) => void;
  isPending?: boolean;
}

const FREQ_LABELS: Record<string, string> = {
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
};

export function HabitCard({ habit, onCheckIn, onCheckInFail, onDelete, isPending }: HabitCardProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerBounce = useScaleBounce(buttonRef);

  const freqLabel = FREQ_LABELS[habit.habit_frequency] || habit.habit_frequency;
  const targetStr = habit.habit_target > 0 ? `${habit.habit_target}次` : "";

  // 连胜里程碑动画
  const isMilestone = habit.streak > 0 && [7, 30, 50, 100, 365].includes(habit.streak);

  const { today_status } = habit;
  const isSuccess = today_status === "success";
  const isFailure = today_status === "failure";

  const handleDoubleClick = useCallback(() => {
    if (isPending) return;
    triggerBounce();
    onCheckInFail?.(habit.id);
  }, [habit.id, isPending, onCheckInFail, triggerBounce]);

  const handleSingleClick = useCallback(() => {
    if (isPending) return;
    triggerBounce();
    onCheckIn(habit.id);
  }, [habit.id, isPending, onCheckIn, triggerBounce]);

  const handleCardClick = useCallback(() => {
    if (clickTimerRef.current) {
      // 检测到第二次点击 → 双击
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleDoubleClick();
    } else {
      // 第一次点击 → 延迟 250ms 判断是否为双击
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        handleSingleClick();
      }, 250);
    }
  }, [handleSingleClick, handleDoubleClick]);

  // 视觉状态
  let leftBarColor = "var(--accent-secondary)";
  let bgStyle: React.CSSProperties = {};
  let btnText: React.ReactNode = "打卡";
  let btnBg = "var(--accent-gradient)";
  if (isSuccess) {
    leftBarColor = "var(--status-ok)";
    bgStyle = { background: "rgba(34, 197, 94, 0.06)" };
    btnText = (
      <span className="flex items-center gap-1">
        <Check size={14} /> 已打卡
      </span>
    );
    btnBg = "var(--status-ok)";
  } else if (isFailure) {
    leftBarColor = "#ef4444";
    bgStyle = { background: "rgba(239, 68, 68, 0.06)" };
    btnText = (
      <span className="flex items-center gap-1">
        <X size={14} /> 已失败
      </span>
    );
    btnBg = "#ef4444";
  }

  return (
    <GlassCard
      className="relative flex items-center gap-3 overflow-hidden cursor-pointer select-none"
      interactive={false}
      onClick={handleCardClick}
      style={bgStyle}
    >
      {/* 左侧颜色条 — 根据打卡状态显示不同颜色 */}
      <span
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: leftBarColor }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {habit.text}
          </span>
          {habit.habit_target > 0 && (
            <span
              className="flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-card)",
              }}
            >
              <Target size={10} />
              {freqLabel}{targetStr}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3">
          {/* 连胜 */}
          {habit.streak > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${isMilestone ? "animate-pulse" : ""}`}
              style={{ color: "#f97316" }}
            >
              <Flame size={14} />
              {habit.streak} 天
            </span>
          )}
        </div>
      </div>

      {/* 打卡按钮 */}
      <button
        ref={buttonRef}
        disabled={isPending}
        className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition hover:shadow-lg"
        style={{
          background: btnBg,
          color: "#fff",
          cursor: isPending ? "default" : "pointer",
          opacity: isPending ? 0.7 : 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          // 点击按钮触发单击逻辑
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
          }
          handleSingleClick();
        }}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          btnText
        )}
      </button>

      {/* 删除按钮 */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (clickTimerRef.current) {
              clearTimeout(clickTimerRef.current);
              clickTimerRef.current = null;
            }
            onDelete(habit.id);
          }}
          className="shrink-0 rounded-lg p-2 text-xs transition hover:bg-[var(--bg-card-hover)]"
          style={{ color: "var(--text-muted)" }}
          title="删除习惯"
        >
          <Trash2 size={14} />
        </button>
      )}
    </GlassCard>
  );
}
