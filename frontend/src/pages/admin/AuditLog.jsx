import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { ScrollText, Lock } from "lucide-react";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get("/admin/audit").then((r) => setLogs(r.data)).catch((e) => toast.error(apiError(e.response?.data?.detail))); }, []);

  return (
    <div>
      <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm mb-1 flex items-center gap-2"><Lock className="w-6 h-6 text-teal-light" />Audit Log</h1>
      <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-6">// immutable · who / what / when</p>

      <div className="bg-charcoal border border-slate-light font-mono text-xs">
        <div className="grid grid-cols-[160px_1fr_1fr_1fr] gap-2 px-4 py-2 border-b border-slate-light text-warm/40 uppercase tracking-widest text-[10px] sticky top-0 bg-charcoal">
          <span>Timestamp</span><span>Actor</span><span>Action</span><span>Target</span>
        </div>
        <div className="divide-y divide-slate-light/50 max-h-[70vh] overflow-y-auto">
          {logs.length === 0 && <div className="p-8 text-center text-warm/40 flex items-center justify-center gap-2"><ScrollText className="w-4 h-4" />No entries.</div>}
          {logs.map((l) => (
            <div key={l.id} data-testid={`audit-${l.id}`} className="grid grid-cols-[160px_1fr_1fr_1fr] gap-2 px-4 py-2 hover:bg-slate/40">
              <span className="text-warm/50">{new Date(l.created_at).toLocaleString()}</span>
              <span className="text-teal-light truncate">{l.actor_name} <span className="text-warm/30">[{l.actor_role}]</span></span>
              <span className="text-amber truncate">{l.action}</span>
              <span className="text-warm/60 truncate">{l.target_type}:{String(l.target_id).slice(0, 8)}{l.after?.reason ? ` · "${l.after.reason}"` : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
