import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Square,
  Trash2,
  Plus,
  Loader2,
  Calendar,
  Flag,
  Repeat,
  Flame,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientText } from "@/components/ui/GradientText";
import { HabitCard } from "@/components/checkin/HabitCard";
import { HabitDetailPanel } from "@/components/checkin/HabitDetailPanel";
import { CalendarHeatmap } from "@/components/checkin/CalendarHeatmap";
import { StatsCards } from "@/components/checkin/StatsCards";
import { todoAPI } from "@/api/admin";
import { checkInAPI } from "@/api/checkin";
import type { Todo, Habit, HabitStats } from "@/types/entities";

type Priority = Todo["priority"];

const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  high: {
    label: "高优先级",
    color: "var(--status-error)",
    bg: "color-mix(in srgb, var(--status-error) 10%, transparent)",
  },
  medium: {
    label: "中优先级",
    color: "var(--status-warn)",
    bg: "color-mix(in srgb, var(--status-warn) 10%, transparent)",
  },
  low: {
    label: "低优先级",
    color: "var(--status-ok)",
    bg: "color-mix(in srgb, var(--status-ok) 10%, transparent)",
  },
};

export function PlansPage() {
  const qc = useQueryClient();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 待办相关状态
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [isHabit, setIsHabit] = useState(false);
  const [habitFrequency, setHabitFrequency] = useState<string>("daily");

  // 日历相关状态
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [detailHabitId, setDetailHabitId] = useState<string | null>(null);

  // Section 折叠状态
  const [checkinExpanded, setCheckinExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);
  const [calendarExpanded, setCalendarExpanded] = useState(true);

  // ========== 数据加载 ==========

  // 待办列表
  const { data: todos = [], isLoading: todosLoading } = useQuery({
    queryKey: ["plans", "todos"],
    queryFn: todoAPI.list,
  });

  // 习惯列表
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: checkInAPI.listHabits,
  });

  // 所有习惯的统计数据
  const { data: habitStatsMap } = useQuery({
    queryKey: ["habits", "stats", habits.map((h) => h.id).join(",")],
    queryFn: async () => {
      const map: Record<string, HabitStats> = {};
      await Promise.all(
        habits.map(async (h) => {
          try {
            map[h.id] = await checkInAPI.getStats(h.id);
          } catch {
            // 单个习惯统计失败不影响其他
          }
        })
      );
      return map;
    },
    enabled: habits.length > 0,
  });

  // 打卡日历数据（批量查询）
  const { data: calendarData = {} } = useQuery({
    queryKey: ["checkins", "calendar", calendarYear, calendarMonth, habits.map((h) => h.id).join(",")],
    queryFn: async () => {
      const ids = selectedHabitId ? [selectedHabitId] : habits.map((h) => h.id);
      if (ids.length === 0) return {};
      return checkInAPI.batchListCheckIns(ids, `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`);
    },
    enabled: habits.length > 0,
  });

  const selectedDates = useMemo(() => {
    if (selectedHabitId) return calendarData[selectedHabitId] ?? [];
    return [...new Set(Object.values(calendarData).flat())];
  }, [calendarData, selectedHabitId]);

  // 聚合统计
  const aggStats = useMemo(() => {
    if (!habitStatsMap) return null;
    const entries = Object.values(habitStatsMap);
    if (entries.length === 0) return null;
    return {
      currentStreak: Math.max(...entries.map((s) => s.current_streak), 0),
      longestStreak: Math.max(...entries.map((s) => s.longest_streak), 0),
      weekDone: entries.reduce((sum, s) => sum + s.week_done, 0),
      weekTarget: Math.max(...entries.map((s) => s.week_target), 0),
      monthDone: entries.reduce((sum, s) => sum + s.month_done, 0),
      monthTarget: Math.max(...entries.map((s) => s.month_target), 0),
      totalCheckIns: entries.reduce((sum, s) => sum + s.total_check_ins, 0),
    };
  }, [habitStatsMap]);

  // 习惯完成率
  const completionRate = useMemo(() => {
    if (!habitStatsMap || habits.length === 0) return 0;
    const done = Object.values(habitStatsMap).filter((s) => s.today_done).length;
    return habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
  }, [habitStatsMap, habits]);

  // ========== Mutations ==========

  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["plans", "todos"] });
    qc.invalidateQueries({ queryKey: ["admin", "todos"] });
    qc.invalidateQueries({ queryKey: ["habits"] });
    qc.invalidateQueries({ queryKey: ["habits", "stats"] });
    qc.invalidateQueries({ queryKey: ["checkins"] });
  }, [qc]);

  // 创建待办
  const createMut = useMutation({
    mutationFn: () =>
      todoAPI.create({
        text,
        priority,
        is_habit: isHabit,
        habit_frequency: isHabit ? habitFrequency : "",
        habit_target: 0,
      } as Partial<Todo>),
    onSuccess: () => {
      invalidateAll();
      setText("");
      setIsHabit(false);
    },
  });

  // 切换完成
  const toggleMut = useMutation({
    mutationFn: (id: string) => todoAPI.toggle(id),
    onSuccess: () => invalidateAll(),
  });

  // 删除待办
  const deleteMut = useMutation({
    mutationFn: (id: string) => todoAPI.delete(id),
    onSuccess: () => invalidateAll(),
  });

  // 打卡（今日快速打卡）
  const checkInMut = useMutation({
    mutationFn: async (todoId: string) => {
      setCheckingId(todoId);
      return checkInAPI.createCheckIn(todoId);
    },
    onSuccess: () => invalidateAll(),
    onSettled: () => setCheckingId(null),
  });

  // 打卡（指定日期，用于日历补打卡）
  const checkInDateMut = useMutation({
    mutationFn: async ({ todoId, date }: { todoId: string; date: string }) => {
      setCheckingId(todoId);
      return checkInAPI.createCheckIn(todoId, date);
    },
    onSuccess: () => invalidateAll(),
    onSettled: () => setCheckingId(null),
  });

  // 取消打卡
  const uncheckMut = useMutation({
    mutationFn: async ({ todoId, date }: { todoId: string; date: string }) => {
      setCheckingId(todoId);
      return checkInAPI.deleteCheckInByDate(todoId, date);
    },
    onSuccess: () => invalidateAll(),
    onSettled: () => setCheckingId(null),
  });

  // ========== 待办分组 ==========

  const groups: Record<Priority, Todo[]> = { high: [], medium: [], low: [] };
  for (const t of todos) {
    groups[t.priority]?.push(t);
  }

  const totalTodos = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const remainCount = totalTodos - doneCount;
  const todoCompletionRate = totalTodos > 0 ? Math.round((doneCount / totalTodos) * 100) : 0;

  // ========== 打卡区数据 ==========

  const uncheckedHabits = habits.filter((h) => !h.today_checked);
  const checkedHabits = habits.filter((h) => h.today_checked);

  // 日历打卡切换
  const handleDateClick = useCallback(
    (date: string) => {
      if (!selectedHabitId) return;
      const checkedDates = calendarData[selectedHabitId] ?? [];
      const isChecked = checkedDates.includes(date);
      if (isChecked) {
        uncheckMut.mutate({ todoId: selectedHabitId, date });
      } else {
        checkInDateMut.mutate({ todoId: selectedHabitId, date });
      }
    },
    [selectedHabitId, calendarData, checkInDateMut, uncheckMut]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      {/* ===== 顶部导航 ===== */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/"
          className="btn-ghost"
          style={{ border: "1px solid var(--border-card)" }}
        >
          <ArrowLeft size={15} />
          首页
        </Link>
        <h1 className="text-2xl font-semibold">
          <GradientText>目标管理中心</GradientText>
        </h1>
      </div>

      {/* ===== 摘要条 ===== */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="总待办" value={totalTodos} />
        <SummaryCard label="未完成" value={remainCount} highlight />
        <SummaryCard label="已完成" value={doneCount} />
        <SummaryCard label="完成率" value={`${todoCompletionRate}%`} />
      </div>

      {/* ===== 快速添加栏 ===== */}
      <GlassCard className="mb-6 !p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) createMut.mutate();
          }}
          className="flex items-center gap-2"
        >
          <Plus
            size={16}
            style={{ color: "var(--accent-primary)" }}
            className="ml-1 shrink-0"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="添加待办，回车提交..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
            autoFocus
          />
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--bg-card)" }}>
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className="rounded px-2 py-1 text-xs transition"
                style={{
                  background:
                    priority === p ? PRIORITY_META[p].bg : "transparent",
                  color: priority === p ? PRIORITY_META[p].color : "var(--text-muted)",
                }}
              >
                {PRIORITY_META[p].label.charAt(0)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
            <input
              type="checkbox"
              checked={isHabit}
              onChange={(e) => setIsHabit(e.target.checked)}
            />
            习惯
          </label>
          {isHabit && (
            <select
              value={habitFrequency}
              onChange={(e) => setHabitFrequency(e.target.value)}
              className="rounded-lg px-1.5 py-1 text-xs outline-none"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-card)",
                color: "var(--text-primary)",
              }}
            >
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          )}
          <button
            type="submit"
            disabled={createMut.isPending || !text.trim()}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--accent-gradient)" }}
          >
            {createMut.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            添加
          </button>
        </form>
      </GlassCard>

      {/* ===== 待办看板 ===== */}
      {todosLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      ) : totalTodos === 0 ? (
        <GlassCard interactive={false} className="mb-6 py-16 text-center">
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            还没有待办事项
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            在上方输入框添加第一条
          </p>
        </GlassCard>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <PriorityColumn
              key={p}
              priority={p}
              items={groups[p]}
              onToggle={(id) => toggleMut.mutate(id)}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* ===== 习惯详情弹窗 ===== */}
      {detailHabitId && (
        <HabitDetailPanel
          habit={habits.find((h) => h.id === detailHabitId) ?? habits[0]}
          onClose={() => setDetailHabitId(null)}
        />
      )}

      {/* ===== 习惯模块（有习惯时才显示） ===== */}
      {!habitsLoading && habits.length > 0 && (
        <div className="space-y-6">
          {/* ── 今日打卡 ── */}
          <CollapsibleSection
            title="今日打卡"
            icon={<Flame size={16} style={{ color: "#f97316" }} />}
            expanded={checkinExpanded}
            onToggle={() => setCheckinExpanded(!checkinExpanded)}
            badge={
              uncheckedHabits.length > 0
                ? `${uncheckedHabits.length} 项待打卡`
                : "全部完成 🎉"
            }
            badgeColor={uncheckedHabits.length > 0 ? "var(--text-muted)" : "var(--status-ok)"}
          >
            <div className="space-y-2">
              {uncheckedHabits.length === 0 && checkedHabits.length === 0 ? (
                <p className="py-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  暂无习惯目标
                </p>
              ) : (
                [...uncheckedHabits, ...checkedHabits].map((habit) => (
                  <div
                    key={habit.id}
                    className="relative"
                  >
                    <HabitCard
                      habit={habit}
                      onCheckIn={(id) => checkInMut.mutate(id)}
                      isPending={checkingId === habit.id}
                    />
                    {habit.today_checked && (
                      <button
                        onClick={() => setDetailHabitId(habit.id)}
                        className="absolute right-14 top-1/2 -translate-y-1/2 text-xs underline-offset-1 hover:underline"
                        style={{ color: "var(--text-muted)", fontSize: 10 }}
                      >
                        详情
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          {/* ── 进度总览 ── */}
          <CollapsibleSection
            title="进度总览"
            icon={<Sparkles size={16} style={{ color: "var(--accent-primary)" }} />}
            expanded={progressExpanded}
            onToggle={() => setProgressExpanded(!progressExpanded)}
          >
            {/* 统计卡片 */}
            {aggStats && <StatsCards {...aggStats} />}

            {/* 完成率环形图 + 各习惯状态 */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CompletionRing rate={completionRate} habits={habits} statsMap={habitStatsMap ?? {}} />
              <HabitStatusList
              habits={habits}
              statsMap={habitStatsMap ?? {}}
              onHabitClick={(id) => setDetailHabitId(id)}
            />
            </div>
          </CollapsibleSection>

          {/* ── 打卡日历 ── */}
          <CollapsibleSection
            title="打卡日历"
            icon={<Calendar size={16} style={{ color: "var(--accent-primary)" }} />}
            expanded={calendarExpanded}
            onToggle={() => setCalendarExpanded(!calendarExpanded)}
          >
            <GlassCard interactive={false}>
              {/* 习惯选择器 */}
              {habits.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedHabitId(null)}
                    className="rounded-lg px-2.5 py-1 text-xs transition"
                    style={{
                      background: !selectedHabitId ? "var(--accent-primary)" : "var(--bg-card)",
                      color: !selectedHabitId ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    全部
                  </button>
                  {habits.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHabitId(h.id)}
                      className="rounded-lg px-2.5 py-1 text-xs transition truncate max-w-[120px]"
                      style={{
                        background: selectedHabitId === h.id ? "var(--accent-primary)" : "var(--bg-card)",
                        color: selectedHabitId === h.id ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {h.text}
                    </button>
                  ))}
                </div>
              )}
              <CalendarHeatmap
                checkedDates={selectedDates}
                year={calendarYear}
                month={calendarMonth}
                onMonthChange={(y, m) => {
                  setCalendarYear(y);
                  setCalendarMonth(m);
                }}
                onDateClick={selectedHabitId ? handleDateClick : undefined}
              />
              {selectedHabitId && (
                <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  点击日期可{selectedDates.includes(todayStr) ? "取消打卡" : "补打卡"}（仅限选中的习惯）
                </p>
              )}
            </GlassCard>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 折叠式 Section
// ============================================================

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
  badge,
  badgeColor,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <section>
      <button
        onClick={onToggle}
        className="mb-3 flex w-full items-center gap-2 text-left"
        style={{ color: "var(--text-secondary)" }}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {icon}
        <span className="text-sm font-medium">{title}</span>
        {badge && (
          <span
            className="text-xs rounded-full px-1.5 py-0.5"
            style={{
              background: "var(--bg-card)",
              color: badgeColor ?? "var(--text-muted)",
            }}
          >
            {badge}
          </span>
        )}
      </button>
      {expanded && children}
    </section>
  );
}

// ============================================================
// 摘要卡片
// ============================================================

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <GlassCard interactive={false} className="!p-4">
      <div
        className="text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <div
        className="count-rise mt-1 font-mono text-2xl font-bold tabular-nums"
        style={{
          color: highlight ? "var(--accent-primary)" : "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </GlassCard>
  );
}

// ============================================================
// 优先级列
// ============================================================

function PriorityColumn({
  priority,
  items,
  onToggle,
  onDelete,
}: {
  priority: Priority;
  items: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = PRIORITY_META[priority];
  const undone = items.filter((t) => !t.done).length;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{ background: meta.bg }}
      >
        <Flag size={13} style={{ color: meta.color }} fill="currentColor" />
        <span className="text-sm font-medium" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs font-mono"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
          }}
        >
          {undone}/{items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div
            className="rounded-lg border border-dashed py-8 text-center text-xs"
            style={{
              borderColor: "var(--border-card)",
              color: "var(--text-muted)",
            }}
          >
            暂无
          </div>
        ) : (
          items.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              onToggle={() => onToggle(t.id)}
              onDelete={() => onDelete(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// 单条待办
// ============================================================

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = PRIORITY_META[todo.priority];
  return (
    <GlassCard className="group relative flex items-start gap-2.5 overflow-hidden !p-3">
      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0 transition hover:scale-110"
        title={todo.done ? "标记为未完成" : "标记为已完成"}
      >
        {todo.done ? (
          <Check
            size={16}
            style={{ color: "var(--status-ok)" }}
            fill="currentColor"
          />
        ) : (
          <Square size={16} style={{ color: "var(--text-muted)" }} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm leading-relaxed transition"
          style={{
            color: todo.done ? "var(--text-muted)" : "var(--text-primary)",
            textDecoration: todo.done ? "line-through" : "none",
          }}
        >
          {todo.text}
        </p>
        {todo.due_date && (
          <div
            className="mt-1 flex items-center gap-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Calendar size={11} />
            {todo.due_date}
          </div>
        )}
        {todo.is_habit && (
          <div
            className="mt-1 flex items-center gap-1 text-xs"
            style={{ color: "var(--accent-primary)" }}
          >
            <Repeat size={11} />
            习惯
          </div>
        )}
      </div>

      <span
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: meta.color }}
      />

      <button
        onClick={onDelete}
        className="shrink-0 opacity-0 transition group-hover:opacity-100"
        style={{ color: "var(--status-error)" }}
        title="删除"
      >
        <Trash2 size={13} />
      </button>
    </GlassCard>
  );
}

// ============================================================
// 完成率环形图
// ============================================================

function CompletionRing({
  rate,
  habits,
  statsMap,
}: {
  rate: number;
  habits: Habit[];
  statsMap: Record<string, HabitStats>;
}) {
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <GlassCard interactive={false} className="flex items-center gap-4 !p-4">
      <div className="relative shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--bg-card)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--accent-primary)"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
            {rate}%
          </span>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>今日习惯完成率</div>
        <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {habits.filter((h) => statsMap[h.id]?.today_done).length}/{habits.length} 项已完成
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================================
// 各习惯状态列表
// ============================================================

function HabitStatusList({
  habits,
  statsMap,
  onHabitClick,
}: {
  habits: Habit[];
  statsMap: Record<string, HabitStats>;
  onHabitClick?: (id: string) => void;
}) {
  return (
    <GlassCard interactive={false} className="!p-4">
      <div className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        各习惯状态
      </div>
      <div className="space-y-1">
        {habits.map((h) => {
          const stats = statsMap[h.id];
          return (
            <button
              key={h.id}
              onClick={() => onHabitClick?.(h.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--bg-card-hover)]"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{
                  background: stats?.today_done ? "var(--status-ok)" : "var(--text-muted)",
                }}
              />
              <span className="flex-1 text-xs truncate" style={{ color: "var(--text-primary)" }}>
                {h.text}
              </span>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {stats ? `${stats.week_done}/${stats.week_target || "-"}` : "-"}
              </span>
              <span className="flex items-center gap-0.5 text-xs" style={{ color: "#f97316" }}>
                {stats?.current_streak ?? 0}天
              </span>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}
