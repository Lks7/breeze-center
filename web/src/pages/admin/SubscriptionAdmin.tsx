import { useState, useEffect } from "react";
import { subscriptionAPI, type Subscription } from "@/api/subscription";
import { Plus, Trash2, Edit, Clock } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  "服务器": "#ef4444",
  "域名": "#8b5cf6",
  "VPN": "#06b6d4",
  "会员": "#f59e0b",
  "其他": "#6b7280",
};

function getStatusInfo(date: string) {
  const now = new Date();
  const exp = new Date(date);
  const diff = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: "已过期", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  if (diff <= 7) return { label: `${diff}天后到期`, color: "#f97316", bg: "rgba(249,115,22,0.1)" };
  if (diff <= 30) return { label: `${diff}天后到期`, color: "#eab308", bg: "rgba(234,179,8,0.1)" };
  return { label: "正常", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
}

interface FormData {
  name: string;
  type: string;
  provider: string;
  expire_date: string;
  price: number;
  cycle: string;
  description: string;
  notify_days: number;
}

const emptyForm: FormData = { name: "", type: "服务器", provider: "", expire_date: "", price: 0, cycle: "月付", description: "", notify_days: 7 };

export default function SubscriptionAdmin() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const load = async () => {
    try {
      const data = await subscriptionAPI.list();
      setSubs(data ?? []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (s: Subscription) => {
    setEditing(s);
    setForm({ name: s.name, type: s.type, provider: s.provider, expire_date: s.expire_date, price: s.price, cycle: s.cycle, description: s.description, notify_days: s.notify_days });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.expire_date) return;
    try {
      if (editing) {
        await subscriptionAPI.update(editing.id, form);
      } else {
        await subscriptionAPI.create(form);
      }
      setShowForm(false);
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await subscriptionAPI.delete(id);
      load();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-6" style={{ background: "var(--bg-primary)" }}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>订阅管理</h2>
        <button onClick={openCreate} className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
          style={{ background: "var(--accent-primary)", color: "#fff" }}>
          <Plus size={16} /> 添加订阅
        </button>
      </div>

      <div className="grid gap-3">
        {subs.map((s) => {
          const st = getStatusInfo(s.expire_date);
          return (
            <div key={s.id} className="rounded-xl p-4 transition-all hover:shadow-md"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ background: (TYPE_COLORS[s.type] || "#6b7280") + "20", color: TYPE_COLORS[s.type] || "#6b7280" }}>
                    {s.type.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: "var(--text-primary)" }}>{s.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.provider && `${s.provider} · `}{s.price > 0 ? `¥${s.price}/${s.cycle}` : "免费"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: st.bg, color: st.color }}>
                    <Clock size={12} /> {st.label}
                  </div>
                  <button onClick={() => openEdit(s)} className="rounded p-1.5 transition-all hover:scale-110"
                    style={{ color: "var(--text-muted)" }}><Edit size={15} /></button>
                  <button onClick={() => handleDelete(s.id)} className="rounded p-1.5 transition-all hover:scale-110"
                    style={{ color: "#ef4444" }}><Trash2 size={15} /></button>
                </div>
              </div>
              {s.description && (
                <div className="mt-2 text-xs pl-13" style={{ color: "var(--text-muted)" }}>{s.description}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {editing ? "编辑订阅" : "添加订阅"}
            </h3>
            <div className="space-y-3">
              <input placeholder="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }} />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                {Object.keys(TYPE_COLORS).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="提供商" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }} />
              <input type="date" value={form.expire_date} onChange={(e) => setForm({ ...form, expire_date: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }} />
              <div className="flex gap-2">
                <input type="number" placeholder="价格" value={form.price || ""} onChange={(e) => setForm({ ...form, price: +e.target.value })}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }} />
                <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })}
                  className="w-24 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                  <option>月付</option><option>季付</option><option>年付</option><option>永久</option>
                </select>
              </div>
              <input placeholder="备注" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-primary)" }} />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg py-2 text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>取消</button>
                <button onClick={handleSave} className="flex-1 rounded-lg py-2 text-sm font-medium" style={{ background: "var(--accent-primary)", color: "#fff" }}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
