import { useMemo, type CSSProperties } from "react";

/**
 * Sparkle — 闪烁粒子
 * 随机位置、延迟的小星点，点缀在标题或重要元素旁
 */

export interface SparkleProps {
  count?: number;
  className?: string;
}

export function Sparkle({ count = 5, className = "" }: SparkleProps) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 3,
        delay: `${Math.random() * 3}s`,
        duration: `${2 + Math.random() * 2}s`,
      })),
    [count]
  );

  return (
    <span className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="sparkle absolute rounded-full"
          style={
            {
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              background: "var(--accent-primary)",
              animationDelay: s.delay,
              animationDuration: s.duration,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
