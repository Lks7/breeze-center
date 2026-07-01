import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { pomodoroAPI } from "@/api/pomodoro";

interface Props {
  enterDelay?: number;
}

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const TIMER_KEY = "pomodoro-timer";

type Phase = "work" | "break";

interface SavedTimer {
  phase: Phase;
  startedAt: number;
  secondsLeft: number;
}

export function PomodoroWidget({ enterDelay = 0 }: Props) {
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      const raw = localStorage.getItem(TIMER_KEY);
      if (!raw) return "work";
      return (JSON.parse(raw) as SavedTimer).phase ?? "work";
    } catch { return "work"; }
  });

  const [secondsLeft, setSecondsLeft] = useState(() => {
    try {
      const raw = localStorage.getItem(TIMER_KEY);
      if (!raw) return WORK_SECONDS;
      const saved: SavedTimer = JSON.parse(raw);
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      return Math.max(saved.secondsLeft - elapsed, 0);
    } catch { return WORK_SECONDS; }
  });

  const [running, setRunning] = useState(() => {
    try {
      const raw = localStorage.getItem(TIMER_KEY);
      if (!raw) return false;
      const saved: SavedTimer = JSON.parse(raw);
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      return saved.secondsLeft - elapsed > 0;
    } catch { return false; }
  });

  // 从后端加载今日统计
  const { data: todayData } = useQuery({
    queryKey: ["pomodoro-today"],
    queryFn: pomodoroAPI.getToday,
    staleTime: 10_000,
  });
  const todayCount = todayData?.count ?? 0;

  // 保存/清除计时状态
  useEffect(() => {
    if (running) {
      localStorage.setItem(TIMER_KEY, JSON.stringify({ phase, startedAt: Date.now(), secondsLeft }));
    } else {
      localStorage.removeItem(TIMER_KEY);
    }
  }, [running, phase, secondsLeft]);

  // 计时完成时增量到后端（不依赖 localStorage 统计）
  const completeTimer = (currentPhase: Phase) => {
    setRunning(false);
    localStorage.removeItem(TIMER_KEY);
    pomodoroAPI.increment().catch(() => {}); // 异步增量

    if (currentPhase === "work") {
      if (Notification.permission === "granted") {
        new Notification("番茄钟", { body: "专注完成！休息一下吧 🎉" });
      }
      setPhase("break");
      setSecondsLeft(BREAK_SECONDS);
    } else {
      if (Notification.permission === "granted") {
        new Notification("番茄钟", { body: "休息结束，开始新的专注！💪" });
      }
      setPhase("work");
      setSecondsLeft(WORK_SECONDS);
    }
  };

  // 计时器
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          completeTimer(phase);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line

  const toggle = () => {
    if (!running && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setRunning(!running);
  };

  const reset = () => {
    setRunning(false);
    localStorage.removeItem(TIMER_KEY);
    setSecondsLeft(phase === "work" ? WORK_SECONDS : BREAK_SECONDS);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const totalSeconds = phase === "work" ? WORK_SECONDS : BREAK_SECONDS;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: `${enterDelay}ms` }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Timer size={16} style={{ color: phase === "work" ? "#ef4444" : "#22c55e" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {phase === "work" ? "专注" : "休息"}
          </h3>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          今日 {todayCount} 🍅
        </span>
      </div>

      <div className="flex justify-center mb-3">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={phase === "work" ? "#ef4444" : "#22c55e"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold" style={{ color: "var(--text-primary)" }}>
              {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {phase === "work" ? "25 分钟" : "5 分钟"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={toggle}
          className="rounded-full p-2.5 transition-all hover:scale-105"
          style={{
            background: phase === "work" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
            color: phase === "work" ? "#ef4444" : "#22c55e",
          }}
          title={running ? "暂停" : "开始"}
        >
          {running ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={reset}
          className="rounded-full p-2.5 transition-all hover:scale-105"
          style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
          title="重置"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
