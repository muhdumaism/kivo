import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { X } from "lucide-react";

import { GAME_CATEGORIES, getCategoryName } from "@/content/games";

const VIS = [["public", "Public"], ["unlisted", "Unlisted"], ["private", "Private"]];

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function CreateProjectModal({ onClose }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ game: "minecraft", category: "plugins", name: "", slug: "", owner: "self", visibility: "public", summary: "" });
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
        visibility: form.visibility,
        category: form.category, game_slug: form.game,
      });
      toast.success(`Project created · ${data.status === "approved" ? "live" : "under review"}`);
      onClose();
      nav(`/project/${data.slug}/edit`);
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#171512]/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-[#24201A] border border-[#92400E] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="create-project-modal">
        <div className="flex items-center justify-between p-6 border-b border-[#92400E]/50">
          <h3 className="font-heading font-black text-[#FFF8E1] text-xl">Create a project</h3>
          <button data-testid="create-close" onClick={onClose} className="text-[#FFF8E1]/50 hover:text-[#FFF8E1] transition-colors bg-[#171512] rounded-full p-1.5"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Game / Platform</label>
              <select data-testid="cp-game" value={form.game} onChange={(e) => { set("game", e.target.value); set("category", GAME_CATEGORIES[e.target.value]?.[0]?.id || ""); }} className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors">
                {Object.keys(GAME_CATEGORIES).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Category</label>
              <select data-testid="cp-type" value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors">
                {(GAME_CATEGORIES[form.game] || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Name</label>
            <input data-testid="cp-name" value={form.name} onChange={(e) => onName(e.target.value)} placeholder="My awesome project" className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">URL</label>
            <div className="flex items-stretch rounded-xl border border-[#92400E] overflow-hidden bg-[#171512] focus-within:border-[#F5C542] transition-colors">
              <span className="px-4 py-3 bg-[#24201A] text-[#FFF8E1]/50 text-sm font-mono border-r border-[#92400E]">qiveo.app/project/</span>
              <input data-testid="cp-slug" value={form.slug} onChange={(e) => { setSlugEdited(true); set("slug", slugify(e.target.value)); }} className="flex-1 bg-transparent px-4 py-3 text-[#FFF8E1] text-sm font-mono focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Owner</label>
            <select data-testid="cp-owner" value={form.owner} onChange={(e) => set("owner", e.target.value)} className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors">
              <option value="self">{user?.name} (you)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Visibility</label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#171512] border border-[#92400E] rounded-xl">
              {VIS.map(([v, l]) => (
                <button key={v} data-testid={`cp-vis-${v}`} onClick={() => set("visibility", v)} className={`py-2 rounded-lg text-sm font-bold transition-all ${form.visibility === v ? "bg-[#F5C542] text-[#171512]" : "text-[#FFF8E1]/60 hover:text-[#FFF8E1] hover:bg-[#24201A]"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold font-mono tracking-widest uppercase text-[#FFF8E1]/50 mb-2">Summary</label>
            <textarea data-testid="cp-summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={3} className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
            <p className="text-xs text-[#FFF8E1]/40 mt-2 font-mono">A sentence or two that describes your project.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-[#92400E]/50 bg-[#171512]/30">
          <button data-testid="cp-cancel" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-bold text-[#FFF8E1]/60 hover:text-[#FFF8E1] hover:bg-[#24201A] transition-colors">Cancel</button>
          <button data-testid="cp-create" onClick={create} disabled={busy} className="px-6 py-2.5 rounded-full bg-[#F5C542] text-[#171512] text-sm font-bold hover:bg-[#FFD84D] transition-colors disabled:opacity-50">{busy ? "Creating..." : "Create project"}</button>
        </div>
      </div>
    </div>
  );
}
