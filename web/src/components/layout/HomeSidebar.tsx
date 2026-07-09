import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  Home,
  TrendingUp,
  Server,
  Layers,
  Rss,
  CheckSquare,
  Bookmark,
  Bell,
  Github,
  FolderOpen,
  Sun,
  Moon,
  Settings,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  CreditCard,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * HomeSidebar — 首页左侧边栏导航
 *
 * 固定在左侧，不随滚动移动。
 * 桌面端可折叠：点击底部箭头展开显示标签，再点收回图标模式。
 * 移动端折叠为汉堡菜单。
 */

const NAV_ITEMS = [
  { to: "/", label: "首页", icon: Home },
  { to: "/fund", label: "基金盈亏", icon: TrendingUp },
  { to: "/services", label: "快捷导航", icon: Server },
  { to: "/fusion", label: "融合站点", icon: Layers },
  { to: "/rss", label: "RSS 订阅", icon: Rss },
  { to: "/subscriptions", label: "订阅", icon: CreditCard },
  {
    label: "目标管理",
    icon: CheckSquare,
    children: [
      { to: "/plans", label: "待办", icon: CheckSquare },
      { to: "/habits", label: "习惯", icon: Flame },
    ],
  },
  { to: "/bookmarks", label: "书签", icon: Bookmark },
  { to: "/notifications", label: "通知中心", icon: Bell },
  { to: "/github", label: "GitHub", icon: Github },
  { to: "/files", label: "文件中心", icon: FolderOpen },
];

export const SIDEBAR_COLLAPSED_W = 56;
export const SIDEBAR_EXPANDED_W = 192;

interface HomeSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function HomeSidebar({ collapsed, onToggle }: HomeSidebarProps) {
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["目标管理"]));
  
  const sidebarRef = useRef<HTMLElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  
  // 侧边栏展开/收起动画
  useEffect(() => {
    if (!sidebarRef.current) return;
    
    const targetWidth = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;
    
    gsap.to(sidebarRef.current, {
      width: targetWidth,
      duration: 0.4,
      ease: 'power2.inOut',
    });
  }, [collapsed]);
  
  // 菜单项入场动画
  useEffect(() => {
    if (!navItemsRef.current) return;
    
    const items = navItemsRef.current.querySelectorAll('.nav-item');
    
    gsap.fromTo(
      items,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
      }
    );
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const toggleExpand = (label: string) => {
    const isExpanding = !expandedItems.has(label);
    
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
    
    // 子菜单展开/收起动画
    setTimeout(() => {
      const childContainer = document.querySelector(`[data-parent="${label}"]`);
      if (childContainer && isExpanding) {
        const children = childContainer.querySelectorAll('.child-nav-item');
        gsap.fromTo(
          children,
          { opacity: 0, x: -10 },
          {
            opacity: 1,
            x: 0,
            duration: 0.2,
            stagger: 0.05,
            ease: 'power2.out',
          }
        );
      }
    }, 0);
  };

  const w = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W;

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
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col backdrop-blur-xl
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          width: mobileOpen ? SIDEBAR_EXPANDED_W : w,
          background: "color-mix(in srgb, var(--bg-secondary) 85%, transparent)",
          borderRight: "1px solid var(--border-card)",
        }}
      >
        {/* 导航链接 — 首页显示在最顶层 */}
        <nav ref={navItemsRef} className="flex-1 space-y-0.5 px-2 pt-3 pb-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            
            // 父菜单项（有子菜单）
            if ('children' in item && item.children) {
              const isExpanded = expandedItems.has(item.label);
              const hasActiveChild = item.children.some((child) => isActive(child.to));
              
              return (
                <div key={item.label} className="nav-item">
                  {/* 父项 */}
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] ${
                      collapsed ? "justify-center" : ""
                    }`}
                    style={{
                      background: hasActiveChild
                        ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                        : "transparent",
                    }}
                    title={item.label}
                  >
                    <Icon
                      size={18}
                      className="shrink-0"
                      style={{
                        color: hasActiveChild ? "var(--accent-primary)" : "var(--text-secondary)",
                      }}
                    />
                    {!collapsed && (
                      <>
                        <span
                          className="text-sm truncate whitespace-nowrap overflow-hidden flex-1 text-left"
                          style={{
                            color: hasActiveChild ? "var(--accent-primary)" : "var(--text-secondary)",
                          }}
                        >
                          {item.label}
                        </span>
                        <ChevronRight
                          size={14}
                          className="shrink-0 transition-transform"
                          style={{
                            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            color: "var(--text-muted)",
                          }}
                        />
                      </>
                    )}
                  </button>
                  
                  {/* 子项（展开时显示） */}
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1" data-parent={item.label}>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.to);
                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={() => setMobileOpen(false)}
                            className="child-nav-item flex items-center gap-2 rounded-lg px-2 py-2 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)]"
                            style={{
                              background: childActive
                                ? "color-mix(in srgb, var(--accent-primary) 12%, transparent)"
                                : "transparent",
                            }}
                            title={child.label}
                          >
                            <ChildIcon
                              size={16}
                              className="shrink-0"
                              style={{
                                color: childActive ? "var(--accent-primary)" : "var(--text-muted)",
                              }}
                            />
                            <span
                              className="text-xs truncate whitespace-nowrap overflow-hidden"
                              style={{
                                color: childActive ? "var(--accent-primary)" : "var(--text-secondary)",
                              }}
                            >
                              {child.label}
                            </span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // 普通菜单项（无子菜单）
            const active = isActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`nav-item flex items-center gap-3 rounded-lg px-2 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] ${
                  collapsed ? "justify-center" : ""
                }`}
                style={{
                  background: active
                    ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                    : "transparent",
                }}
                title={item.label}
              >
                <Icon
                  size={18}
                  className="shrink-0"
                  style={{
                    color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}
                />
                {/* 展开时的文字标签 */}
                {!collapsed && (
                  <span
                    className="text-sm truncate whitespace-nowrap overflow-hidden"
                    style={{
                      color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 底部操作 */}
        <div className="border-t space-y-0.5 px-2 py-2" style={{ borderColor: "var(--border-card)" }}>
          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] ${
              collapsed ? "justify-center" : ""
            }`}
            title={theme === "dark" ? "亮色模式" : "暗色模式"}
          >
            {theme === "dark" ? (
              <Sun size={18} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
            ) : (
              <Moon size={18} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
            )}
            {!collapsed && (
              <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                {theme === "dark" ? "亮色模式" : "暗色模式"}
              </span>
            )}
          </button>

          {/* 首页设置 */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-home-settings"));
              setMobileOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] ${
              collapsed ? "justify-center" : ""
            }`}
            title="首页设置"
          >
            <Settings size={18} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
            {!collapsed && (
              <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                首页设置
              </span>
            )}
          </button>

          {/* 后台管理 */}
          <button
            onClick={() => {
              navigate("/admin");
              setMobileOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] ${
              collapsed ? "justify-center" : ""
            }`}
            title="后台管理"
          >
            <LayoutDashboard size={18} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
            {!collapsed && (
              <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                后台管理
              </span>
            )}
          </button>

          {/* 折叠/展开切换按钮 */}
          <div className="pt-1 hidden lg:block">
            <button
              onClick={onToggle}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-all hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] ${
                collapsed ? "justify-center" : ""
              }`}
              title={collapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              {collapsed ? (
                <ChevronRight size={18} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
              ) : (
                <>
                  <ChevronLeft size={18} className="shrink-0" style={{ color: "var(--text-secondary)" }} />
                  <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                    收起
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
