import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, ClipboardCheck, Flag, Users, ScrollText, Activity, Box, ArrowLeft } from "lucide-react";

const NAV = [
  ["/admin", "Overview", LayoutDashboard, true],
  ["/admin/queue", "Review Queue", ClipboardCheck],
  ["/admin/reports", "Reports & Abuse", Flag],
  ["/admin/users", "Users & Trust", Users],
  ["/admin/audit", "Audit Log", ScrollText],
  ["/admin/anomalies", "Anomalies", Activity],
];

const PERMS = {
  super_admin: ["/admin", "/admin/queue", "/admin/reports", "/admin/users", "/admin/audit", "/admin/anomalies"],
  ts_moderator: ["/admin", "/admin/queue", "/admin/reports", "/admin/users", "/admin/audit", "/admin/anomalies"],
  content_reviewer: ["/admin", "/admin/queue", "/admin/anomalies"],
  support_agent: ["/admin", "/admin/reports", "/admin/users", "/admin/anomalies"],
  auditor: ["/admin", "/admin/users", "/admin/audit", "/admin/anomalies"],
};

export default function AdminLayout() {
  const { user } = useAuth();
  const allowed = PERMS[user?.role] || ["/admin"];
  const nav = NAV.filter(([to]) => allowed.includes(to));
  return (
    <div className="min-h-screen bg-charcoal flex">
      <aside className="w-60 shrink-0 bg-slate border-r border-slate-light flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-slate-light">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rust grid place-items-center"><Box className="w-4 h-4 text-warm" /></div>
            <div>
              <p className="font-heading font-black text-warm leading-none">KIVO</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rust">staff panel</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} data-testid={`admin-nav-${label.toLowerCase().split(" ")[0]}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 font-mono text-xs uppercase tracking-wide transition-colors ${isActive ? "bg-charcoal text-amber border-l-2 border-amber" : "text-warm/60 hover:text-warm border-l-2 border-transparent"}`}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-light">
          <p className="font-mono text-[10px] text-warm/40 uppercase tracking-widest">{user?.name}</p>
          <p className="font-mono text-[10px] text-rust uppercase tracking-widest mt-0.5">{user?.role}</p>
          <Link to="/" className="flex items-center gap-1.5 mt-3 font-mono text-[10px] uppercase tracking-widest text-warm/50 hover:text-amber"><ArrowLeft className="w-3 h-3" />Exit to site</Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0 relative grain">
        <div className="absolute inset-0 scanlines opacity-[0.15] pointer-events-none" />
        <div className="relative p-6 lg:p-8"><Outlet /></div>
      </main>
    </div>
  );
}
