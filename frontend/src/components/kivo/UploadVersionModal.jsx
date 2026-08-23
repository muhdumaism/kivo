import { useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { X, UploadCloud, FileArchive } from "lucide-react";

export default function UploadVersionModal({ mod, onClose, onDone }) {
  const [form, setForm] = useState({ version_number: "", changelog: "", game_versions: "", mod_loaders: "", dependencies: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!file) return toast.error("[ERROR] Select a mod file");
    if (!form.version_number) return toast.error("[ERROR] Version number required");
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("file", file);
      await api.post(`/creator/mods/${mod.id}/versions`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`[UPLOAD] ${mod.title} v${form.version_number} → review queue`);
      onDone();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-charcoal/80 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-slate border border-slate-light w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-light">
          <h3 className="font-heading font-bold text-warm">Upload Version · {mod.title}</h3>
          <button data-testid="close-upload-modal" onClick={onClose} className="text-warm/50 hover:text-rust"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <label data-testid="file-dropzone" className="block border border-dashed border-slate-light p-6 text-center cursor-pointer hover:border-amber transition-colors">
            <input data-testid="version-file-input" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            {file ? <span className="flex items-center justify-center gap-2 font-mono text-sm text-teal-light"><FileArchive className="w-4 h-4" />{file.name}</span>
              : <span className="flex items-center justify-center gap-2 font-mono text-sm text-warm/50"><UploadCloud className="w-5 h-5" />Drop or select .jar / .zip file</span>}
            <p className="font-mono text-[10px] text-warm/30 mt-1">Stored compressed · 200MB max · enters the staff review queue.</p>
          </label>
          <Field label="Version Number" testid="version-number" value={form.version_number} onChange={set("version_number")} placeholder="1.2.0" mono />
          <Field label="Game Versions (comma sep)" testid="version-gv" value={form.game_versions} onChange={set("game_versions")} placeholder="1.21.4, 1.20.1" mono />
          <Field label="Mod Loaders (comma sep)" testid="version-loaders" value={form.mod_loaders} onChange={set("mod_loaders")} placeholder="Fabric, Quilt" mono />
          <Field label="Dependencies (comma sep)" testid="version-deps" value={form.dependencies} onChange={set("dependencies")} placeholder="fabric-api" mono />
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">Changelog</label>
            <textarea data-testid="version-changelog" value={form.changelog} onChange={set("changelog")} rows={3} className="w-full bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
          </div>
        </div>
        <div className="p-5 border-t border-slate-light">
          <button data-testid="submit-version-btn" onClick={submit} disabled={busy} className="w-full bg-amber text-charcoal py-3 font-mono font-bold uppercase tracking-wide hover:-translate-y-0.5 transition-transform disabled:opacity-50">
            {busy ? "Uploading..." : "Upload Version"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, testid, value, onChange, placeholder, mono }) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-widest text-warm/50 mb-1.5">{label}</label>
      <input data-testid={testid} value={value} onChange={onChange} placeholder={placeholder} className={`w-full bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber ${mono ? "font-mono" : ""}`} />
    </div>
  );
}
