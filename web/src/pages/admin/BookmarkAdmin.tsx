import { AdminPage, type FieldDef } from "./AdminPage";
import { bookmarkAPI } from "@/api/admin";
import type { Bookmark } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { name: "title", label: "标题", type: "text", placeholder: "GitHub" },
  { name: "url", label: "URL", type: "text", placeholder: "https://github.com" },
  { name: "description", label: "描述", type: "text", placeholder: "一句话说明" },
  { name: "category", label: "分类", type: "text", placeholder: "dev", default: "general" },
  { name: "icon", label: "图标名", type: "text", placeholder: "github" },
  { name: "sort_order", label: "排序权重", type: "number", default: 0 },
];

export function BookmarkAdmin() {
  return (
    <AdminPage<Bookmark>
      title="书签管理"
      description="管理首页「快捷书签」widget 的链接"
      fields={FIELDS}
      queryKey={["admin", "bookmarks"]}
      listFn={bookmarkAPI.list}
      createFn={bookmarkAPI.create}
      updateFn={bookmarkAPI.update}
      deleteFn={bookmarkAPI.delete}
      defaults={{ category: "general", sort_order: 0 }}
      renderRow={(b) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {b.title}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {b.url}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
          >
            {b.category}
          </span>
        </div>
      )}
    />
  );
}
