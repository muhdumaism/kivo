import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { ModCard, fmt } from "@/components/kivo/ModCard";
import { Navbar } from "@/components/kivo/Navbar";
import { ShieldCheck, ScanLine, Boxes, ArrowRight, Download, FileCheck2, Lock } from "lucide-react";

export default function Home() {
  const [games, setGames] = useState([]);
  const [trending, setTrending] = useState([]);
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    api.get("/games").then((r) => setGames(r.data));
    api.get("/mods", { params: { sort: "trending", limit: 6 } }).then((r) => setTrending(r.data));
    api.get("/mods", { params: { staff_pick: true, limit: 3 } }).then((r) => setPicks(r.data));
  }, []);

  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate grain">
        <div className="absolute inset-0 scanlines opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28 relative">
          <div className="max-w-3xl animate-fade-up">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber">// multi-game mod hosting</span>
            <h1 className="font-heading text-5xl lg:text-7xl font-black tracking-tighter uppercase text-warm mt-4 leading-[0.95]">
              Mods you can <span className="text-teal-light">actually</span> trust to run.
            </h1>
            <p className="text-warm/70 text-lg mt-6 max-w-xl leading-relaxed">
              Kivo is a strictly-moderated home for game mods. Every upload — and every new version — is reviewed by our staff before it goes live. Download without the malware roulette.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/browse" data-testid="hero-browse-btn" className="inline-flex items-center gap-2 bg-amber text-charcoal px-6 py-3 font-mono font-semibold uppercase tracking-wide hover:-translate-y-1 transition-transform hard-shadow-teal">
                Browse Mods <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/game/minecraft" data-testid="hero-hub-btn" className="inline-flex items-center gap-2 bg-slate text-warm px-6 py-3 font-mono font-semibold uppercase tracking-wide border border-slate-light hover:-translate-y-1 hover:hard-shadow-amber transition-transform">
                Minecraft Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate bg-slate/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            [ScanLine, "Human review queue", "Staff-approved uploads"],
            [FileCheck2, "Every version reviewed", "No silent supply-chain swaps"],
            [ShieldCheck, "Verified creators", "Squatting protection"],
            [Lock, "2FA to publish", "Staff session revocation"],
          ].map(([Icon, t, s], i) => (
            <div key={i} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-teal-light shrink-0 mt-0.5" />
              <div>
                <p className="text-warm text-sm font-semibold">{t}</p>
                <p className="text-warm/50 text-xs font-mono">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-warm/50">Supported games</span>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-warm mt-1">Game Hubs</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {games.map((g) => (
            <Link key={g.slug} to={`/game/${g.slug}`} data-testid={`game-card-${g.slug}`} className="group relative overflow-hidden border border-slate-light bg-slate lg:col-span-2 first:lg:col-span-2 min-h-[220px] flex hover:-translate-y-1 hover:hard-shadow-teal transition-transform">
              <img src={g.banner} alt={g.name} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" />
              <div className="relative p-8 flex flex-col justify-end bg-gradient-to-t from-charcoal via-charcoal/70 to-transparent w-full">
                <h3 className="font-heading text-4xl font-black uppercase tracking-tighter text-warm">{g.name}</h3>
                <p className="text-warm/70 mt-2 max-w-md">{g.tagline}</p>
                <p className="font-mono text-xs text-amber mt-3 uppercase tracking-widest">{fmt(g.mod_count)} mods hosted →</p>
              </div>
            </Link>
          ))}
          <div className="border border-dashed border-slate-light bg-slate/40 grid place-items-center p-8 text-center lg:col-span-1">
            <div>
              <Boxes className="w-8 h-8 text-warm/30 mx-auto" />
              <p className="font-mono text-sm text-warm/50 mt-3 uppercase tracking-wide">More games<br />coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-warm">Trending Now</h2>
          <Link to="/browse" className="font-mono text-xs uppercase tracking-widest text-amber hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trending.map((m) => <ModCard key={m.id} mod={m} />)}
        </div>
      </section>

      {/* Staff picks */}
      {picks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-warm mb-6">Staff Picks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {picks.map((m) => <ModCard key={m.id} mod={m} />)}
          </div>
        </section>
      )}

      <footer className="border-t border-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row justify-between gap-4 font-mono text-xs text-warm/40">
          <span>KIVO // trustworthy mod distribution</span>
          <div className="flex gap-4">
            <Link to="/policy" className="hover:text-warm">Content Policy</Link>
            <Link to="/policy" className="hover:text-warm">DMCA</Link>
            <Link to="/policy" className="hover:text-warm">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
