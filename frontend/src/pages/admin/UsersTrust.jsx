import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { TrustBadge } from "@/components/kivo/Badges";
import { Search, Ban, EyeOff, BadgeCheck, LogOut, Shield } from "lucide-react";

const TIERS = ["new", "established", "verified"];
const ROLES = ["user", "support_agent", "content_reviewer", "ts_moderator", "auditor", "super_admin"];

export default function UsersTrust() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  const load = (query = "") => api.get("/admin/users", { params: query ? { q: query } : {} }).then((r) => setUsers(r.data)).catch((e) => toast.error(apiError(e.response?.data?.detail)));
  useEffect(() => { load(); }, []);

  const patch = async (id, body) => {
    try { const { data } = await api.put(`/admin/users/${id}/trust`, body); setUsers((u) => u.map((x) => (x.id === id ? data : x))); toast.success("[TRUST] Updated"); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const revoke = async (id) => {
    try { await api.post(`/admin/users/${id}/revoke-sessions`); toast.success("[SESSIONS] Revoked — user force-logged-out"); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm mb-1">Users &amp; Trust</h1>
      <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-6">// trust tiers gate auto-publish &amp; limits</p>

      <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm/40" />
        <input data-testid="user-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email..."
          className="w-full bg-slate border border-slate-light pl-10 pr-4 py-2.5 text-warm font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
      </form>

      <div className="border border-slate-light divide-y divide-slate-light">
        {users.map((u) => (
          <div key={u.id} data-testid={`user-row-${u.id}`} className="flex items-center gap-4 p-3 hover:bg-slate/50 flex-wrap">
            <img src={u.avatar_url} alt="" className="w-10 h-10 border border-slate-light bg-slate" />
            <div className="min-w-0 flex-1">
              <p className="text-warm text-sm font-semibold flex items-center gap-1.5">{u.name}
                {u.verified_creator && <BadgeCheck className="w-3.5 h-3.5 text-amber" />}
                {u.shadow_banned && <span className="font-mono text-[9px] uppercase border border-slate-light text-warm/40 px-1">shadow</span>}
              </p>
              <p className="font-mono text-[11px] text-warm/40">{u.email} · {u.role}</p>
            </div>

            <select data-testid={`trust-select-${u.id}`} value={u.trust_tier} onChange={(e) => patch(u.id, { trust_tier: e.target.value })}
              className="bg-charcoal border border-slate-light text-warm font-mono text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber">
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            {me?.role === "super_admin" && (
              <select data-testid={`role-select-${u.id}`} value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })}
                className="bg-charcoal border border-slate-light text-warm font-mono text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}

            <div className="flex gap-1.5">
              <IconBtn testid={`verify-${u.id}`} title="Toggle verified" active={u.verified_creator} on="border-amber text-amber" onClick={() => patch(u.id, { verified_creator: !u.verified_creator })}><BadgeCheck className="w-4 h-4" /></IconBtn>
              <IconBtn testid={`shadow-${u.id}`} title="Shadow ban" active={u.shadow_banned} on="border-mustard text-mustard" onClick={() => patch(u.id, { shadow_banned: !u.shadow_banned })}><EyeOff className="w-4 h-4" /></IconBtn>
              <IconBtn testid={`ban-${u.id}`} title="Ban" active={u.banned} on="border-rust text-rust" onClick={() => patch(u.id, { banned: !u.banned })}><Ban className="w-4 h-4" /></IconBtn>
              <IconBtn testid={`revoke-${u.id}`} title="Revoke sessions" onClick={() => revoke(u.id)}><LogOut className="w-4 h-4" /></IconBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const IconBtn = ({ children, testid, title, onClick, active, on }) => (
  <button data-testid={testid} title={title} onClick={onClick}
    className={`w-8 h-8 grid place-items-center border transition-colors ${active ? on : "border-slate-light text-warm/50 hover:text-warm hover:border-warm"}`}>{children}</button>
);
