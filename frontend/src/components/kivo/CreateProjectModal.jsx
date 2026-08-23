import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { X } from "lucide-react";

const TYPES = ["Mod", "Plugin", "Skin", "Character", "Build", "World", "Collectible"];
const TYPE_MAP = { Plugin: "Mod" }; // Plugin stored as Mod item_type
const VIS = [["public", "Public"], ["unlisted", "Unlisted"], ["private", "Private"]];

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function CreateProjectModal({ onClose }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ type: "Mod", name: "", slug: "", owner: "self", visibility: "public", summary: "" });
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onName = (v) => { set("name", v); if (!slugEdited) set("slug", slugify(v)); };

  const create = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setBusy(true);
    try {
      const { data } = await api.post("/creator/mods", {
        title: form.name, summary: form.summary, description: `# ${form.name}\n\n${form.summary}`,
        item_type: TYPE_MAP[form.type] || form.type, visibility: form.visibility,
        category: TYPE_MAP[form.type] || form.type, game_slug: "minecraft",
      });
      toast.success(`Project created · ${data.status === "approved" ? "live" : "under review"}`);
      onClose();
      nav(`/project/${data.slug}/edit`);
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-ink/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-plum border border-plumborder rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()} data-testid="create-project-modal">
        <div className="flex items-center justify-between p-5 border-b border-plumborder">
          <h3 className="font-heading font-bold text-warm text-lg">Create a project</h3>
          <button data-testid="create-close" onClick={onClose} className="text-lavender2/50 hover:text-rose"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-warm mb-1.5">Type</label>
            <select data-testid="cp-type" value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm mb-1.5">Name</label>
            <input data-testid="cp-name" value={form.name} onChange={(e) => onName(e.target.value)} placeholder="My awesome project" className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm mb-1.5">URL</label>
            <div className="flex items-stretch rounded-lg border border-plumborder overflow-hidden bg-ink">
              <span className="px-3 py-2.5 bg-plum2 text-lavender2/50 text-sm font-mono border-r border-plumborder">kivo.app/project/</span>
              <input data-testid="cp-slug" value={form.slug} onChange={(e) => { setSlugEdited(true); set("slug", slugify(e.target.value)); }} className="flex-1 bg-transparent px-3 py-2.5 text-warm text-sm font-mono focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm mb-1.5">Owner</label>
            <select data-testid="cp-owner" value={form.owner} onChange={(e) => set("owner", e.target.value)} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet">
              <option value="self">{user?.name} (you)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm mb-1.5">Visibility</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-ink border border-plumborder rounded-lg">
              {VIS.map(([v, l]) => (
                <button key={v} data-testid={`cp-vis-${v}`} onClick={() => set("visibility", v)} className={`py-2 rounded-md text-sm font-semibold transition-colors ${form.visibility === v ? "bg-coral text-ink" : "text-lavender2/70 hover:text-warm"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm mb-1.5">Summary</label>
            <textarea data-testid="cp-summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={3} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
            <p className="text-xs text-lavender2/40 mt-1.5">A sentence or two that describes your project.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-plumborder">
          <button data-testid="cp-cancel" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-lavender2/80 hover:bg-plum2">Cancel</button>
          <button data-testid="cp-create" onClick={create} disabled={busy} className="px-5 py-2.5 rounded-lg bg-coral text-ink text-sm font-bold hover:-translate-y-0.5 transition-transform disabled:opacity-50">{busy ? "Creating..." : "Create project"}</button>
        </div>
      </div>
    </div>
  );
}
