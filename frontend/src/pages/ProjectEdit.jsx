import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { API, apiError } from "@/lib/api";
import { useAuth, isStaff } from "@/context/AuthContext";
import { Navbar } from "@/components/qiveo/Navbar";
import UploadVersionModal from "@/components/qiveo/UploadVersionModal";
import { toast } from "sonner";
import {
  ArrowLeft, Settings, ShieldQuestion, Tags, FileText, GitBranch, Scale, Images, Link2,
  Users, BarChart3, Upload, Trash2, ExternalLink,
} from "lucide-react";

import { Footer } from "@/pages/Home";

const NAV = [
  ["general", "General", Settings], ["disclosures", "Disclosures", ShieldQuestion], ["tags", "Tags", Tags],
  ["description", "Description", FileText], ["versions", "Versions", GitBranch], ["license", "License", Scale],
  ["gallery", "Gallery", Images], ["links", "Links", Link2], ["members", "Members", Users], ["analytics", "Analytics", BarChart3],
];
const VIS = ["public", "unlisted", "private"];

export default function ProjectEdit() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [section, setSection] = useState("general");
  const [uploadOpen, setUploadOpen] = useState(false);

  const load = () => api.get(`/mods/${slug}`).then((r) => setItem(r.data)).catch(() => setItem(false));
  useEffect(() => { load(); }, [slug]);
  useEffect(() => {
    if (item && user && item.author_id !== user.id && !isStaff(user)) {
      toast.error("You don't own this project");
      nav(`/item/${slug}`);
    }
  }, [item, user, slug, nav]);
  if (item === false) return <div className="min-h-screen flex flex-col bg-transparent"><Navbar /><div className="flex-1 p-10"><p className="text-warm">Not found.</p></div><Footer /></div>;
  if (!item) return <div className="min-h-screen bg-transparent"><Navbar /></div>;

  const save = async (patch) => { try { const { data } = await api.put(`/creator/mods/${item.id}`, patch); setItem((it) => ({ ...it, ...data })); toast.success("Saved"); } catch (e) { toast.error(apiError(e.response?.data?.detail)); } };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("/creator")} className="w-9 h-9 grid place-items-center rounded-lg border border-plumborder text-lavender2 hover:border-violet/60"><ArrowLeft className="w-4 h-4" /></button>
          <img src={item.icon} alt="" className="w-11 h-11 rounded-lg border border-plumborder bg-plum2 object-cover" />
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-extrabold text-warm text-lg truncate">{item.title}</h1>
            <p className="text-xs text-lavender2/50">Editing {item.item_type?.toLowerCase()} project · created {new Date(item.created_at).toLocaleDateString()}</p>
          </div>
          <Link to={`/item/${slug}`} data-testid="project-page-btn" className="inline-flex items-center gap-1.5 border border-plumborder text-lavender2 px-3 py-2 rounded-lg text-sm font-semibold hover:border-violet/60"><ExternalLink className="w-4 h-4" />Project page</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="bg-plum border border-plumborder rounded-2xl p-2 h-max">
            {NAV.map(([id, label, Icon]) => (
              <button key={id} data-testid={`edit-nav-${id}`} onClick={() => setSection(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${section === id ? "bg-coral/15 text-coral2 border-l-2 border-coral" : "text-lavender2/70 hover:bg-plum2 hover:text-warm border-l-2 border-transparent"}`}><Icon className="w-4 h-4" />{label}</button>
            ))}
          </aside>

          <main className="bg-plum border border-plumborder rounded-2xl p-6">
            {section === "general" && <General item={item} save={save} load={load} />}
            {section === "description" && <Description item={item} save={save} />}
            {section === "gallery" && <GallerySec item={item} onDone={load} />}
            {section === "versions" && <VersionsSec item={item} onUpload={() => setUploadOpen(true)} />}
            {section === "license" && <LicenseSec item={item} save={save} />}
            {section === "tags" && <TagsSec item={item} save={save} />}
            {["disclosures", "links", "members", "analytics"].includes(section) && (
              <div className="text-center py-16 text-lavender2/40 font-mono">
                {section === "analytics" ? <Link to="/creator" className="text-coral2 underline">Open analytics dashboard →</Link> : `${section} — coming soon`}
              </div>
            )}
          </main>
        </div>
      </div>
      {uploadOpen && <UploadVersionModal mod={item} onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); load(); }} />}
      <Footer />
    </div>
  );
}

function Field({ label, ...p }) {
  return <div><label className="block text-sm font-semibold text-warm mb-1.5">{label}</label><input {...p} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" /></div>;
}

function General({ item, save, load }) {
  const [name, setName] = useState(item.title);
  const [summary, setSummary] = useState(item.summary);
  const [visibility, setVisibility] = useState(item.visibility || "public");
  const [icon, setIcon] = useState(item.icon);
  const [mon, setMon] = useState(!!item.monetization);
  const [uploading, setUploading] = useState(false);

  const handleIconUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    setUploading(true);
    try {
      const { data } = await api.post(`/creator/mods/${item.id}/icon`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setIcon(data.url);
      toast.success("Icon updated successfully");
      load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="font-heading font-bold text-warm text-lg">Project information</h2>
      <Field label="Name" data-testid="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
      <div>
        <label className="block text-sm font-semibold text-warm mb-1.5">URL</label>
        <div className="flex rounded-lg border border-plumborder overflow-hidden bg-ink"><span className="px-3 py-2.5 bg-plum2 text-lavender2/50 text-sm font-mono border-r border-plumborder">qiveo.app/project/</span><span className="px-3 py-2.5 text-lavender2 text-sm font-mono">{item.slug}</span></div>
      </div>
      <div><label className="block text-sm font-semibold text-warm mb-1.5">Summary</label><textarea data-testid="edit-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" /></div>
      <div>
        <label className="block text-sm font-semibold text-warm mb-1.5">Icon</label>
        <div className="flex items-center gap-4">
          <img src={icon.startsWith("http") ? icon : `${API.replace("/api", "")}${icon}`} alt="" className="w-16 h-16 rounded-lg border border-plumborder bg-plum2 object-cover shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <label className="bg-violet/15 border border-violet/40 text-lavender2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-violet/25 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? "Uploading..." : "Change Icon"}
                <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={uploading} />
              </label>
              <button 
                type="button" 
                onClick={() => {
                  const defaultIcon = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.slug}`;
                  setIcon(defaultIcon);
                  save({ icon: defaultIcon });
                }}
                className="bg-rose/15 border border-rose/40 text-rose py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-rose/25 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Icon
              </button>
            </div>
            <p className="text-[10px] text-lavender2/50 font-mono">Recommended size: 256x256. Supports PNG, JPG, WEBP.</p>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm mb-1.5">Visibility</label>
        <select data-testid="edit-visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet">{VIS.map((v) => <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>)}</select>
      </div>
      <button data-testid="edit-save" onClick={() => save({ name, summary, visibility, icon })} className="bg-coral text-ink px-5 py-2.5 rounded-lg font-bold hover:-translate-y-0.5 transition-transform">Save changes</button>

      {/* Danger zone */}
      <div className="pt-6 mt-6 border-t border-rose/30">
        <h3 className="font-heading font-bold text-rose flex items-center gap-2">Danger zone</h3>
        <div className="flex items-center justify-between bg-ink border border-plumborder rounded-xl p-4 mt-3">
          <div><p className="text-warm font-semibold text-sm">Monetization</p><p className="text-lavender2/50 text-xs">Earn from downloads. (UI preview — payments not enabled)</p></div>
          <button data-testid="mon-toggle" onClick={() => { setMon(!mon); save({ monetization: !mon }); }} className={`w-12 h-6 rounded-full border transition-colors ${mon ? "bg-mint border-mint" : "bg-plum2 border-plumborder"}`}><div className={`w-4 h-4 rounded-full bg-warm transition-transform ${mon ? "translate-x-6" : "translate-x-1"}`} /></button>
        </div>
      </div>
    </div>
  );
}

function Description({ item, save }) {
  const [desc, setDesc] = useState(item.description);
  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-warm text-lg">Description (Markdown)</h2>
      <textarea data-testid="edit-description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={16} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet" />
      <button data-testid="edit-desc-save" onClick={() => save({ description: desc })} className="bg-coral text-ink px-5 py-2.5 rounded-lg font-bold">Save description</button>
    </div>
  );
}

