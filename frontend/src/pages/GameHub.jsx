import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Navbar } from "@/components/kivo/Navbar";
import { ModCard, fmt } from "@/components/kivo/ModCard";
import { Package, Download, Layers } from "lucide-react";

export default function GameHub() {
  const { slug } = useParams();
  const [game, setGame] = useState(null);
  const [mods, setMods] = useState([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    api.get(`/games/${slug}`).then((r) => setGame(r.data)).catch(() => setGame(false));
  }, [slug]);

  useEffect(() => {
    const params = { game: slug, sort: "trending", limit: 40 };
    if (category) params.category = category;
    api.get("/mods", { params }).then((r) => setMods(r.data));
  }, [slug, category]);

  if (game === false) return <div className="min-h-screen bg-charcoal"><Navbar /><p className="text-warm p-10 font-mono">Game not found.</p></div>;
  if (!game) return <div className="min-h-screen bg-charcoal"><Navbar /></div>;

  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar />

      <section className="relative border-b border-slate overflow-hidden">
        <img src={game.banner} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 scanlines opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 relative">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber">// game hub</span>
          <h1 className="font-heading text-5xl lg:text-7xl font-black uppercase tracking-tighter text-warm mt-3">{game.name}</h1>
          <p className="text-warm/70 text-lg mt-4 max-w-2xl">{game.description}</p>
          <div className="flex gap-6 mt-6 font-mono text-sm">
            <span className="flex items-center gap-2 text-teal-light"><Package className="w-4 h-4" />{fmt(game.mod_count)} mods</span>
            <span className="flex items-center gap-2 text-warm/60"><Layers className="w-4 h-4" />{game.mod_loaders.join(" · ")}</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setCategory("")} data-testid="hub-cat-all" className={`px-3 py-1.5 text-sm border transition-colors ${!category ? "border-amber bg-amber text-charcoal font-semibold" : "border-slate-light text-warm/70 hover:border-teal-light"}`}>All</button>
          {game.categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} data-testid={`hub-cat-${c}`} className={`px-3 py-1.5 text-sm border transition-colors ${category === c ? "border-amber bg-amber text-charcoal font-semibold" : "border-slate-light text-warm/70 hover:border-teal-light"}`}>{c}</button>
          ))}
        </div>

        {mods.length === 0 ? (
          <div className="border border-dashed border-slate-light p-12 text-center text-warm/40 font-mono">No mods in this category yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mods.map((m) => <ModCard key={m.id} mod={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
