import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Rss,
  Server,
  Bookmark,
  CheckSquare,
  FolderOpen,
  Layers,
  Clock,
  Home,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const NAV = [
  { to: "/admin/rss", label: "RSS 订阅", icon: Rss },
  { to: "/files", label: "文件中心", icon: FolderOpen, external: true },
  { to: "/admin/services", label: "服务", icon: Server },
  { to: "/admin/bookmarks", label: "书签", icon: Bookmark },
  { to: "/admin/todos", label: "待办", icon: CheckSquare },
  { to: "/admin/fusion", label: "融合站点", icon: Layers },
  { to: "/admin/subscriptions", label: "订阅管理", icon: Clock },
];

export function AdminLayout() {
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside
        className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--bg-secondary) 80%, transparent)",
          borderRight: "1px solid var(--border-card)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-4 transition-all hover:scale-105"
          title="回到首页"
        >
          <div
            className="h-6 w-6 rounded-lg"
            style={{ background: "var(--accent-gradient)" }}
          />
          <span className="text-sm font-semibold">
            Breeze<span className="gradient-text">Center</span>
          </span>
          <span
            className="ml-auto rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
          >
            ADMIN
          </span>
        </button>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            // 外部链接（如文件中心）不需要 NavLink，直接使用 a 标签
            if (item.external) {
              return (
                <a
                  key={item.to}
                  href={item.to}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                >
                  <Icon size={15} />
                  {item.label}
                </a>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)" }
                    : undefined
                }
              >
                <Icon size={15} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t px-3 py-3" style={{ borderColor: "var(--border-card)" }}>
          <NavLink
            to="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
          >
            <Home size={15} />
            返回首页
          </NavLink>
          <button
            onClick={toggleTheme}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            {theme === "dark" ? "亮色模式" : "暗色模式"}
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 pl-56">
        <Outlet />
      </main>
    </div>
  );
}
