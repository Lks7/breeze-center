import { useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";

interface CalendarHeatmapProps {
  /** checkedDates: 选中月份内的已打卡日期 (YYYY-MM-DD 格式) */
  checkedDates: string[];
  /** failedDates: 选中月份内的失败打卡日期 (YYYY-MM-DD 格式) */
  failedDates?: string[];
  /** completedTodoDates: 选中月份内待办完成日期 (YYYY-MM-DD 格式) */
  completedTodoDates?: string[];
  /** year, month: 当前展示的年月（1-based month） */
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  onDateClick?: (date: string) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 根据状态返回格子颜色配置 */
function getCellColor(isChecked: boolean, isFailed: boolean, isToday: boolean): { bg: string; text: string; border: string } {
  if (isChecked) {
    return { bg: "var(--status-ok)", text: "#fff", border: isToday ? "#22c55e" : "transparent" };
  }
  if (isFailed) {
    return { bg: "#ef4444", text: "#fff", border: isToday ? "#ef4444" : "transparent" };
  }
  return {
    bg: "var(--bg-card)",
    text: "var(--text-muted)",
    border: isToday ? "var(--accent-secondary)" : "var(--border-card)",
  };
}

export function CalendarHeatmap({
  checkedDates,
  failedDates = [],
  completedTodoDates = [],
  year,
  month,
  onMonthChange,
  onDateClick,
}: CalendarHeatmapProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const checkedSet = useMemo(() => new Set(checkedDates), [checkedDates]);
  const failedSet = useMemo(() => new Set(failedDates), [failedDates]);
  const todoCompletedSet = useMemo(() => new Set(completedTodoDates), [completedTodoDates]);

  // 计算该月所有日期格子
  const calendar = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=周日
    const totalDays = lastDay.getDate();

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    // 补齐上月末的空白天
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    return weeks;
  }, [year, month]);

  const monthLabel = `${year}年${month}月`;

  const goPrev = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };
  const goNext = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  const handleDateClick = useCallback((dateStr: string, target: HTMLElement) => {
    // GSAP 弹跳动画
    gsap.timeline()
      .to(target, { scale: 0.85, duration: 0.1, ease: 'power2.in' })
      .to(target, { scale: 1.15, duration: 0.2, ease: 'power2.out' })
      .to(target, { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.5)' });

    onDateClick?.(dateStr);
  }, [onDateClick]);

  return (
    <div>
      {/* 月份切换 */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={goPrev}
          className="rounded-lg p-1 transition hover:bg-[var(--bg-card-hover)]"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {monthLabel}
        </span>
        <button
          onClick={goNext}
          className="rounded-lg p-1 transition hover:bg-[var(--bg-card-hover)]"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 周标题 */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {WEEKDAYS.map((wd) => (
          <span
            key={wd}
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {wd}
          </span>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="flex flex-col gap-1">
        {calendar.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={di} className="aspect-square" />;
              }
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isChecked = checkedSet.has(dateStr);
              const isFailed = failedSet.has(dateStr);
              const hasTodoCompleted = todoCompletedSet.has(dateStr);
              const isToday = dateStr === todayStr;

              const { bg, text, border } = getCellColor(isChecked, isFailed, isToday);

              // 构建 title
              let title = dateStr;
              if (isChecked) title += " ✓成功";
              if (isFailed) title += " ✗失败";
              if (hasTodoCompleted) title += " ✓待办";

              return (
                <button
                  key={di}
                  onClick={(e) => handleDateClick(dateStr, e.currentTarget)}
                  className="relative flex aspect-square items-center justify-center rounded-md text-xs font-mono hover:shadow-md"
                  style={{
                    background: bg,
                    color: text,
                    border: border,
                    opacity: isChecked || isFailed ? 1 : 0.6,
                  }}
                  title={title}
                >
                  {day}
                  {/* 待办完成指示器 - 底部小条 */}
                  {hasTodoCompleted && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-b-md"
                      style={{
                        background: "#3b82f6",
                        opacity: 0.8,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
