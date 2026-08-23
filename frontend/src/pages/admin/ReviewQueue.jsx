import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { fmt } from "@/components/kivo/ModCard";
import { Check, X, AlertTriangle, ShieldAlert, GitCompare, FileArchive } from "lucide-react";

export default function ReviewQueue() {
  const [data, setData] = useState({ mods: [], versions: [] });
  const [diff, setDiff] = useState(null);
  const [reasonFor, setReasonFor] = useState(null);

  const load = () => api.get("/admin/queue").then((r) => setData(r.data)).catch((e) => toast.error(apiError(e.response?.data?.detail)));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const moderate = async (type, id, action, reason = "") => {
    try {
      await api.post(`/admin/${type}/${id}/moderate`, { action, reason });
      toast.success(`[${action.toUpperCase()}] ${type} ${id.slice(0, 8)}`);
      setReasonFor(null); load();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const openDiff = (v) => api.get(`/admin/versions/${v.id}/diff`).then((r) => setDiff(r.data)).catch((e) => toast.error(apiError(e.response?.data?.detail)));

  const empty = data.mods.length === 0 && data.versions.length === 0;

  return (
    <div>
      <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm mb-1">Review Queue</h1>
      <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-8">// every submission &amp; new version requires review</p>

      {empty && <div className="border border-dashed border-slate-light p-12 text-center text-warm/40 font-mono">Queue clear. No pending items.</div>}

      {data.mods.length > 0 && (
        <>
          <h3 className="font-mono text-xs uppercase tracking-widest text-amber mb-3">New Mods · {data.mods.length}</h3>
          <div className="border border-slate-light divide-y divide-slate-light mb-8">
            {data.mods.map((m) => (
              <QueueRow key={m.id} title={m.title} sub={`by ${m.author_name} · ${m.category}`} tag={m.game_name}
                testid={`queue-mod-${m.slug}`}
                onApprove={() => moderate("mods", m.id, "approve")}
                onReject={() => setReasonFor({ type: "mods", id: m.id, action: "reject", title: m.title })}
                onChanges={() => setReasonFor({ type: "mods", id: m.id, action: "request_changes", title: m.title })}
                onQuarantine={() => setReasonFor({ type: "mods", id: m.id, action: "quarantine", title: m.title })} />
            ))}
          </div>
        </>
      )}

      {data.versions.length > 0 && (
        <>
          <h3 className="font-mono text-xs uppercase tracking-widest text-amber mb-3">New Versions · {data.versions.length}</h3>
          <div className="border border-slate-light divide-y divide-slate-light">
            {data.versions.map((v) => (
              <QueueRow key={v.id} title={`${v.mod_title} · v${v.version_number}`} sub={`${v.file_name} · ${fmt(v.file_size)}B · ${v.detected_type}`} tag={v.mod_loaders.join(",")}
                testid={`queue-version-${v.id}`}
                onDiff={() => openDiff(v)}
                onApprove={() => moderate("versions", v.id, "approve")}
                onReject={() => setReasonFor({ type: "versions", id: v.id, action: "reject", title: v.mod_title })}
                onChanges={() => setReasonFor({ type: "versions", id: v.id, action: "request_changes", title: v.mod_title })}
                onQuarantine={() => setReasonFor({ type: "versions", id: v.id, action: "quarantine", title: v.mod_title })} />
            ))}
          </div>
        </>
      )}

      {diff && <DiffModal diff={diff} onClose={() => setDiff(null)} />}
      {reasonFor && <ReasonModal info={reasonFor} onClose={() => setReasonFor(null)} onSubmit={(reason) => moderate(reasonFor.type, reasonFor.id, reasonFor.action, reason)} />}
    </div>
  );
}

function QueueRow({ title, sub, tag, testid, onApprove, onReject, onChanges, onQuarantine, onDiff }) {
  return (
    <div data-testid={testid} className="flex items-center gap-4 p-3 hover:bg-slate/50 flex-wrap">
      <FileArchive className="w-5 h-5 text-warm/30 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm text-warm truncate">{title}</p>
        <p className="font-mono text-[11px] text-warm/40 truncate">{sub}</p>
      </div>
      {tag && <span className="font-mono text-[10px] uppercase border border-slate-light text-warm/50 px-1.5 py-0.5">{tag}</span>}
      <div className="flex items-center gap-1.5">
        {onDiff && <IconBtn testid={`${testid}-diff`} onClick={onDiff} title="Diff" cls="border-teal text-teal-light"><GitCompare className="w-4 h-4" /></IconBtn>}
        <IconBtn testid={`${testid}-approve`} onClick={onApprove} title="Approve" cls="border-moss text-moss hover:bg-moss hover:text-charcoal"><Check className="w-4 h-4" /></IconBtn>
        <IconBtn testid={`${testid}-changes`} onClick={onChanges} title="Request changes" cls="border-mustard text-mustard hover:bg-mustard hover:text-charcoal"><AlertTriangle className="w-4 h-4" /></IconBtn>
        <IconBtn testid={`${testid}-reject`} onClick={onReject} title="Reject" cls="border-rust text-rust hover:bg-rust hover:text-warm"><X className="w-4 h-4" /></IconBtn>
        <IconBtn testid={`${testid}-quarantine`} onClick={onQuarantine} title="Quarantine" cls="border-rust text-rust hover:bg-rust hover:text-warm"><ShieldAlert className="w-4 h-4" /></IconBtn>
      </div>
    </div>
  );
}

const IconBtn = ({ children, testid, onClick, title, cls }) => (
  <button data-testid={testid} onClick={onClick} title={title} className={`w-8 h-8 grid place-items-center border transition-colors ${cls}`}>{children}</button>
);

function DiffModal({ diff, onClose }) {
  const cur = diff.current, prev = diff.previous;
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const line = (label, a, b) => {
    const changed = String(a) !== String(b);
    return (
      <div className="grid grid-cols-2 gap-4 border-b border-slate-light/50 py-1.5">
        <span className={changed && prev ? "text-rust" : "text-warm/50"}>{prev ? `${label}: ${a ?? "—"}` : ""}</span>
        <span className={changed ? "text-moss" : "text-warm/50"}>{label}: {b ?? "—"}</span>
      </div>
    );
  };
  return (
    <div className="fixed inset-0 z-[60] bg-ink/85 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-plum border border-plumborder rounded-2xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-plumborder">
          <h3 className="font-mono text-sm uppercase tracking-widest text-coral2 flex items-center gap-2"><GitCompare className="w-4 h-4" />Version Diff · {cur.mod_title}</h3>
          <button data-testid="close-diff" onClick={onClose} className="text-lavender2/50 hover:text-rose"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 font-mono text-xs">
          <div className="grid grid-cols-2 gap-4 mb-3 text-[10px] uppercase tracking-widest">
            <span className="text-rust">— previous {prev ? `v${prev.version_number}` : "(none)"}</span>
            <span className="text-moss">+ current v{cur.version_number}</span>
          </div>
          {line("version", prev?.version_number, cur.version_number)}
          {line("file", prev?.file_name, cur.file_name)}
          {line("size", prev ? fmt(prev.file_size) + "B" : null, fmt(cur.file_size) + "B")}
          {line("type", prev?.detected_type, cur.detected_type)}
          {line("loaders", prev?.mod_loaders?.join(","), cur.mod_loaders.join(","))}
          {line("game_versions", prev?.game_versions?.join(","), cur.game_versions.join(","))}
          {line("dependencies", prev?.dependencies?.join(","), cur.dependencies.join(","))}
          <div className="mt-4 bg-slate border border-slate-light p-3">
            <p className="text-warm/40 uppercase text-[10px] tracking-widest mb-1">changelog</p>
            <p className="text-warm/80">{cur.changelog || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReasonModal({ info, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const templates = {
    reject: ["Contains obfuscated code", "Copyright / ripped assets", "Malware signature match", "Spam / low effort"],
    request_changes: ["Missing changelog", "Incompatible metadata", "Please declare all dependencies"],
    quarantine: ["Pending malware detonation", "Suspicious outbound network calls", "Awaiting T&S escalation"],
  };
  return (
    <div className="fixed inset-0 z-[60] bg-ink/85 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-plum border border-plumborder rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-plumborder">
          <h3 className="font-mono text-sm uppercase tracking-widest text-warm">{info.action.replace("_", " ")} · {info.title}</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {(templates[info.action] || []).map((t) => (
              <button key={t} onClick={() => setReason(t)} className="font-mono text-[10px] rounded-full border border-plumborder text-lavender2/60 px-2.5 py-1 hover:border-coral hover:text-coral2 transition-colors">{t}</button>
            ))}
          </div>
          <textarea data-testid="moderation-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason (sent to creator & logged)"
            className="w-full bg-ink border border-plumborder rounded-xl p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
          <div className="flex gap-2">
            <button data-testid="cancel-reason" onClick={onClose} className="flex-1 border border-plumborder text-warm py-2 rounded-full font-mono text-xs uppercase">Cancel</button>
            <button data-testid="confirm-reason" onClick={() => onSubmit(reason)} className="flex-1 bg-rose text-warm py-2 rounded-full font-mono text-xs uppercase tracking-wide">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}
