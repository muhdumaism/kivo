import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { AlertOctagon, Clock, Check } from "lucide-react";

const CAT_COLOR = { csam: "rust", malware: "rust", dmca: "mustard", harassment: "mustard", impersonation: "mustard", spam: "teal-light", other: "warm/50" };

function slaLeft(deadline) {
  const ms = new Date(deadline) - new Date();
  if (ms <= 0) return { text: "OVERDUE", overdue: true };
  const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4);
  return { text: `${h}h ${m}m`, overdue: false };
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("open");
  const [, tick] = useState(0);

  const load = () => api.get("/admin/reports", { params: filter ? { status: filter } : {} }).then((r) => setReports(r.data)).catch((e) => toast.error(apiError(e.response?.data?.detail)));
  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const i = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(i); }, []);

  const resolve = async (id, status) => {
    try { await api.post(`/admin/reports/${id}/resolve`, { status, resolution: `Marked ${status}` }); toast.success(`[REPORT] ${status}`); load(); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm mb-1">Reports &amp; Abuse</h1>
      <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-6">// SLA lanes · CSAM &amp; malware = priority</p>

      <div className="flex gap-1.5 mb-6">
        {["open", "resolved", "dismissed", ""].map((f) => (
          <button key={f || "all"} data-testid={`reports-filter-${f || "all"}`} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wide border ${filter === f ? "border-amber bg-amber text-charcoal font-bold" : "border-slate-light text-warm/60 hover:border-teal-light"}`}>{f || "all"}</button>
        ))}
      </div>

      <div className="border border-slate-light divide-y divide-slate-light">
        {reports.length === 0 && <div className="p-10 text-center text-warm/40 font-mono">No reports.</div>}
        {reports.map((r) => {
          const sla = slaLeft(r.sla_deadline);
          return (
            <div key={r.id} data-testid={`report-${r.id}`} className="flex items-center gap-4 p-4 hover:bg-slate/50 flex-wrap">
              {r.priority === "critical" && <AlertOctagon className="w-5 h-5 text-rust animate-pulse shrink-0" />}
              <span className={`font-mono text-[10px] uppercase tracking-widest border border-${CAT_COLOR[r.category]} text-${CAT_COLOR[r.category]} px-2 py-0.5`}>{r.category}</span>
              <div className="min-w-0 flex-1">
                <p className="text-warm text-sm truncate">{r.reason}</p>
                <p className="font-mono text-[11px] text-warm/40">{r.target_type} · reported by {r.reporter_name}</p>
              </div>
              {r.status === "open" && (
                <span className={`flex items-center gap-1 font-mono text-xs ${sla.overdue ? "text-rust font-bold" : "text-mustard"}`}><Clock className="w-3.5 h-3.5" />{sla.text}</span>
              )}
              {r.status === "open" ? (
                <div className="flex gap-1.5">
                  <button data-testid={`resolve-${r.id}`} onClick={() => resolve(r.id, "resolved")} className="flex items-center gap-1 border border-moss text-moss px-2 py-1 font-mono text-[10px] uppercase hover:bg-moss hover:text-charcoal transition-colors"><Check className="w-3 h-3" />Resolve</button>
                  <button data-testid={`dismiss-${r.id}`} onClick={() => resolve(r.id, "dismissed")} className="border border-slate-light text-warm/60 px-2 py-1 font-mono text-[10px] uppercase hover:border-warm transition-colors">Dismiss</button>
                </div>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-widest text-warm/40">{r.status} · {r.resolved_by || ""}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
