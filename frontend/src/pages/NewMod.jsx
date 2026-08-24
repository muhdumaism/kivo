import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "@/lib/api";
import { Navbar } from "@/components/qiveo/Navbar";
import { CornerFrame } from "@/components/qiveo/CornerFrame";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Check, Lock } from "lucide-react";

const STEPS = ["Basics", "Details", "Tags & Compat", "Publish"];
const LICENSES = ["MIT", "Apache-2.0", "GPL-3.0", "CC-BY-4.0", "All Rights Reserved"];
const GAMES = {
  minecraft: ["Plugins", "Mods", "Server setups", "Builds", "Configs", "Graphics", "Textures", "Models", "Server jars", "Skripts", "Other"],
  roblox: ["Game setups", "Maps", "Scripts", "Vehicles", "Weapons", "Models", "Clothing", "Graphics & UI", "Animations & VFX", "Audio"],
  hytale: ["Plugins", "Data assets", "Server setups", "Builds", "Graphics", "Textures", "Models", "Audio", "Other"],
  discord: ["Bots", "Graphics", "Other"]
};
const VERSIONS = {
  minecraft: ["26.2", "26.1", "1.21.4", "1.21.1", "1.20.4", "1.20.1", "1.19.2", "1.18.2", "1.16.5"],
  roblox: ["Latest"],
  hytale: ["Latest"],
  discord: ["v14", "v13"]
};
const LOADERS = {
  "Plugins": ["Paper", "Spigot", "Purpur", "Velocity", "BungeeCord", "Folia", "Waterdog"],
  "Mods": ["Fabric", "Forge", "NeoForge", "Quilt"],
  "Server setups": ["Paper", "Purpur", "Velocity"],
  "Skripts": ["Skript 2.9", "Skript 2.8"]
};

