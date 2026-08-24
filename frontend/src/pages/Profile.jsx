import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api, { apiError } from "@/lib/api";
import { Navbar } from "@/components/qiveo/Navbar";
import { TrustBadge } from "@/components/qiveo/Badges";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, LogOut, Save, Upload } from "lucide-react";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [tfa, setTfa] = useState(!!user?.two_factor_enabled);
  const [links, setLinks] = useState((user?.links || []).join(", "));

  if (!user) return null;

  const save = async () => {
    try {
      const { data } = await api.put("/auth/profile", { name, bio, links: links.split(",").map(l => l.trim()).filter(Boolean), two_factor_enabled: tfa });
      setUser(data);
      toast.success("[PROFILE] Saved");
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/auth/avatar", form);
      setUser({ ...user, avatar_url: data.avatar_url });
      toast.success("Avatar updated");
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group overflow-hidden border border-slate-light bg-slate w-20 h-20">
            <img src={user.avatar_url} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer bg-black/40">
              <Upload className="w-6 h-6 text-warm" />
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
          </div>
          <div>
            <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm">{user.name}</h1>
            <p className="font-mono text-sm text-warm/50">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <TrustBadge tier={user.trust_tier} testid="profile-trust" />
              {user.verified_creator && <span className="font-mono text-[10px] uppercase tracking-widest border border-amber text-amber px-2 py-0.5">Verified Creator</span>}
              <span className="font-mono text-[10px] uppercase tracking-widest border border-slate-light text-warm/60 px-2 py-0.5">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate border border-slate-light p-6 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">Display Name</label>
            <input data-testid="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">Bio</label>
            <textarea data-testid="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">External Links (comma separated)</label>
            <input data-testid="profile-links" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="https://github.com/..." className="w-full bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
          </div>
          <div className="flex items-center justify-between border-t border-slate-light pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-light" />
              <div>
                <p className="text-warm text-sm font-semibold">Two-Factor Auth</p>
                <p className="text-warm/40 text-xs font-mono">Required to publish mods</p>
              </div>
            </div>
            <button data-testid="toggle-2fa" onClick={() => setTfa(!tfa)} className={`w-12 h-6 border transition-colors ${tfa ? "bg-moss border-moss" : "bg-charcoal border-slate-light"}`}>
              <div className={`w-4 h-4 bg-warm transition-transform ${tfa ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <button data-testid="save-profile-btn" onClick={save} className="flex items-center gap-2 bg-amber text-charcoal px-5 py-2.5 font-mono text-xs uppercase tracking-wide font-bold hover:-translate-y-0.5 transition-transform">
            <Save className="w-4 h-4" />Save Changes
          </button>
        </div>

        <div className="bg-slate border border-slate-light p-6 mt-4">
          <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-warm/50 mb-3"><KeyRound className="w-4 h-4" />Linked Providers</h3>
          <div className="flex gap-2">
            {(user.linked_providers || []).length ? user.linked_providers.map((p) => (
              <span key={p} className="font-mono text-xs uppercase border border-teal text-teal-light px-3 py-1">{p}</span>
            )) : <span className="font-mono text-xs text-warm/40">None linked. Link Google/Discord once OAuth is configured.</span>}
          </div>
        </div>

        <button data-testid="profile-logout-btn" onClick={logout} className="flex items-center gap-2 text-rust font-mono text-xs uppercase tracking-wide mt-6 hover:underline">
          <LogOut className="w-4 h-4" />Sign out of all sessions
        </button>
      </div>
    </div>
  );
}
