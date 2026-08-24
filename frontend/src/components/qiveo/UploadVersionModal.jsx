import { useState, useEffect } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { CornerFrame } from "@/components/qiveo/CornerFrame";
import { X, UploadCloud, FileArchive } from "lucide-react";

export default function UploadVersionModal({ mod, onClose, onDone }) {
  const [form, setForm] = useState({ version_number: "", changelog: "", game_versions: "", mod_loaders: "", dependencies: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <CornerFrame color="coral" className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] text-[#E9D5FF]" onClick={(e) => e.stopPropagation()}>
      <div className="w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b-2 border-[#E9D5FF]">
          <h3 className="font-heading font-bold text-warm">Upload file · {mod.title}</h3>
          <button data-testid="close-upload-modal" onClick={onClose} className="text-lavender2/50 hover:text-rose"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <label data-testid="file-dropzone" className="block border border-dashed border-[#E9D5FF]/40 rounded-xl p-6 text-center cursor-pointer hover:border-coral transition-colors">
            <input data-testid="version-file-input" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            {file ? <span className="flex items-center justify-center gap-2 font-mono text-sm text-lavender2"><FileArchive className="w-4 h-4" />{file.name}</span>
              : <span className="flex items-center justify-center gap-2 font-mono text-sm text-lavender2/50"><UploadCloud className="w-5 h-5" />Drop or select .zip / .jar file</span>}
            <p className="font-mono text-[10px] text-lavender2/30 mt-1">Stored compressed · 200MB max · enters the review queue.</p>
          </label>
          <Field label="Version Number" testid="version-number" value={form.version_number} onChange={set("version_number")} placeholder="1.2.0" mono />
          <Field label="Game Versions (comma sep)" testid="version-gv" value={form.game_versions} onChange={set("game_versions")} placeholder="1.21.4, 1.20.1" mono />
          <Field label="Mod Loaders (comma sep)" testid="version-loaders" value={form.mod_loaders} onChange={set("mod_loaders")} placeholder="Fabric, Quilt" mono />
          <Field label="Dependencies (comma sep)" testid="version-deps" value={form.dependencies} onChange={set("dependencies")} placeholder="fabric-api" mono />
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-lavender2/50 mb-1.5">Changelog</label>
            <textarea data-testid="version-changelog" value={form.changelog} onChange={set("changelog")} rows={3} className="w-full bg-ink border border-plumborder rounded-xl p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
          </div>
        </div>
        <div className="p-5 border-t-2 border-[#E9D5FF]">
          <button data-testid="submit-version-btn" onClick={submit} disabled={busy} className="shine w-full bg-coral text-ink py-3 rounded-full font-bold hover:-translate-y-0.5 transition-transform disabled:opacity-50">
            {busy ? "Uploading..." : "Upload file"}
          </button>
        </div>
      </div>
      </CornerFrame>
    </div>
  );
}

function Field({ label, testid, value, onChange, placeholder, mono }) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-widest text-lavender2/50 mb-1.5">{label}</label>
      <input data-testid={testid} value={value} onChange={onChange} placeholder={placeholder} className={`w-full bg-ink border border-plumborder rounded-xl p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet ${mono ? "font-mono" : ""}`} />
    </div>
  );
}
