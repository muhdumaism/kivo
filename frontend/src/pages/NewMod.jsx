import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "@/lib/api";
import { Navbar } from "@/components/kivo/Navbar";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

const STEPS = ["Basics", "Details", "Tags & Compat", "Publish"];
const LICENSES = ["MIT", "Apache-2.0", "GPL-3.0", "LGPL-3.0", "CC-BY-4.0", "All Rights Reserved"];

export default function NewMod() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [game, setGame] = useState(null);
  const [form, setForm] = useState({
    title: "", summary: "", description: "", game_slug: "minecraft",
    category: "Utility", license: "MIT", tagsRaw: "", loaders: [], versions: [],
  });

  useEffect(() => { api.get("/games/minecraft").then((r) => setGame(r.data)); }, []);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const toggle = (k, v) => set(k, form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v]);

  const publish = async () => {
    try {
      const { data } = await api.post("/creator/mods", {
        title: form.title, summary: form.summary, description: form.description,
        game_slug: form.game_slug, category: form.category, license: form.license,
        tags: form.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
        mod_loaders: form.loaders, game_versions: form.versions,
      });
      toast.success(`[CREATE] ${data.title} · status: ${data.status}`);
      nav("/creator");
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const canNext = step === 0 ? form.title.trim() && form.summary.trim() : true;

  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm mb-8">New Mod Project</h1>

        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 grid place-items-center font-mono text-sm border ${i < step ? "bg-moss border-moss text-charcoal" : i === step ? "bg-amber border-amber text-charcoal font-bold" : "border-slate-light text-warm/40"}`}>
                  {i < step ? <Check className="w-4 h-4" /> : String(i + 1).padStart(2, "0")}
                </div>
                <span className={`font-mono text-[10px] uppercase tracking-wider mt-1.5 ${i === step ? "text-amber" : "text-warm/40"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-2 ${i < step ? "bg-moss" : "bg-slate-light"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-slate border border-slate-light p-6 min-h-[300px]">
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Mod Title" testid="wizard-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="My Awesome Mod" />
              <Field label="Short Summary" testid="wizard-summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="One-line description shown on cards" />
              <Select label="Category" testid="wizard-category" value={form.category} onChange={(e) => set("category", e.target.value)} options={game?.categories || []} />
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">Description (Markdown)</label>
                <textarea data-testid="wizard-description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={9}
                  placeholder={"# My Mod\\n\\nWhat it does...\\n\\n## Features\\n- Feature one"}
                  className="w-full bg-charcoal border border-slate-light p-3 text-warm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber" />
              </div>
              <Select label="License" testid="wizard-license" value={form.license} onChange={(e) => set("license", e.target.value)} options={LICENSES} />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <Field label="Tags (comma separated)" testid="wizard-tags" value={form.tagsRaw} onChange={(e) => set("tagsRaw", e.target.value)} placeholder="performance, optimization" />
              <Chips label="Mod Loaders" testid="wizard-loader" options={game?.mod_loaders || []} active={form.loaders} onToggle={(v) => toggle("loaders", v)} />
              <Chips label="Game Versions" testid="wizard-version" options={game?.versions || []} active={form.versions} onToggle={(v) => toggle("versions", v)} mono />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3 font-mono text-sm">
              <p className="text-warm/50 uppercase tracking-widest text-xs mb-4">Review &amp; publish</p>
              <Row label="Title" value={form.title} />
              <Row label="Category" value={form.category} />
              <Row label="License" value={form.license} />
              <Row label="Loaders" value={form.loaders.join(", ") || "—"} />
              <Row label="Versions" value={form.versions.join(", ") || "—"} />
              <div className="border border-mustard/40 bg-mustard/10 p-3 mt-4 text-mustard text-xs">
                New/non-verified creators: this project enters the moderation review queue before going live. Verified creators auto-publish.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button data-testid="wizard-back" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className="flex items-center gap-2 border border-slate-light text-warm px-5 py-2.5 font-mono text-xs uppercase tracking-wide disabled:opacity-30 hover:border-teal-light transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          {step < STEPS.length - 1 ? (
            <button data-testid="wizard-next" onClick={() => canNext && setStep(step + 1)} disabled={!canNext}
              className="flex items-center gap-2 bg-teal text-warm px-5 py-2.5 font-mono text-xs uppercase tracking-wide border border-teal-light disabled:opacity-40 hover:-translate-y-0.5 transition-transform">
              Next<ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button data-testid="wizard-publish" onClick={publish}
              className="flex items-center gap-2 bg-amber text-charcoal px-6 py-2.5 font-mono text-xs uppercase tracking-wide font-bold hover:-translate-y-0.5 transition-transform hard-shadow-teal">
              Create Project<Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, testid, ...p }) => (
  <div>
    <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">{label}</label>
    <input data-testid={testid} {...p} className="w-full bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
  </div>
);
const Select = ({ label, testid, options, ...p }) => (
  <div>
    <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">{label}</label>
    <select data-testid={testid} {...p} className="w-full bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
const Chips = ({ label, testid, options, active, onToggle, mono }) => (
  <div>
    <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-2">{label}</label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} data-testid={`${testid}-${o}`} onClick={() => onToggle(o)}
          className={`px-3 py-1.5 text-xs border transition-colors ${mono ? "font-mono" : ""} ${active.includes(o) ? "border-amber bg-amber text-charcoal font-semibold" : "border-slate-light text-warm/70 hover:border-teal-light"}`}>{o}</button>
      ))}
    </div>
  </div>
);
const Row = ({ label, value }) => (
  <div className="flex justify-between border-b border-slate-light py-2">
    <span className="text-warm/50 uppercase text-xs tracking-wide">{label}</span>
    <span className="text-warm">{value}</span>
  </div>
);