function GallerySec({ item, onDone }) {
  const upload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    try { await api.post(`/creator/mods/${item.id}/gallery`, fd, { headers: { "Content-Type": "multipart/form-data" } }); toast.success("Image added"); onDone(); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  return (
    <div>
      <h2 className="font-heading font-bold text-warm text-lg mb-4">Gallery</h2>
      <label data-testid="gallery-upload" className="inline-flex items-center gap-2 bg-violet/15 border border-violet/40 text-lavender2 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-violet/25"><Upload className="w-4 h-4" />Upload image<input type="file" accept="image/*" className="hidden" onChange={upload} /></label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {(item.gallery || []).map((g, i) => <img key={i} src={g.startsWith("http") ? g : `${API.replace("/api", "")}${g}`} alt="" className="rounded-xl border border-plumborder w-full aspect-video object-cover" />)}
        {(item.gallery || []).length === 0 && <p className="text-lavender2/40 font-mono col-span-full py-8 text-center">No images yet.</p>}
      </div>
    </div>
  );
}

function VersionsSec({ item, onUpload }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4"><h2 className="font-heading font-bold text-warm text-lg">Versions</h2><button data-testid="add-version-btn" onClick={onUpload} className="bg-coral text-ink px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5"><Upload className="w-4 h-4" />Upload file</button></div>
      <div className="space-y-2">
        {(item.versions || []).map((v) => <div key={v.id} className="flex items-center justify-between bg-ink border border-plumborder rounded-xl p-3"><span className="font-mono font-bold text-coral2">v{v.version_number}</span><span className="text-xs font-mono text-lavender2/50">{v.file_name}</span></div>)}
        {(item.versions || []).length === 0 && <p className="text-lavender2/40 font-mono py-6 text-center">No versions. Upload your first file.</p>}
      </div>
    </div>
  );
}

