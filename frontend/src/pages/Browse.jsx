import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/kivo/Navbar";
import { ItemCard } from "@/components/kivo/ModCard";
import { Reveal } from "@/components/kivo/Reveal";
import { Search, SlidersHorizontal } from "lucide-react";

const TYPES = ["Skin", "Character", "Build", "World", "Mod", "Collectible"];
const RARITIES = ["Common", "Rare", "Epic", "Legendary"];
const SORTS = [["trending", "Trending"], ["downloads", "Most grabbed"], ["rating", "Top rated"], ["newest", "Newest"]];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState(params.get("q") || "");
  const [loading, setLoading] = useState(true);

  const item_type = params.get("item_type") || "";
  const rarity = params.get("rarity") || "";
  const sort = params.get("sort") || "trending";

  const load = useCallback(() => {
    setLoading(true);
    const p = { sort, limit: 60 };
    if (params.get("q")) p.q = params.get("q");
    if (item_type) p.item_type = item_type;
    if (rarity) p.rarity = rarity;
    api.get("/mods", { params: p }).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [params, sort, item_type, rarity]);

  useEffect(() => { load(); }, [load]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v && next.get(k) !== v) next.set(k, v); else next.delete(k);
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <SlidersHorizontal className="w-6 h-6 text-lavender2" />
          <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-warm">Explore drops</h1>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setParam("q", q); }} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-lavender2/40" />
            <input data-testid="browse-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search skins, builds, creators..."
              className="w-full bg-plum border border-plumborder rounded-full pl-12 pr-4 py-3 text-warm placeholder:text-lavender2/30 focus:outline-none focus:ring-2 focus:ring-violet" />
          </div>
          <button type="submit" data-testid="browse-search-btn" className="bg-coral text-ink px-6 rounded-full font-bold hover:-translate-y-0.5 transition-transform">Search</button>
        </form>

        {/* type chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip label="All" active={!item_type} onClick={() => setParam("item_type", "")} testid="type-all" />
          {TYPES.map((t) => <Chip key={t} label={`${t}s`} active={item_type === t} onClick={() => setParam("item_type", item_type === t ? "" : t)} testid={`type-${t}`} />)}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="font-mono text-[10px] uppercase tracking-widest text-lavender2/40 mr-1">Rarity</span>
          {RARITIES.map((r) => <Chip key={r} small label={r} active={rarity === r} onClick={() => setParam("rarity", rarity === r ? "" : r)} testid={`rarity-${r}`} />)}
          <span className="flex-1" />
          <select data-testid="sort-select" value={sort} onChange={(e) => setParam("sort", e.target.value)} className="bg-plum border border-plumborder rounded-full px-4 py-2 text-sm text-warm focus:outline-none focus:ring-2 focus:ring-violet">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <p className="font-mono text-xs text-lavender2/50 uppercase tracking-widest mb-4">{loading ? "loading..." : `${items.length} drops`}</p>
        {items.length === 0 && !loading ? (
          <div className="border border-dashed border-plumborder rounded-2xl p-14 text-center text-lavender2/40 font-mono">No drops match these filters.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((m, i) => <Reveal key={m.id} delay={(i % 4) * 80}><ItemCard item={m} /></Reveal>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick, testid, small }) {
  return (
    <button data-testid={testid} onClick={onClick}
      className={`rounded-full border transition-all ${small ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm font-semibold"} ${active ? "bg-coral text-ink border-coral" : "bg-plum text-lavender2/80 border-plumborder hover:border-violet/60"}`}>
      {label}
    </button>
  );
}
