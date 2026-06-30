import { AdminPage, type FieldDef } from "./AdminPage";
import { rssAPI } from "@/api/admin";
import type { RSSSource } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { name: "name", label: "名称", type: "text", placeholder: "Astro Blog" },
  { name: "url", label: "RSS URL", type: "text", placeholder: "https://example.com/rss.xml" },
  { name: "category", label: "分类", type: "text", placeholder: "tech" },
  { name: "icon_color", label: "图标颜色", type: "color", default: "#38bdf8" },
  { name: "enabled", label: "启用", type: "checkbox", default: true },
];

export function RSSAdmin() {
  return (
    <AdminPage<RSSSource>
      title="RSS 订阅"
      description="管理 RSS 订阅源，未来会自动拉取最新文章"
      fields={FIELDS}
      queryKey={["admin", "rss"]}
      listFn={rssAPI.listSources}
      createFn={rssAPI.createSource}
      updateFn={rssAPI.updateSource}
      deleteFn={rssAPI.deleteSource}
      defaults={{ enabled: true, icon_color: "#38bdf8" }}
      renderRow={(s) => (
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: s.icon_color }}
          />
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {s.name}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {s.url}
          </span>
          {!s.enabled && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px]"
              style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
            >
              已停用
            </span>
          )}
        </div>
      )}
    />
  );
}
