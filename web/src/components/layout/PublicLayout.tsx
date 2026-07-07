import { useState } from "react";
import { Outlet } from "react-router-dom";
import { HomeSidebar } from "./HomeSidebar";

/**
 * PublicLayout — 公开页面的全局布局
 *
 * 包含左侧导航栏，应用于所有非 admin 页面。
 * 侧边栏折叠状态在此统一管理。
 */
export function PublicLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex min-h-screen">
      <HomeSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />
      <div
        className={`flex-1 transition-all duration-300 ml-0 ${
          sidebarCollapsed ? "lg:ml-14" : "lg:ml-48"
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}
