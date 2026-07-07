import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  TrendingUp,
  Server,
  Layers,
  Rss,
  CheckSquare,
  Bookmark,
  CalendarCheck,
  Bell,
  Github,
  FileText,
  FolderOpen,
  Sun,
  Moon,
  Settings,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * HomeSidebar — 首页左侧边栏导航
 *
 * 固定在左侧，不随滚动移动。
 * 桌面端始终显示图标导航，移动端折叠为汉堡菜单。
 */

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: Home },
  { to: "/fund", label: "基金盈亏", icon: TrendingUp },
  { to: "/services", label: "快捷导航", icon: Server },
  { to: "/fusion", label: "融合站点", icon: Layers },
  { to: "/rss", label: "RSS 订阅", icon: Rss },
  { to: "/plans", label: "待办计划", icon: CheckSquare },
  { to: "/bookmarks", label: "书签", icon: Bookmark },
  { to: "/check-in", label: "打卡", icon: CalendarCheck },
  { to: "/notifications", label: "通知中心", icon: Bell },
  { to: "/github", label: "GitHub", icon: Github },
  { to: "/blog", label: "博客", icon: FileText },
  { to: "/files", label: "文件中心", icon: FolderOpen },
];

export function HomeSidebar() {
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* 移动端汉堡菜单按钮 */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg lg:hidden"
        style={{
          background: "var(--accent-gradient)",
          color: "#fff",
        }}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-14 flex-col backdrop-blur-xl transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "color-mix(in srgb, var(--bg-secondary) 85%, transparent)",
          borderRight: "1px solid var(--border-card)",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center py-4 transition-all hover:scale-105"
          title="BreezeCenter"
        >
          <div
            className="h-7 w-7 rounded-lg"
            style={{ background: "var(--accent-gradient)" }}
          />
        </button>

        {/* 分隔线 */}
        <div className="mx-3 mb-1 h-px" style={{ background: "var(--border-card)" }} />

        {/* 导航链接 */}
        <nav className="flex-1 space-y-0.5 px-2 py-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center rounded-lg px-1 py-2.5 transition-all"
                style={{
                  background: active
                    ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                    : "transparent",
                }}
                title={item.label}
              >
                <Icon
                  size={18}
                  style={{
                    color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}
                />
              </NavLink>
            );
          })}
        </nav>

        {/* 底部操作 */}
        <div className="border-t space-y-0.5 px-2 py-2" style={{ borderColor: "var(--border-card)" }}>
          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-center rounded-lg px-1 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)]"
            title={theme === "dark" ? "亮色模式" : "暗色模式"}
          >
            {theme === "dark" ? (
              <Sun size={18} style={{ color: "var(--text-secondary)" }} />
            ) : (
              <Moon size={18} style={{ color: "var(--text-secondary)" }} />
            )}
          </button>

          {/* 首页设置 */}
          <button
            onClick={() => {
              // 触发 TopBar 的设置按钮——通过事件冒泡触发 HomePage 的 settings
              window.dispatchEvent(new CustomEvent("open-home-settings"));
              setMobileOpen(false);
            }}
            className="flex w-full items-center justify-center rounded-lg px-1 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)]"
            title="首页设置"
          >
            <Settings size={18} style={{ color: "var(--text-secondary)" }} />
          </button>

          {/* 后台管理 */}
          <button
            onClick={() => {
              navigate("/admin");
              setMobileOpen(false);
            }}
            className="flex w-full items-center justify-center rounded-lg px-1 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)]"
            title="后台管理"
          >
            <LayoutDashboard size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </aside>
    </>
  );
}
