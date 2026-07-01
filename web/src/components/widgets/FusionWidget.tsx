import { useQuery } from "@tanstack/react-query";
import { Layers, ExternalLink } from "lucide-react";
import { fusionAPI, type FusionSite } from "@/api/fusion";
import { Link } from "react-router-dom";

interface Props {
  enterDelay?: number;
}

/**
 * FusionWidget — 融合站点快捷入口
 */
export function FusionWidget({ enterDelay = 0 }: Props) {
  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["home", "fusion"],
    queryFn: fusionAPI.list,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  return (
    <div
      className="glass-card animate-fade-in-up p-6"
      style={{ animationDelay: `${enterDelay}ms` }}
    >
      {/* 标题 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--accent-primary)" }}
          >
            <Layers size={16} style={{ color: "var(--bg-primary)" }} />
          </div>
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            融合站点
          </h2>
        </div>
        <Link
          to="/fusion"
          className="text-xs transition-colors hover:underline"
          style={{ color: "var(--accent-primary)" }}
        >
          查看全部 →
        </Link>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="py-8 text-center">
          <div
            className="mx-auto h-6 w-6 animate-spin rounded-full border-3 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)" }}
          />
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && sites.length === 0 && (
        <div
          className="py-8 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          暂无融合站点
          <br />
          <a
            href="/admin/fusion"
            className="mt-2 inline-block transition-colors hover:underline"
            style={{ color: "var(--accent-primary)" }}
          >
            前往添加
          </a>
        </div>
      )}

      {/* 站点列表（最多显示 6 个） */}
      {!isLoading && sites.length > 0 && (
        <div className="space-y-2">
          {sites.slice(0, 6).map((site: FusionSite) => (
            <Link
              key={site.id}
              to={`/fusion?site=${site.id}`}
              className="flex items-center gap-3 rounded-lg p-2 transition-all hover:scale-[1.02]"
              style={{
                background: "color-mix(in srgb, var(--accent-primary) 5%, transparent)",
              }}
            >
              <div
                className="h-8 w-8 flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: site.icon_color }}
              >
                <Layers size={16} style={{ color: "white" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {site.name}
                </p>
                {site.description && (
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {site.description}
                  </p>
                )}
              </div>
              <ExternalLink
                size={14}
                style={{ color: "var(--text-muted)" }}
                className="flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
