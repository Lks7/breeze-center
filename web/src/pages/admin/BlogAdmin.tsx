import { AdminPage, type FieldDef } from "./AdminPage";
import { blogAPI } from "@/api/admin";
import type { BlogPost } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { name: "title", label: "标题", type: "text", placeholder: "文章标题" },
  { name: "slug", label: "URL 别名", type: "text", placeholder: "my-first-post" },
  { name: "excerpt", label: "摘要", type: "textarea", placeholder: "一句话简介" },
  { name: "content", label: "正文", type: "textarea", placeholder: "Markdown 正文" },
  { name: "cover_url", label: "封面图 URL", type: "text", placeholder: "https://..." },
  { name: "tags", label: "标签", type: "text", placeholder: "tech,go,react（逗号分隔）" },
  {
    name: "status",
    label: "状态",
    type: "select",
    default: "draft",
    options: [
      { value: "draft", label: "草稿" },
      { value: "published", label: "已发布" },
    ],
  },
  { name: "published_at", label: "发布时间", type: "text", placeholder: "2026-06-30T15:00:00+08:00" },
];

export function BlogAdmin() {
  return (
    <AdminPage<BlogPost>
      title="博客管理"
      description="创建、编辑、删除博客文章"
      fields={FIELDS}
      queryKey={["admin", "blog"]}
      listFn={blogAPI.list}
      createFn={blogAPI.create}
      updateFn={blogAPI.update}
      deleteFn={blogAPI.delete}
      defaults={{ status: "draft" }}
      renderRow={(p) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {p.title}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{
              background:
                p.status === "published"
                  ? "color-mix(in srgb, var(--status-ok) 18%, transparent)"
                  : "var(--bg-card)",
              color: p.status === "published" ? "var(--status-ok)" : "var(--text-muted)",
            }}
          >
            {p.status === "published" ? "已发布" : "草稿"}
          </span>
          {p.tags && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              #{p.tags.split(",").join(" #")}
            </span>
          )}
        </div>
      )}
    />
  );
}
