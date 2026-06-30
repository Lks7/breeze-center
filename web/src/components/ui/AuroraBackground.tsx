/**
 * AuroraBackground — 极光背景
 * 3 个大型模糊渐变 blob，极慢速漂移，营造科技氛围
 */

export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 基底渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, var(--bg-secondary), var(--bg-primary) 60%)",
        }}
      />
      {/* 青色 blob */}
      <div
        className="aurora-blob absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-30 blur-[100px]"
        style={{ background: "var(--accent-primary)", animationDelay: "0s" }}
      />
      {/* 紫色 blob */}
      <div
        className="aurora-blob absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full opacity-25 blur-[100px]"
        style={{
          background: "var(--accent-secondary)",
          animationDelay: "-20s",
        }}
      />
      {/* 粉色 blob */}
      <div
        className="aurora-blob absolute -bottom-40 left-1/4 h-[440px] w-[440px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: "var(--accent-tertiary)",
          animationDelay: "-40s",
        }}
      />
      {/* 细微噪点纹理（可选，增强质感） */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
