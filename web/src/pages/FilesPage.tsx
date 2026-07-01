import { useTheme } from "@/hooks/useTheme";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { FolderOpen, ExternalLink, AlertCircle } from "lucide-react";
import { useState } from "react";

/**
 * FilesPage — 文件中心
 * 
 * 通过 iframe 嵌入 r2-web (https://github.com/vikiboss/r2-web)
 * 纯浏览器端的 Cloudflare R2 文件管理器
 */
export function FilesPage() {
  const [theme, toggleTheme] = useTheme();
  const [showConfig, setShowConfig] = useState(true);

  // r2-web 自部署地址
  const R2_WEB_URL = "https://r2-web.lks7.workers.dev/";

  return (
    <>
      <TopBar theme={theme} onToggleTheme={toggleTheme} />
      <main className="mx-auto w-full max-w-7xl px-6 py-6">
        {/* 页头 */}
        <div className="glass-card mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--accent-primary)" }}
              >
                <FolderOpen size={24} style={{ color: "var(--bg-primary)" }} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  文件中心
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  基于 Cloudflare R2 的文件管理器
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                }}
              >
                {showConfig ? "隐藏说明" : "显示说明"}
              </button>
              <a
                href={R2_WEB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--bg-primary)",
                }}
              >
                <span>新窗口打开</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* 配置说明 */}
        {showConfig && (
          <div className="glass-card mb-6 p-6">
            <div className="mb-4 flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--accent-primary)" }}
              />
              <div>
                <h2
                  className="mb-2 text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  首次使用需要配置
                </h2>
                <div
                  className="space-y-2 text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <p>
                    r2-web 是一个纯浏览器端的 Cloudflare R2 文件管理器，无需后端服务器。
                  </p>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    使用步骤：
                  </p>
                  <ol className="ml-4 list-decimal space-y-1">
                    <li>
                      准备 Cloudflare R2 存储桶（
                      <a
                        href="https://dash.cloudflare.com/r2"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        创建存储桶
                      </a>
                      ）
                    </li>
                    <li>配置存储桶的 CORS 策略（允许浏览器访问）</li>
                    <li>创建 R2 API Token（Account ID、Access Key、Secret Key）</li>
                    <li>在下方 iframe 中填入配置信息</li>
                    <li>开始使用文件管理功能</li>
                  </ol>
                  <p className="mt-3 rounded-lg p-2" style={{ background: "var(--bg-card)" }}>
                    💡 提示：配置信息仅保存在浏览器本地，不会上传到任何服务器
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>项目地址：</span>
              <a
                href="https://github.com/vikiboss/r2-web"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 underline hover:no-underline"
                style={{ color: "var(--accent-primary)" }}
              >
                <span>vikiboss/r2-web</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}

        {/* r2-web iframe */}
        <div className="glass-card overflow-hidden p-0">
          <iframe
            src={R2_WEB_URL}
            className="h-[calc(100vh-280px)] w-full border-0"
            title="R2 File Manager"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            onError={(e) => {
              console.error('Failed to load r2-web:', e);
            }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
