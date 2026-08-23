import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { Box, Terminal, AlertCircle } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", age_confirm: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else {
        if (!form.age_confirm) { setErr("You must confirm you are 13 or older."); setBusy(false); return; }
        await register(form);
      }
      nav("/");
    } catch (e) { setErr(apiError(e.response?.data?.detail) || e.message); }
    setBusy(false);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="min-h-screen bg-charcoal grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-slate grain overflow-hidden">
        <div className="absolute inset-0 scanlines opacity-30" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="w-10 h-10 bg-teal grid place-items-center border border-teal-light"><Box className="w-6 h-6 text-warm" /></div>
          <span className="font-heading font-black text-2xl tracking-tighter text-warm">KIVO</span>
        </Link>
        <div className="relative">
          <h2 className="font-heading text-4xl font-black uppercase tracking-tighter text-warm leading-tight">The safest way<br />to ship & get mods.</h2>
          <p className="text-warm/60 mt-4 max-w-sm">Every upload is reviewed by staff. Every new version re-checked. Accounts protected by trust tiers and staff session revocation.</p>
        </div>
        <p className="relative font-mono text-xs text-warm/30">// signal &amp; slate</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex gap-1 mb-8 border border-slate-light">
            {["login", "register"].map((m) => (
              <button key={m} data-testid={`tab-${m}`} onClick={() => { setMode(m); setErr(""); }}
                className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors ${mode === m ? "bg-amber text-charcoal font-bold" : "text-warm/60 hover:text-warm"}`}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field label="Display Name" testid="name-input" value={form.name} onChange={set("name")} placeholder="AuroraDev" />
            )}
            <Field label="Email" testid="email-input" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            <Field label="Password" testid="password-input" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />

            {mode === "register" && (
              <label className="flex items-start gap-2 text-xs text-warm/60 font-mono">
                <input data-testid="age-confirm" type="checkbox" checked={form.age_confirm} onChange={set("age_confirm")} className="mt-0.5 accent-amber" />
                I confirm I am 13 years or older (COPPA)
              </label>
            )}

            {err && <p data-testid="auth-error" className="flex items-center gap-2 text-rust text-sm font-mono"><AlertCircle className="w-4 h-4" />{err}</p>}

            <button data-testid="auth-submit-btn" disabled={busy} type="submit"
              className="w-full flex items-center justify-center gap-2 bg-amber text-charcoal py-3 font-mono font-bold uppercase tracking-wide hover:-translate-y-0.5 transition-transform hard-shadow-teal disabled:opacity-50">
              <Terminal className="w-4 h-4" />{busy ? "..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate">
            <p className="font-mono text-[10px] uppercase tracking-widest text-warm/40 mb-3 text-center">OAuth login (configure keys)</p>
            <div className="grid grid-cols-2 gap-2">
              <button disabled title="Add GOOGLE_CLIENT_ID in backend/.env" className="py-2.5 border border-slate-light text-warm/40 font-mono text-xs uppercase cursor-not-allowed">Google</button>
              <button disabled title="Add DISCORD_CLIENT_ID in backend/.env" className="py-2.5 border border-slate-light text-warm/40 font-mono text-xs uppercase cursor-not-allowed">Discord</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, testid, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">{label}</label>
      <input data-testid={testid} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full bg-slate border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
    </div>
  );
}
