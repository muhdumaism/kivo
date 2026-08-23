import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { ItemCard, fmt } from "@/components/kivo/ModCard";
import { Navbar } from "@/components/kivo/Navbar";
import { ParallaxCubes } from "@/components/kivo/ParallaxCubes";
import { Reveal } from "@/components/kivo/Reveal";
import { CornerFrame } from "@/components/kivo/CornerFrame";
import { ArrowRight, ShieldCheck, Boxes, Sparkles, Layers, Globe, Puzzle, Gem, User, Download, Compass } from "lucide-react";

const TYPES = [
  ["Skin", User], ["Character", Boxes], ["Build", Layers],
  ["World", Globe], ["Mod", Puzzle], ["Collectible", Gem],
];

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [picks, setPicks] = useState([]);
  const [game, setGame] = useState(null);

  useEffect(() => {
    api.get("/mods", { params: { sort: "trending", limit: 8 } }).then((r) => setTrending(r.data));
    api.get("/mods", { params: { staff_pick: true, limit: 4 } }).then((r) => setPicks(r.data));
    api.get("/games/minecraft").then((r) => setGame(r.data)).catch(() => {});
  }, []);

  const hero = picks[0] || trending[0];

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden mesh-bg border-b border-plumborder/60">
        <ParallaxCubes />
        <div className="absolute inset-0 grain" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-coral2 bg-coral/10 border border-coral/30 rounded-full px-3 py-1">Beta Release</span>
            <h1 className="font-heading text-4xl lg:text-6xl font-extrabold tracking-tight text-warm mt-5 leading-[1.02]">
              Download <span className="bg-gradient-to-r from-lavender2 to-coral bg-clip-text text-transparent">Kivo</span><br />for Windows
            </h1>
            <p className="text-lavender2/80 text-lg mt-5 max-w-xl mx-auto">The fastest way to discover, install and manage Minecraft mods, plugins and modpacks — all human-reviewed, all in one place.</p>
            <div className="flex flex-wrap gap-3 justify-center mt-7">
              <Link to="/browse" data-testid="hero-download-btn" className="shine inline-flex items-center gap-2 bg-coral text-ink px-6 py-3.5 rounded-lg font-bold hover:-translate-y-1 transition-transform glow-coral"><Download className="w-4 h-4" />Download App</Link>
              <Link to="/browse" data-testid="hero-more-btn" className="inline-flex items-center gap-2 bg-plum/60 backdrop-blur text-warm px-6 py-3.5 rounded-lg font-bold border border-plumborder hover:border-violet/60 transition-colors">More Download Options</Link>
            </div>
          </div>

          {/* Mock desktop app preview */}
          <Reveal delay={100} className="mt-14 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-plumborder bg-plum/80 backdrop-blur shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-plumborder/60">
                <span className="w-3 h-3 rounded-full bg-rose/70" /><span className="w-3 h-3 rounded-full bg-gold/70" /><span className="w-3 h-3 rounded-full bg-mint/70" />
                <span className="ml-3 font-pixel text-sm text-lavender2/70">kivo app</span>
              </div>
              <div className="flex">
                <div className="w-14 bg-ink/60 border-r border-plumborder/60 py-4 flex flex-col items-center gap-4">
                  {[Compass, Boxes, Globe, Puzzle, Gem].map((I, i) => <div key={i} className={`w-9 h-9 grid place-items-center rounded-lg ${i === 0 ? "bg-coral/20 text-coral2" : "text-lavender2/50"}`}><I className="w-4 h-4" /></div>)}
                </div>
                <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 bg-gradient-to-br from-violet/25 to-plum2 border border-plumborder rounded-xl p-4">
                    <p className="text-xs font-mono text-lavender2/50 uppercase tracking-widest">Welcome back</p>
                    <p className="font-heading font-bold text-warm text-lg mt-1">Ready to play, AuroraBlocks?</p>
                    <div className="mt-3 flex gap-2"><span className="bg-coral text-ink text-xs font-bold px-3 py-1.5 rounded-lg">Play</span><span className="border border-plumborder text-lavender2/70 text-xs px-3 py-1.5 rounded-lg">Manage mods</span></div>
                  </div>
                  <div className="bg-ink/60 border border-plumborder rounded-xl p-3">
                    <p className="text-xs font-mono text-lavender2/50 uppercase tracking-widest mb-2">Playing as</p>
                    <div className="flex items-center gap-2"><img src="https://api.dicebear.com/7.x/bottts/svg?seed=auroradev" className="w-8 h-8 rounded-lg bg-plum2" alt="" /><span className="text-sm text-warm font-semibold">AuroraBlocks</span></div>
                    <p className="text-xs font-mono text-lavender2/50 uppercase tracking-widest mt-3 mb-2">Friends</p>
                    {["BlockFan", "Dex", "Ivy"].map((n) => <div key={n} className="flex items-center gap-2 mb-1.5"><span className="w-2 h-2 rounded-full bg-mint" /><span className="text-xs text-lavender2/70">{n}</span></div>)}
                  </div>
                  <div className="md:col-span-3 bg-ink/60 border border-plumborder rounded-xl p-3">
                    <p className="text-xs font-mono text-lavender2/50 uppercase tracking-widest mb-2">Jump back in</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {trending.slice(0, 4).map((m) => <div key={m.id} className="flex items-center gap-2 bg-plum2/60 rounded-lg p-2"><img src={m.icon} className="w-8 h-8 rounded-md object-cover" alt="" /><span className="text-xs text-warm truncate">{m.title}</span></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <Reveal><h2 className="font-heading text-2xl font-bold text-warm mb-6">Shop by type</h2></Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {TYPES.map(([t, Icon], i) => (
            <Reveal key={t} delay={i * 60}>
              <Link to={`/browse?item_type=${t}`} data-testid={`cat-${t}`} className="group flex flex-col items-center gap-2 bg-plum border border-plumborder rounded-2xl py-6 hover:-translate-y-1 hover:border-violet/60 transition-all">
                <div className="w-11 h-11 rounded-xl bg-violet/15 grid place-items-center group-hover:bg-coral/20 transition-colors">
                  <Icon className="w-5 h-5 text-lavender2 group-hover:text-coral2 transition-colors" />
                </div>
                <span className="font-heading font-semibold text-sm text-warm">{t}s</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURED DROPS */}
      {picks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-end justify-between mb-6">
            <Reveal><div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-coral2">// staff picks</span>
              <h2 className="font-heading text-3xl font-bold text-warm mt-1">Featured drops</h2>
            </div></Reveal>
            <Link to="/browse" className="font-mono text-xs uppercase tracking-widest text-lavender2 hover:text-coral2">All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {picks.map((m, i) => <Reveal key={m.id} delay={i * 90}><ItemCard item={m} /></Reveal>)}
          </div>
        </section>
      )}

      {/* TRENDING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <Reveal><h2 className="font-heading text-3xl font-bold text-warm mb-6">Trending now 🔥</h2></Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {trending.map((m, i) => <Reveal key={m.id} delay={(i % 4) * 90}><ItemCard item={m} /></Reveal>)}
        </div>
      </section>

      {/* TRUST */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <Reveal>
          <CornerFrame color="violet" className="bg-gradient-to-br from-plum to-ink2 border border-plumborder rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-violet/20 blur-3xl rounded-full" />
            <div className="relative max-w-2xl">
              <ShieldCheck className="w-8 h-8 text-mint" />
              <h2 className="font-heading text-3xl lg:text-4xl font-extrabold text-warm mt-4">Every drop gets checked by a real human.</h2>
              <p className="text-lavender2/80 mt-4 leading-relaxed">New creators go through review before anything goes live. Verified creators get instant drops. Report anything sus and our Trust &amp; Safety crew is on it with priority lanes.</p>
              <Link to="/policy" className="inline-flex items-center gap-2 mt-6 text-coral2 font-semibold hover:gap-3 transition-all">Read the trust policy <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </CornerFrame>
        </Reveal>
      </section>

      <footer className="border-t border-plumborder/60 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xl text-warm">kivo</span>
            <span className="font-mono text-xs text-lavender2/40">// the minecraft marketplace</span>
          </div>
          <div className="flex gap-5 font-mono text-xs text-lavender2/50">
            <Link to="/policy" className="hover:text-coral2">Trust</Link>
            <Link to="/policy" className="hover:text-coral2">DMCA</Link>
            <Link to="/policy" className="hover:text-coral2">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
