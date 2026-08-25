import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/qiveo/Navbar";
import { ItemCard } from "@/components/qiveo/ModCard";
import { Footer } from "@/components/qiveo/Footer";
import { Reveal } from "@/components/qiveo/Reveal";
import { Search, SlidersHorizontal } from "lucide-react";

import { GAME_CATEGORIES } from "@/content/games";

const DISCORD_BADGES = { "bots": 659, "graphics": 72, "other": 23 };
const SORTS = [["trending", "Trending"], ["downloads", "Most grabbed"], ["rating", "Top rated"], ["newest", "Newest"]];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState(params.get("q") || "");
  const [loading, setLoading] = useState(true);

  const game = params.get("game") || "minecraft";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "trending";

  const load = useCallback(() => {
    setLoading(true);
    const p = { sort, limit: 60 };
    if (params.get("q")) p.q = params.get("q");
    p.game = game.toLowerCase();
    if (category) p.category = category;
    
    api.get("/mods", { params: p }).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [params, sort, game, category]);

  useEffect(() => { load(); }, [load]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v && next.get(k) !== v) next.set(k, v); else next.delete(k);
    if (k === "game") next.delete("category");
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Reveal>
          <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-[#92400E]">
            <SlidersHorizontal className="w-6 h-6 text-warm" />
            <h1 className="font-heading text-3xl lg:text-4xl font-black text-warm uppercase">Explore Market</h1>
          </div>
        </Reveal>

        <form onSubmit={(e) => { e.preventDefault(); setParam("q", q); }} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm/40" />
            <input 
              data-testid="browse-search-input" 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Search assets..."
              className="w-full bg-[#24201A] border-2 border-[#92400E] rounded-full pl-12 pr-4 py-3 text-warm placeholder:text-warm/40 focus:outline-none focus:border-primary transition-all font-semibold" 
            />
          </div>
          <button type="submit" data-testid="browse-search-btn" className="bg-primary text-[#171512] px-8 py-3 rounded-full text-sm font-extrabold hover:bg-accent transition-colors">Search</button>
        </form>

        {/* Dynamic Tag System */}
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-3 font-bold">Games / Platforms</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(GAME_CATEGORIES).map((g) => (
              <button
                key={g}
                onClick={() => setParam("game", g)}
                className={`px-6 py-2.5 rounded-full font-heading font-extrabold text-sm transition-all capitalize ${
                  game === g
                    ? "bg-primary text-[#171512]"
                    : "bg-[#24201A] text-warm hover:bg-[#92400E]/30"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="bg-[#24201A] border border-[#92400E]/50 rounded-2xl p-4 flex flex-wrap gap-2.5 min-h-[72px] items-center">
            <Chip label="All" active={!category} onClick={() => setParam("category", "")} />
            {(GAME_CATEGORIES[game] || []).map((cat) => (
              <Chip 
                key={cat.id} 
                label={cat.name} 
                badge={game === "discord" ? DISCORD_BADGES[cat.id] : null}
                active={category === cat.id} 
                onClick={() => setParam("category", category === cat.id ? "" : cat.id)} 
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-[#92400E]/30">
          <span className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-warm/50 font-bold">Sort By</span>
            <select data-testid="sort-select" value={sort} onChange={(e) => setParam("sort", e.target.value)} className="bg-[#24201A] border border-[#92400E]/50 rounded-full px-5 py-2 text-xs text-warm font-heading font-extrabold uppercase tracking-wide focus:outline-none">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-6 font-bold">{loading ? "loading..." : `${items.length} assets found`}</p>
        
        {items.length === 0 && !loading ? (
          <div className="bg-[#24201A] border border-[#92400E]/30 rounded-3xl p-16 text-center text-warm/50 font-mono font-bold">No assets match these filters.</div>
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

function Chip({ label, badge, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 rounded-full transition-all px-4 py-2 text-xs font-heading font-extrabold ${
        active 
          ? "bg-primary text-[#171512] shadow-sm" 
          : "bg-[#171512] text-warm hover:bg-[#92400E]/40 border border-[#92400E]/30"
      }`}
    >
      {label}
      {badge && (
        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono ${active ? "bg-[#171512]/20 text-[#171512]" : "bg-[#24201A] text-warm/60"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