const LICENSES = ["MIT", "Apache-2.0", "GPL-3.0", "LGPL-3.0", "CC-BY-4.0", "All Rights Reserved"];
function LicenseSec({ item, save }) {
  const [lic, setLic] = useState(item.license || "MIT");
  return (
    <div className="max-w-md space-y-4">
      <h2 className="font-heading font-bold text-warm text-lg">License</h2>
      <select data-testid="edit-license" value={lic} onChange={(e) => setLic(e.target.value)} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm">{LICENSES.map((l) => <option key={l}>{l}</option>)}</select>
      <button data-testid="edit-license-save" onClick={() => save({ license: lic })} className="bg-coral text-ink px-5 py-2.5 rounded-lg font-bold">Save</button>
    </div>
  );
}

function TagsSec({ item, save }) {
  const [tags, setTags] = useState((item.tags || []).join(", "));
  return (
    <div className="max-w-md space-y-4">
      <h2 className="font-heading font-bold text-warm text-lg">Tags</h2>
      <Field label="Tags (comma separated)" data-testid="edit-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
      <button data-testid="edit-tags-save" onClick={() => save({ tags: tags.split(",").map((t) => t.trim()).filter(Boolean) })} className="bg-coral text-ink px-5 py-2.5 rounded-lg font-bold">Save</button>
    </div>
  );
}
