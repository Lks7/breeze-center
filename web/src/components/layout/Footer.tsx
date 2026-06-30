import { Heart } from "lucide-react";

/**
 * Footer — 页脚
 */

export function Footer() {
  return (
    <footer
      className="mt-8 flex flex-col items-center gap-1 px-6 py-6 text-center text-xs"
      style={{ color: "var(--text-muted)" }}
    >
      <div className="flex items-center gap-1.5">
        Built with
        <Heart size={11} style={{ color: "var(--status-error)" }} fill="currentColor" />
        by Breeze
      </div>
      <div>
        breeze-center · 个人中心聚合站点 ·{" "}
        <span style={{ color: "var(--text-secondary)" }}>v0.1.0</span>
      </div>
    </footer>
  );
}
