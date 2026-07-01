import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fusionAPI, type FusionSite, type FusionSiteInput } from "@/api/fusion";
import { Plus, Edit, Trash2, ExternalLink, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * FusionAdmin — 融合站点管理页面
 */
export function FusionAdmin() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<FusionSite | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState<FusionSiteInput>({
    name: "",
    url: "",
    description: "",
    icon_color: "#38bdf8",
    sort_order: 0,
  });

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["admin", "fusion"],
    queryFn: fusionAPI.list,
  });

  const createMut = useMutation({
    mutationFn: fusionAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "fusion"] });
      qc.invalidateQueries({ queryKey: ["fusion", "sites"] });
      closeModal();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: FusionSiteInput }) =>
      fusionAPI.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "fusion"] });
      qc.invalidateQueries({ queryKey: ["fusion", "sites"] });
      closeModal();
    },
  });

  const deleteMut = useMutation({
    mutationFn: fusionAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "fusion"] });
      qc.invalidateQueries({ queryKey: ["fusion", "sites"] });
    },
  });

  const openCreateModal = () => {
    setEditingSite(null);
    setFormData({
      name: "",
      url: "",
      description: "",
      icon_color: "#38bdf8",
      sort_order: sites.length,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (site: FusionSite) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      url: site.url,
      description: site.description,
      icon_color: site.icon_color,
      sort_order: site.sort_order,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSite(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSite) {
      updateMut.mutate({ id: editingSite.id, input: formData });
    } else {
      createMut.mutate(formData);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMut.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div>
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            融合站点管理
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            管理嵌入显示的外部站点
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all hover:scale-105"
          style={{
            background: "var(--accent-primary)",
            color: "var(--bg-primary)",
          }}
        >
          <Plus size={18} />
          添加站点
        </button>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="py-12 text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)" }}
          />
        </div>
      )}

      {/* 站点列表 */}
      {!isLoading && (
        <div className="grid gap-4">
          {sites.map((site: FusionSite) => (
            <div
              key={site.id}
              className="glass-card p-6 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center"
                    style={{ background: site.icon_color }}
                  >
                    <ExternalLink size={24} style={{ color: "white" }} />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {site.name}
                    </h3>
                    {site.description && (
                      <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {site.description}
                      </p>
                    )}
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm transition-colors hover:underline"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {site.url}
                      <ExternalLink size={12} />
                    </a>
                    <div
                      className="mt-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      排序: {site.sort_order}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(site)}
                    className="rounded-lg p-2 transition-all hover:scale-110"
                    style={{
                      background: "color-mix(in srgb, var(--accent-primary) 20%, transparent)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(site.id, site.name)}
                    className="rounded-lg p-2 transition-all hover:scale-110"
                    style={{
                      background: "color-mix(in srgb, #ef4444 20%, transparent)",
                      color: "#ef4444",
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {sites.length === 0 && (
            <div
              className="py-12 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              暂无融合站点，点击右上角添加
            </div>
          )}
        </div>
      )}

      {/* 添加/编辑模态框 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="glass-card w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {editingSite ? "编辑站点" : "添加站点"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 transition-colors hover:bg-white/10"
              >
                <X size={20} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  站点名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  站点 URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    图标颜色
                  </label>
                  <input
                    type="color"
                    value={formData.icon_color}
                    onChange={(e) =>
                      setFormData({ ...formData, icon_color: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    排序
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="flex-1 rounded-lg px-4 py-2 font-medium transition-all hover:scale-105 disabled:opacity-50"
                  style={{
                    background: "var(--accent-primary)",
                    color: "var(--bg-primary)",
                  }}
                >
                  {createMut.isPending || updateMut.isPending
                    ? "保存中..."
                    : editingSite
                      ? "保存"
                      : "添加"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 font-medium transition-all hover:scale-105"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="删除站点"
        message={`确定要删除「${deleteConfirm?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        danger
      />
    </div>
  );
}
