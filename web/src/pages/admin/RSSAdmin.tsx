import { AdminPage, type FieldDef } from "./AdminPage";
import { rssAPI } from "@/api/admin";
import type { RSSSource } from "@/types/entities";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const FIELDS: FieldDef[] = [
  { name: "name", label: "名称", type: "text", placeholder: "Astro Blog" },
  { name: "url", label: "RSS URL", type: "text", placeholder: "https://example.com/rss.xml" },
  { name: "category", label: "分类", type: "text", placeholder: "tech" },
  { name: "icon_color", label: "图标颜色", type: "color", default: "#38bdf8" },
  { name: "enabled", label: "启用", type: "checkbox", default: true },
];

export function RSSAdmin() {
  const [isFetching, setIsFetching] = useState(false);
  const queryClient = useQueryClient();

  const fetchMutation = useMutation({
    mutationFn: rssAPI.fetchNow,
    onSuccess: () => {
      setIsFetching(false);
      // 3秒后刷新列表，给后端时间抓取
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin", "rss"] });
      }, 3000);
    },
    onError: () => {
      setIsFetching(false);
    },
  });

  const handleFetchNow = () => {
    setIsFetching(true);
    fetchMutation.mutate();
  };

  return (
    <div className="space-y-4">
      {/* 手动抓取按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleFetchNow}
          disabled={isFetching}
          className="glass-card px-4 py-2 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: "var(--text-primary)" }}
        >
          {isFetching ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              抓取中...
            </>
          ) : (
            "🔄 立即抓取"
          )}
        </button>
      </div>

      <AdminPage<RSSSource>
        title="RSS 订阅"
        description="管理 RSS 订阅源，系统每 30 分钟自动抓取一次"
        fields={FIELDS}
        queryKey={["admin", "rss"]}
        listFn={rssAPI.listSources}
        createFn={rssAPI.createSource}
        updateFn={rssAPI.updateSource}
        deleteFn={rssAPI.deleteSource}
        defaults={{ enabled: true, icon_color: "#38bdf8" }}
        renderRow={(s) => (
          <div className="space-y-1">
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
            {s.last_fetched && (
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                最后抓取: {new Date(s.last_fetched).toLocaleString("zh-CN")}
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
}