export default function NewMod() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [game, setGame] = useState(null);
  const [form, setForm] = useState({
    title: "", summary: "", description: "", game_slug: "minecraft",
    item_type: "Plugins", rarity: "Common", license: "MIT", pricing: "free",
    tagsRaw: "", loaders: [], versions: [],
  });

  useEffect(() => { api.get("/games/minecraft").then((r) => setGame(r.data)); }, []);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const toggle = (k, v) => set(k, form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v]);

  const publish = async () => {
    try {
      const { data } = await api.post("/creator/mods", {
        title: form.title, summary: form.summary, description: form.description,
        game_slug: form.game_slug, item_type: form.item_type, rarity: form.rarity, category: form.item_type,
        license: form.license, tags: form.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
        mod_loaders: form.loaders, game_versions: form.versions,
      });
      toast.success(`${data.title} created · ${data.status === "approved" ? "live now" : "sent to review"}`);
      nav("/creator");
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const canNext = step === 0 ? form.title.trim() && form.summary.trim() : true;

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-heading text-3xl font-extrabold text-warm mb-8">New drop</h1>

        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 grid place-items-center rounded-full font-mono text-sm border transition-colors ${i < step ? "bg-mint border-mint text-ink" : i === step ? "bg-coral border-coral text-ink font-bold" : "border-plumborder text-lavender2/40"}`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`font-mono text-[10px] uppercase tracking-wider mt-1.5 ${i === step ? "text-coral2" : "text-lavender2/40"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-2 rounded ${i < step ? "bg-mint" : "bg-plumborder"}`} />}
            </div>
          ))}
        </div>

        <CornerFrame color="violet" className="bg-plum border border-plumborder rounded-2xl p-6 min-h-[320px]">
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Drop name" testid="wizard-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Aether Knight" />
              <Field label="Short summary" testid="wizard-summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="A legendary armored hero skin" />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Game / Platform" testid="wizard-game" value={form.game_slug} onChange={(e) => { set("game_slug", e.target.value); set("item_type", GAMES[e.target.value][0]); }} options={Object.keys(GAMES)} />
                <Select label="Category" testid="wizard-type" value={form.item_type} onChange={(e) => set("item_type", e.target.value)} options={GAMES[form.game_slug] || []} />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-lavender2/50 mb-1.5">Description (Markdown)</label>
                <textarea data-testid="wizard-description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={8}
                  placeholder={"# My drop\n\nWhat it is...\n\n## How to use\n- Step one"}
                  className="w-full bg-ink border border-plumborder rounded-xl p-3 text-warm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet" />
              </div>
              <Select label="License" testid="wizard-license" value={form.license} onChange={(e) => set("license", e.target.value)} options={LICENSES} />
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-lavender2/50 mb-2">Pricing</label>
                <div className="grid grid-cols-2 gap-2">
                  <button data-testid="pricing-free" onClick={() => set("pricing", "free")} className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${form.pricing === "free" ? "border-mint bg-mint/10 text-mint" : "border-plumborder text-lavender2/70"}`}>Free</button>
                  <button data-testid="pricing-paid" disabled className="py-3 rounded-xl border border-plumborder text-lavender2/40 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5" />Paid · Coming soon
                  </button>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <Field label="Tags (comma separated)" testid="wizard-tags" value={form.tagsRaw} onChange={(e) => set("tagsRaw", e.target.value)} placeholder="hero, armor, rpg" />
              <Select label="Rarity" testid="wizard-rarity" value={form.rarity} onChange={(e) => set("rarity", e.target.value)} options={["Common", "Uncommon", "Rare", "Epic", "Legendary"]} />
              <Chips label="Software / Loaders (if applicable)" testid="wizard-loader" options={LOADERS[form.item_type] || []} active={form.loaders} onToggle={(v) => toggle("loaders", v)} />
              <Chips label="Game versions" testid="wizard-version" options={VERSIONS[form.game_slug] || []} active={form.versions} onToggle={(v) => toggle("versions", v)} mono />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-widest text-lavender2/50 mb-4">Review &amp; publish</p>
              <Row label="Name" value={form.title} />
              <Row label="Game" value={form.game_slug} />
              <Row label="Category" value={form.item_type} />
              <Row label="Rarity" value={form.rarity} />
              <Row label="Pricing" value="Free" />
              <Row label="License" value={form.license} />
              <Row label="Versions" value={form.versions.join(", ") || "—"} />
              <div className="border border-gold/40 bg-gold/10 rounded-xl p-3 mt-4 text-gold text-xs">
                New creators: your drop enters the review queue before it goes live. Verified creators publish instantly. You can upload the actual file from your Studio after creating.
              </div>
            </div>
          )}
        </CornerFrame>

        <div className="flex justify-between mt-6">
          <button data-testid="wizard-back" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className="flex items-center gap-2 border border-plumborder text-warm px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-30 hover:border-violet/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          {step < STEPS.length - 1 ? (
            <button data-testid="wizard-next" onClick={() => canNext && setStep(step + 1)} disabled={!canNext}
              className="flex items-center gap-2 bg-violet text-warm px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40 hover:-translate-y-0.5 transition-transform">
              Next<ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button data-testid="wizard-publish" onClick={publish}
              className="shine flex items-center gap-2 bg-coral text-ink px-7 py-2.5 rounded-full font-bold hover:-translate-y-0.5 transition-transform glow-coral">
              Create drop<Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, testid, ...p }) => (
  <div>
    <label className="block font-mono text-[10px] uppercase tracking-widest text-lavender2/50 mb-1.5">{label}</label>
    <input data-testid={testid} {...p} className="w-full bg-ink border border-plumborder rounded-xl p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
  </div>
);
const Select = ({ label, testid, options, ...p }) => (
  <div>
    <label className="block font-mono text-[10px] uppercase tracking-widest text-lavender2/50 mb-1.5">{label}</label>
    <select data-testid={testid} {...p} className="w-full bg-ink border border-plumborder rounded-xl p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
const Chips = ({ label, testid, options, active, onToggle, mono }) => (
  <div>
    <label className="block font-mono text-[10px] uppercase tracking-widest text-lavender2/50 mb-2">{label}</label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} data-testid={`${testid}-${o}`} onClick={() => onToggle(o)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${mono ? "font-mono" : ""} ${active.includes(o) ? "border-coral bg-coral text-ink font-semibold" : "border-plumborder text-lavender2/70 hover:border-violet/60"}`}>{o}</button>
      ))}
    </div>
  </div>
);
const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-plumborder py-2 text-sm">
    <span className="text-lavender2/50 uppercase text-xs tracking-wide font-mono">{label}</span>
    <span className="text-warm">{value}</span>
  </div>
);
