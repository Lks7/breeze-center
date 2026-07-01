import { X, RotateCcw } from "lucide-react";
import { type HomeSettings } from "@/hooks/useHomeSettings";

interface Props {
  isOpen: boolean;
  settings: HomeSettings;
  onUpdate: <K extends keyof HomeSettings>(key: K, value: HomeSettings[K]) => void;
  onReset: () => void;
  onClose: () => void;
}

/**
 * HomeSettingsDialog - 首页个性化设置对话框
 */
export function HomeSettingsDialog({
  isOpen,
  settings,
  onUpdate,
  onReset,
  onClose,
}: Props) {
  if (!isOpen) return null;

  const widgets = [
    { key: "showHero" as const, label: "英雄卡片" },
    { key: "showRssStats" as const, label: "RSS 订阅统计" },
    { key: "showBookmarkStats" as const, label: "书签统计" },
    { key: "showWeather" as const, label: "天气信息" },
    { key: "showPomodoro" as const, label: "番茄钟" },
    { key: "showNotification" as const, label: "通知中心" },
    { key: "showRssFeed" as const, label: "RSS 文章流" },
    { key: "showServices" as const, label: "服务状态" },
    { key: "showTodos" as const, label: "待办事项" },
    { key: "showBookmarks" as const, label: "书签卡片" },
    { key: "showGitHub" as const, label: "GitHub 信息" },
    { key: "showFusion" as const, label: "融合站点" },
    { key: "showServiceNav" as const, label: "服务导航" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: "var(--border-card)" }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            首页设置
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-all hover:scale-110"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4">
          <p
            className="mb-4 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            自定义首页显示的内容模块
          </p>

          <div className="space-y-2">
            {widgets.map((widget) => (
              <label
                key={widget.key}
                className="flex items-center gap-3 rounded-lg p-2.5 transition-all hover:bg-opacity-50"
                style={{ background: "var(--bg-secondary)" }}
              >
                <input
                  type="checkbox"
                  checked={settings[widget.key]}
                  onChange={(e) => onUpdate(widget.key, e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--accent-primary)" }}
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {widget.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 底部按钮 */}
        <div
          className="flex gap-2 border-t p-4"
          style={{ borderColor: "var(--border-card)" }}
        >
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all hover:scale-105"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
            }}
          >
            <RotateCcw size={14} />
            恢复默认
          </button>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
            style={{
              background: "var(--accent-primary)",
              color: "var(--bg-primary)",
            }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
