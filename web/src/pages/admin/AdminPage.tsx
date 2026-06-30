import { type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Loader2, CheckSquare } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { APIError } from "@/api/client";

/**
 * AdminPageProps — 通用管理页面配置
 *
 * 用一份配置驱动列表+表单的渲染，5 个实体共用同一套骨架。
 */
export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "color" | "checkbox";
  options?: { value: string; label: string }[];
  placeholder?: string;
  default?: unknown;
}

export interface AdminPageProps<T extends { id: string }> {
  title: string;
  description: string;
  fields: FieldDef[];
  queryKey: string[];
  listFn: () => Promise<T[]>;
  createFn: (body: Partial<T>) => Promise<T>;
  updateFn: (id: string, body: Partial<T>) => Promise<T>;
  deleteFn: (id: string) => Promise<unknown>;
  /** 渲染列表中每一行的额外摘要（在操作按钮左侧） */
  renderRow?: (item: T) => ReactNode;
  /** 创建表单的默认值 */
  defaults?: Record<string, unknown>;
}

export function AdminPage<T extends { id: string }>({
  title,
  description,
  fields,
  queryKey,
  listFn,
  createFn,
  updateFn,
  deleteFn,
  renderRow,
  defaults = {},
}: AdminPageProps<T>) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<T | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: items = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: listFn,
  });

  const saveMutation = useMutation({
    mutationFn: async (body: Partial<T>) => {
      if (editing) return updateFn(editing.id, body);
      return createFn(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(item: T) {
    setEditing(item);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="px-8 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: "var(--accent-gradient)" }}
        >
          <Plus size={15} />
          新建
        </button>
      </header>

      {error && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={{
            background: "color-mix(in srgb, var(--status-error) 12%, transparent)",
            color: "var(--status-error)",
          }}
        >
          加载失败：{(error as APIError).message ?? String(error)}
        </div>
      )}

      {/* 列表 */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={14} className="animate-spin" />
          加载中...
        </div>
      ) : items.length === 0 ? (
        <GlassCard interactive={false} className="py-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            暂无数据，点击右上角「新建」开始添加
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <GlassCard key={item.id} className="flex items-center gap-3 !p-3">
              <div className="min-w-0 flex-1">
                {renderRow ? renderRow(item) : (
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {(item as Record<string, unknown>).name as string ??
                      (item as Record<string, unknown>).title as string ??
                      item.id}
                  </span>
                )}
              </div>
              <button
                onClick={() => openEdit(item)}
                className="btn-ghost !p-1.5"
                title="编辑"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (confirm("确认删除？")) deleteMutation.mutate(item.id);
                }}
                className="btn-ghost !p-1.5"
                title="删除"
                style={{ color: "var(--status-error)" }}
              >
                <Trash2 size={14} />
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      {/* 表单弹层 */}
      {showForm && (
        <FormModal
          title={editing ? "编辑" : "新建"}
          fields={fields}
          initial={editing ?? defaults}
          saving={saveMutation.isPending}
          error={saveMutation.error as APIError | null}
          onSubmit={(body) => saveMutation.mutate(body as Partial<T>)}
          onClose={closeForm}
        />
      )}
    </div>
  );
}

// ============================================================
// 表单弹层
// ============================================================

interface FormModalProps {
  title: string;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  saving: boolean;
  error: APIError | null;
  onSubmit: (body: Record<string, unknown>) => void;
  onClose: () => void;
}

function FormModal({
  title,
  fields,
  initial,
  saving,
  error,
  onSubmit,
  onClose,
}: FormModalProps) {
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const f: Record<string, unknown> = {};
    for (const fd of fields) {
      f[fd.name] = initial[fd.name] ?? fd.default ?? "";
    }
    return f;
  });

  function set(name: string, value: unknown) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-lg !p-6"
        style={{ animation: "card-in 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-3"
        >
          {fields.map((fd) => (
            <div key={fd.name}>
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {fd.label}
              </label>
              {renderField(fd, form[fd.name], (v) => set(fd.name, v))}
            </div>
          ))}

          {error && (
            <div
              className="rounded-lg p-2 text-xs"
              style={{
                background: "color-mix(in srgb, var(--status-error) 12%, transparent)",
                color: "var(--status-error)",
              }}
            >
              {error.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              style={{ border: "1px solid var(--border-card)" }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent-gradient)" }}
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function renderField(
  fd: FieldDef,
  value: unknown,
  set: (v: unknown) => void
) {
  const v = (value as string) ?? "";
  const inputStyle = {
    width: "100%",
    background: "var(--bg-card)",
    border: "1px solid var(--border-card)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "13px",
    outline: "none",
  } as const;

  switch (fd.type) {
    case "textarea":
      return (
        <textarea
          value={v}
          placeholder={fd.placeholder}
          onChange={(e) => set(e.target.value)}
          rows={4}
          style={inputStyle}
        />
      );
    case "select":
      return (
        <select
          value={v}
          onChange={(e) => set(e.target.value)}
          style={inputStyle}
        >
          {fd.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "number":
      return (
        <input
          type="number"
          value={v}
          onChange={(e) => set(Number(e.target.value))}
          style={inputStyle}
        />
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={v || "#38bdf8"}
            onChange={(e) => set(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={v}
            placeholder="#38bdf8"
            onChange={(e) => set(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      );
    case "checkbox":
      return (
        <button
          type="button"
          onClick={() => set(!v)}
          className="inline-flex items-center gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <span
            className="flex h-4 w-4 items-center justify-center rounded border"
            style={{
              background: v ? "var(--accent-primary)" : "transparent",
              borderColor: v ? "var(--accent-primary)" : "var(--border-card)",
            }}
          >
            {v && <CheckSquare size={11} color="white" />}
          </span>
          <span className="text-sm">启用</span>
        </button>
      );
    default:
      return (
        <input
          type="text"
          value={v}
          placeholder={fd.placeholder}
          onChange={(e) => set(e.target.value)}
          style={inputStyle}
        />
      );
  }
}
