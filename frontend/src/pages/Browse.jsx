import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/qiveo/Navbar";
import { ItemCard } from "@/components/qiveo/ModCard";
import { Footer } from "@/pages/Home";
import { Reveal } from "@/components/qiveo/Reveal";
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
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Reveal>
          <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-[#E9D5FF]">
            <SlidersHorizontal className="w-6 h-6 text-[#E9D5FF]" />
            <h1 className="font-heading text-3xl lg:text-4xl font-black text-[#E9D5FF] uppercase">Explore drops</h1>
          </div>
        </Reveal>

        <form onSubmit={(e) => { e.preventDefault(); setParam("q", q); }} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E9D5FF]/40" />
            <input 
              data-testid="browse-search-input" 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Search skins, builds, creators..."
              className="w-full bg-[#15141E] border-2 border-[#E9D5FF] rounded-full pl-12 pr-4 py-3 text-[#E9D5FF] placeholder:text-[#E9D5FF]/40 focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all font-semibold" 
            />
          </div>
          <button type="submit" data-testid="browse-search-btn" className="retro-btn-black px-8 py-3 text-sm font-extrabold">Search</button>
        </form>

        {/* type chips */}
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#E9D5FF]/50 mb-2.5 font-bold">Categories</p>
          <div className="flex flex-wrap gap-2.5">
            <Chip label="All" active={!item_type} onClick={() => setParam("item_type", "")} testid="type-all" />
            {TYPES.map((t) => <Chip key={t} label={`${t}s`} active={item_type === t} onClick={() => setParam("item_type", item_type === t ? "" : t)} testid={`type-${t}`} />)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-dashed border-[#E9D5FF]/30">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#E9D5FF]/50 mr-1.5 font-bold">Rarity</span>
            {RARITIES.map((r) => <Chip key={r} small label={r} active={rarity === r} onClick={() => setParam("rarity", rarity === r ? "" : r)} testid={`rarity-${r}`} />)}
          </div>
          <span className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#E9D5FF]/50 font-bold">Sort</span>
            <select data-testid="sort-select" value={sort} onChange={(e) => setParam("sort", e.target.value)} className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-full px-5 py-2 text-xs text-[#E9D5FF] font-heading font-extrabold uppercase tracking-wide focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <p className="font-mono text-xs text-[#E9D5FF]/50 uppercase tracking-widest mb-6 font-bold">{loading ? "loading..." : `${items.length} drops`}</p>
        
        {items.length === 0 && !loading ? (
          <div className="border-2 border-dashed border-[#E9D5FF]/30 rounded-3xl p-16 text-center text-[#E9D5FF]/50 font-mono font-bold">No drops match these filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((m, i) => <Reveal key={m.id} delay={(i % 4) * 60}><ItemCard item={m} /></Reveal>)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function Chip({ label, active, onClick, testid, small }) {
  return (
    <button 
      data-testid={testid} 
      onClick={onClick}
      className={`rounded-full transition-all uppercase tracking-wider ${small ? "px-3.5 py-1.5 text-[10px]" : "px-5 py-2.5 text-xs"} font-heading font-extrabold ${
        active 
          ? "bg-[#E9D5FF] text-[#0A0A0C] border-2 border-[#E9D5FF] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]" 
          : "retro-btn-dashed"
      }`}
    >
      {label}
    </button>
  );
}
