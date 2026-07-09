import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import gsap from "gsap";
import { GlassCard } from "./GlassCard";

interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  isOpen,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isShown = open ?? isOpen ?? false;
  const resolvedVariant = variant ?? (danger ? "danger" : "default");
  const resolvedConfirmLabel = confirmLabel ?? confirmText ?? "确认";
  const resolvedCancelLabel = cancelLabel ?? cancelText ?? "取消";
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return;

    if (isShown) {
      gsap.set(overlayRef.current, { display: "flex" });
      const tl = gsap.timeline();
      tl.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: "power2.out" }
      ).fromTo(
        panelRef.current,
        { scale: 0.85, opacity: 0, y: -20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: "back.out(1.7)" },
        "-=0.05"
      );
    } else {
      gsap.to(panelRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          if (overlayRef.current) gsap.set(overlayRef.current, { display: "none" });
        },
      });
    }
  }, [isShown]);

  if (!isShown) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onCancel}
    >
      <GlassCard
        ref={panelRef}
        interactive={false}
        className="relative w-full max-w-sm !p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-lg p-1 transition hover:bg-[var(--bg-card-hover)]"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3">
          {resolvedVariant === "danger" && (
            <div
              className="rounded-full p-2 shrink-0"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
              }}
            >
              <AlertTriangle size={20} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h3>
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:brightness-95"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-card)",
            }}
          >
            {resolvedCancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{
              background:
                resolvedVariant === "danger"
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "var(--accent-gradient)",
            }}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
