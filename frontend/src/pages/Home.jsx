import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { ItemCard, fmt } from "@/components/kivo/ModCard";
import { Navbar } from "@/components/kivo/Navbar";
import { ParallaxCubes } from "@/components/kivo/ParallaxCubes";
import { Reveal } from "@/components/kivo/Reveal";
import { CornerFrame } from "@/components/kivo/CornerFrame";
import { ArrowRight, ShieldCheck, Boxes, Sparkles, Layers, Globe, Puzzle, Gem, User } from "lucide-react";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 relative grid lg:grid-cols-2 gap-10 items-center">
          {/* watermark */}
          <span className="pointer-events-none select-none absolute -top-4 right-2 font-pixel text-[26vw] leading-none text-stroke hidden lg:block">01</span>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-coral2 bg-coral/10 border border-coral/30 rounded-full px-3 py-1">
              <Sparkles className="w-3.5 h-3.5" /> Minecraft marketplace
            </span>
            <h1 className="font-heading text-5xl lg:text-7xl font-extrabold tracking-tight text-warm mt-5 leading-[0.98]">
              Blocky drops<br />built <span className="bg-gradient-to-r from-lavender2 to-coral bg-clip-text text-transparent">different.</span>
            </h1>
            <p className="text-lavender2/80 text-lg mt-6 max-w-md leading-relaxed">
              Skins, characters, builds, worlds, mods and collectible voxels — hand-made by real creators, human-reviewed before every drop. No sketchy files. Just vibes.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/browse" data-testid="hero-browse-btn" className="shine inline-flex items-center gap-2 bg-coral text-ink px-6 py-3.5 rounded-full font-bold hover:-translate-y-1 transition-transform glow-coral">
                Explore drops <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/browse?item_type=Collectible" data-testid="hero-collect-btn" className="inline-flex items-center gap-2 bg-plum/60 backdrop-blur text-warm px-6 py-3.5 rounded-full font-bold border border-plumborder hover:border-violet/60 transition-colors">
                <Gem className="w-4 h-4 text-lavender2" /> Collectibles
              </Link>
            </div>
          </div>

          {/* hero voxel */}
          <div className="relative z-10 flex justify-center">
            {hero && (
              <Link to={`/item/${hero.slug}`} className="group relative">
                <div className="absolute inset-0 blur-3xl bg-violet/30 rounded-full scale-90" />
                <CornerFrame color="coral" className="relative">
                  <div className="animate-floaty rounded-3xl overflow-hidden border border-lavender/20 bg-gradient-to-br from-plum2 to-ink w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]">
                    <img src={hero.icon} alt={hero.title} className="w-full h-full object-cover" />
                  </div>
                </CornerFrame>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-ink/80 backdrop-blur border border-plumborder rounded-full px-4 py-1.5 flex items-center gap-2 whitespace-nowrap">
                  <span className="font-heading font-bold text-sm text-warm">{hero.title}</span>
                  <span className="font-mono text-[10px] text-mint uppercase">Free</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            [fmt(game?.mod_count || 10), "Live drops"],
            ["6", "Categories"],
            [fmt(trending.reduce((a, m) => a + (m.downloads || 0), 0)), "Downloads"],
            ["100%", "Human-reviewed"],
          ].map(([v, l], i) => (
            <Reveal key={l} delay={i * 80}>
              <div className="bg-plum/50 backdrop-blur border border-plumborder rounded-2xl p-4 text-center">
                <p className="font-heading text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-lavender2 to-coral bg-clip-text text-transparent">{v}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-lavender2/50 mt-1">{l}</p>
              </div>
            </Reveal>
          ))}
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
