import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api, { API, apiError } from "@/lib/api";
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
  const avatarSrc = user.avatar_url?.startsWith("http") ? user.avatar_url : `${API.replace("/api", "")}${user.avatar_url}`;

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
    <div className="min-h-screen bg-[#171512]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group overflow-hidden border border-[#92400E] bg-[#24201A] w-20 h-20 rounded-2xl">
            <img src={avatarSrc} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
            <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer bg-black/40">
              <Upload className="w-6 h-6 text-[#FFF8E1]" />
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
          </div>
          <div>
            <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-[#FFF8E1]">{user.name}</h1>
            <p className="font-mono text-sm text-[#FFF8E1]/50">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <TrustBadge tier={user.trust_tier} testid="profile-trust" />
              {user.verified_creator && <span className="font-mono text-[10px] uppercase tracking-widest border border-[#F5C542] text-[#F5C542] px-2 py-0.5 rounded-full font-bold">Verified Creator</span>}
              <span className="font-mono text-[10px] uppercase tracking-widest border border-[#92400E] text-[#FFF8E1]/60 px-2 py-0.5 rounded-full font-bold">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#FFF8E1]/50 mb-1.5 font-bold">Display Name</label>
            <input data-testid="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#171512] border border-[#92400E] rounded-xl p-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#FFF8E1]/50 mb-1.5 font-bold">Bio</label>
            <textarea data-testid="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full bg-[#171512] border border-[#92400E] rounded-xl p-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#FFF8E1]/50 mb-1.5 font-bold">External Links (comma separated)</label>
            <input data-testid="profile-links" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="https://github.com/..." className="w-full bg-[#171512] border border-[#92400E] rounded-xl p-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
          </div>
          <div className="flex items-center justify-between border-t border-[#92400E]/30 pt-4 mt-2">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#F5C542]" />
              <div>
                <p className="text-[#FFF8E1] text-sm font-bold font-heading">Two-Factor Auth</p>
                <p className="text-[#FFF8E1]/40 text-xs font-mono">Required to publish mods</p>
              </div>
            </div>
            <button data-testid="toggle-2fa" onClick={() => setTfa(!tfa)} className={`w-12 h-6 rounded-full border transition-colors relative ${tfa ? "bg-[#F59E0B] border-[#F59E0B]" : "bg-[#171512] border-[#92400E]"}`}>
              <div className={`w-4 h-4 rounded-full bg-[#FFF8E1] absolute top-[3px] transition-all ${tfa ? "left-[26px]" : "left-[3px]"}`} />
            </button>
          </div>
          <button data-testid="save-profile-btn" onClick={save} className="flex items-center justify-center gap-2 bg-[#F5C542] text-[#171512] w-full mt-4 rounded-full px-5 py-3 font-heading text-sm font-bold hover:bg-[#FFD84D] transition-colors">
            <Save className="w-4 h-4" />Save Changes
          </button>
        </div>

        <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 mt-6">
          <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#FFF8E1]/50 mb-4 font-bold"><KeyRound className="w-4 h-4" />Linked Providers</h3>
          <div className="flex gap-2">
            {(user.linked_providers || []).length ? user.linked_providers.map((p) => (
              <span key={p} className="font-mono text-xs uppercase border border-[#F5C542] text-[#F5C542] rounded-full px-3 py-1 font-bold">{p}</span>
            )) : <span className="font-mono text-xs text-[#FFF8E1]/40">None linked. Link Google/Discord once OAuth is configured.</span>}
          </div>
        </div>

        <button data-testid="profile-logout-btn" onClick={logout} className="flex items-center gap-2 text-rose-500 font-mono text-xs uppercase tracking-widest mt-8 font-bold hover:text-rose-400 transition-colors">
          <LogOut className="w-4 h-4" />Sign out of all sessions
        </button>
      </div>
    </div>
  );
}
