import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { apiError } from "@/lib/api";
import { Navbar } from "@/components/qiveo/Navbar";
import { ItemCard } from "@/components/qiveo/ModCard";
import { toast } from "sonner";
import { FolderHeart, Plus, X } from "lucide-react";

export default function Collections() {
  const [params, setParams] = useSearchParams();
  const [cols, setCols] = useState([]);
  const [active, setActive] = useState(null);
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [name, setName] = useState("");

  const load = () => api.get("/collections").then((r) => setCols(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    try { await api.post("/collections", { name }); setName(""); setCreating(false); setParams({}); load(); toast.success("Collection created"); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  const open = (c) => api.get(`/collections/${c.id}`).then((r) => setActive(r.data)).catch(() => {});

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-extrabold text-warm flex items-center gap-2"><FolderHeart className="w-7 h-7 text-coral" />Collections</h1>
          <button data-testid="new-collection-btn" onClick={() => setCreating(true)} className="bg-coral text-ink px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 hover:-translate-y-0.5 transition-transform"><Plus className="w-4 h-4" />New collection</button>
        </div>

        {creating && (
          <div className="bg-plum border border-plumborder rounded-2xl p-4 mb-6 flex gap-2 max-w-md">
            <input data-testid="collection-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" className="flex-1 bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
            <button data-testid="collection-create" onClick={create} className="bg-coral text-ink px-4 rounded-lg font-bold">Create</button>
            <button onClick={() => { setCreating(false); setParams({}); }} className="w-10 grid place-items-center text-lavender2/60 hover:text-rose"><X className="w-5 h-5" /></button>
          </div>
        )}

        {active ? (
          <div>
            <button onClick={() => setActive(null)} className="text-coral2 text-sm mb-4">← All collections</button>
            <h2 className="font-heading text-2xl font-bold text-warm mb-4">{active.name}</h2>
            {active.mods?.length ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{active.mods.map((m) => <ItemCard key={m.id} item={m} />)}</div> : <p className="text-lavender2/40 font-mono">No items yet. Add items from a project page.</p>}
          </div>
        ) : cols.length === 0 ? (
          <div className="border border-dashed border-plumborder rounded-2xl p-14 text-center text-lavender2/40 font-mono">No collections yet. Create one to curate your favorite projects.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cols.map((c) => (
              <button key={c.id} data-testid={`collection-${c.id}`} onClick={() => open(c)} className="text-left bg-plum border border-plumborder rounded-2xl p-5 hover:border-violet/60 hover:-translate-y-1 transition-all">
                <FolderHeart className="w-6 h-6 text-coral mb-2" />
                <h3 className="font-heading font-bold text-warm">{c.name}</h3>
                <p className="text-sm text-lavender2/50 mt-1">{c.count} item{c.count === 1 ? "" : "s"}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
