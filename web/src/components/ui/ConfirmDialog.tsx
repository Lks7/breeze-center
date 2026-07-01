import { AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

/**
 * ConfirmDialog — 现代化确认对话框
 * 
 * 替代原生 alert/confirm，提供更好的用户体验
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  danger = false,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="glass-card w-full max-w-md p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 图标 */}
        <div className="mb-4 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: danger
                ? "color-mix(in srgb, #ef4444 20%, transparent)"
                : "color-mix(in srgb, var(--accent-primary) 20%, transparent)",
            }}
          >
            <AlertTriangle
              size={32}
              style={{ color: danger ? "#ef4444" : "var(--accent-primary)" }}
            />
          </div>
        </div>

        {/* 标题 */}
        <h2
          className="mb-2 text-center text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h2>

        {/* 消息 */}
        <p
          className="mb-6 text-center"
          style={{ color: "var(--text-secondary)" }}
        >
          {message}
        </p>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg px-4 py-2.5 font-medium transition-all hover:scale-105"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg px-4 py-2.5 font-medium transition-all hover:scale-105"
            style={{
              background: danger ? "#ef4444" : "var(--accent-primary)",
              color: "white",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
