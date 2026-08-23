import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/kivo/Navbar";
import { ModCard } from "@/components/kivo/ModCard";
import { Search, SlidersHorizontal } from "lucide-react";

const LOADERS = ["Fabric", "Forge", "NeoForge", "Quilt"];
const CATEGORIES = ["Technology", "Magic", "Adventure", "Utility", "Worldgen", "Shaders", "Library", "Storage"];
const VERSIONS = ["1.21.4", "1.21.1", "1.20.4", "1.20.1", "1.19.2", "1.18.2"];
const SORTS = [["trending", "Trending"], ["downloads", "Downloads"], ["rating", "Rating"], ["newest", "Newest"], ["updated", "Updated"]];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [mods, setMods] = useState([]);
  const [q, setQ] = useState(params.get("q") || "");
  const [loading, setLoading] = useState(true);

  const category = params.get("category") || "";
  const loader = params.get("loader") || "";
  const game_version = params.get("game_version") || "";
  const sort = params.get("sort") || "trending";

  const load = useCallback(() => {
    setLoading(true);
    const p = { sort, limit: 60 };
    if (params.get("q")) p.q = params.get("q");
    if (category) p.category = category;
    if (loader) p.loader = loader;
    if (game_version) p.game_version = game_version;
    api.get("/mods", { params: p }).then((r) => setMods(r.data)).finally(() => setLoading(false));
  }, [params, sort, category, loader, game_version]);

  useEffect(() => { load(); }, [load]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v && next.get(k) !== v) next.set(k, v); else next.delete(k);
    setParams(next);
  };

  const submitSearch = (e) => { e.preventDefault(); setParam("q", q); };

  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <SlidersHorizontal className="w-6 h-6 text-teal-light" />
          <h1 className="font-heading text-3xl lg:text-4xl font-black uppercase tracking-tighter text-warm">Browse Mods</h1>
        </div>

        <form onSubmit={submitSearch} className="relative mb-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm/40" />
            <input
              data-testid="browse-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search mods, tags, authors..."
              className="w-full bg-slate border border-slate-light pl-12 pr-4 py-3 text-warm font-mono placeholder:text-warm/30 focus:outline-none focus:ring-2 focus:ring-amber"
            />
          </div>
          <button type="submit" data-testid="browse-search-btn" className="bg-amber text-charcoal px-6 font-mono text-sm font-bold uppercase tracking-wide hover:-translate-y-0.5 transition-transform">Search</button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <aside className="space-y-6">
            <FilterGroup title="Sort" options={SORTS.map(([v, l]) => [v, l])} active={sort} onSelect={(v) => setParam("sort", v)} />
            <FilterGroup title="Category" options={CATEGORIES.map((c) => [c, c])} active={category} onSelect={(v) => setParam("category", v)} clearable />
            <FilterGroup title="Mod Loader" options={LOADERS.map((c) => [c, c])} active={loader} onSelect={(v) => setParam("loader", v)} clearable />
            <FilterGroup title="Game Version" options={VERSIONS.map((c) => [c, c])} active={game_version} onSelect={(v) => setParam("game_version", v)} clearable mono />
          </aside>

          <div>
            <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-4">{loading ? "loading..." : `${mods.length} results`}</p>
            {mods.length === 0 && !loading ? (
              <div className="border border-dashed border-slate-light p-12 text-center text-warm/40 font-mono">No mods match these filters.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mods.map((m) => <ModCard key={m.id} mod={m} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, options, active, onSelect, clearable, mono }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button
            key={v}
            data-testid={`filter-${title.toLowerCase().replace(/\s/g, "-")}-${v}`}
            onClick={() => onSelect(clearable && active === v ? "" : v)}
            className={`px-2.5 py-1 text-xs border transition-colors ${mono ? "font-mono" : ""} ${active === v ? "border-amber bg-amber text-charcoal font-semibold" : "border-slate-light text-warm/70 hover:border-teal-light hover:text-warm"}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
