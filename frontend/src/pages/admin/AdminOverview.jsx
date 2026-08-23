import { useEffect, useState } from "react";
import api from "@/lib/api";
import { fmt } from "@/components/kivo/ModCard";
import { ClipboardCheck, GitCommit, Flag, AlertOctagon, Users, Ban, Package, Download } from "lucide-react";

export default function AdminOverview() {
  const [o, setO] = useState(null);
  useEffect(() => { api.get("/admin/overview").then((r) => setO(r.data)); }, []);
  if (!o) return null;

  const cards = [
    ["Pending Mods", o.pending_mods, ClipboardCheck, "mustard"],
    ["Pending Versions", o.pending_versions, GitCommit, "mustard"],
    ["Open Reports", o.open_reports, Flag, "amber"],
    ["Critical Reports", o.critical_reports, AlertOctagon, "rust"],
    ["Total Users", fmt(o.total_users), Users, "teal-light"],
    ["Banned Users", o.banned_users, Ban, "rust"],
    ["Total Mods", fmt(o.total_mods), Package, "teal-light"],
    ["Total Downloads", fmt(o.total_downloads), Download, "moss"],
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm mb-1">Operations Overview</h1>
      <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-8">// real-time moderation state</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value, Icon, color]) => (
          <div key={label} className="bg-slate border border-slate-light p-5" data-testid={`overview-${label.toLowerCase().replace(/\s/g, "-")}`}>
            <Icon className={`w-5 h-5 text-${color}`} />
            <p className="font-heading text-3xl font-black text-warm mt-3">{value}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-warm/40 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
