import { AdminPage, type FieldDef } from "./AdminPage";
import { serviceAPI } from "@/api/admin";
import type { ServiceEntry } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { name: "name", label: "服务名称", type: "text", placeholder: "我的 NAS" },
  {
    name: "category",
    label: "分类",
    type: "select",
    default: "self-hosted",
    options: [
      { value: "content", label: "内容创作" },
      { value: "self-hosted", label: "自建服务" },
      { value: "data", label: "数据仪表" },
      { value: "plan", label: "计划管理" },
      { value: "subscription", label: "信息订阅" },
      { value: "entertainment", label: "娱乐" },
    ],
  },
  { name: "url", label: "访问 URL", type: "text", placeholder: "https://nas.breeze.dev" },
  { name: "api_endpoint", label: "API 端点（可选）", type: "text", placeholder: "https://nas.breeze.dev/api" },
  { name: "description", label: "描述", type: "text", placeholder: "一句话说明" },
  { name: "icon_name", label: "图标名（lucide）", type: "text", placeholder: "hard-drive", default: "server" },
  { name: "icon_color", label: "图标颜色", type: "color", default: "#38bdf8" },
  {
    name: "status",
    label: "状态",
    type: "select",
    default: "active",
    options: [
      { value: "active", label: "运行中" },
      { value: "inactive", label: "已停用" },
      { value: "error", label: "异常" },
    ],
  },
  { name: "sort_order", label: "排序权重", type: "number", default: 0 },
];

export function ServiceAdmin() {
  return (
    <AdminPage<ServiceEntry>
      title="服务管理"
      description="管理出现在首页导航门户的服务入口"
      fields={FIELDS}
      queryKey={["admin", "services"]}
      listFn={serviceAPI.list}
      createFn={serviceAPI.create}
      updateFn={serviceAPI.update}
      deleteFn={serviceAPI.delete}
      defaults={{
        category: "self-hosted",
        status: "active",
        icon_name: "server",
        icon_color: "#38bdf8",
        sort_order: 0,
      }}
      renderRow={(s) => (
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded"
            style={{ background: `${s.icon_color}22`, color: s.icon_color }}
          >
            <Server size={13} />
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {s.name}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {s.category}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{
              background:
                s.status === "active"
                  ? "color-mix(in srgb, var(--status-ok) 18%, transparent)"
                  : "var(--bg-card)",
              color:
                s.status === "active" ? "var(--status-ok)" : "var(--text-muted)",
            }}
          >
            {s.status === "active" ? "运行中" : s.status === "error" ? "异常" : "停用"}
          </span>
        </div>
      )}
    />
  );
}

import { Server } from "lucide-react";
