import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { API, apiError } from "@/lib/api";
import { useAuth, isStaff } from "@/context/AuthContext";
import { Navbar } from "@/components/qiveo/Navbar";
import UploadVersionModal from "@/components/qiveo/UploadVersionModal";
import { toast } from "sonner";
import {
  ArrowLeft, Settings, ShieldQuestion, Tags, FileText, GitBranch, Scale, Images, Link2,
  Users, BarChart3, Upload, Trash2, ExternalLink, ClipboardCheck, Check, X
} from "lucide-react";
import { GAME_CATEGORIES, getCategoryName } from "@/content/games";

const NAV = [
  ["general", "General", Settings], ["submit", "Submit for Review", ClipboardCheck], ["disclosures", "Disclosures", ShieldQuestion], ["tags", "Tags", Tags],
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
      nav(`/${item.category || "item"}/${slug}`);
    }
  }, [item, user, slug, nav]);
  if (item === false) return <div className="min-h-screen bg-transparent"><Navbar /><p className="text-warm p-10">Not found.</p></div>;
  if (!item) return <div className="min-h-screen bg-transparent"><Navbar /></div>;

  const save = async (patch) => { try { const { data } = await api.put(`/creator/mods/${item.id}`, patch); setItem((it) => ({ ...it, ...data })); toast.success("Saved"); } catch (e) { toast.error(apiError(e.response?.data?.detail)); } };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("/creator")} className="w-9 h-9 grid place-items-center rounded-lg border border-plumborder text-lavender2 hover:border-violet/60"><ArrowLeft className="w-4 h-4" /></button>
          <img src={item.icon} alt="" className="w-11 h-11 rounded-lg border border-plumborder bg-plum2 object-cover" />
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-extrabold text-warm text-lg truncate">{item.title}</h1>
            <p className="text-xs text-lavender2/50">Editing {getCategoryName(item.game_slug, item.category)} project · created {new Date(item.created_at).toLocaleDateString()}</p>
          </div>
          <Link to={`/${item.category || "item"}/${slug}`} data-testid="project-page-btn" className="inline-flex items-center gap-1.5 border border-plumborder text-lavender2 px-3 py-2 rounded-lg text-sm font-semibold hover:border-violet/60"><ExternalLink className="w-4 h-4" />Project page</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <aside className="bg-plum border border-plumborder rounded-2xl p-2 h-max">
            {NAV.map(([id, label, Icon]) => (
              <button key={id} data-testid={`edit-nav-${id}`} onClick={() => setSection(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${section === id ? "bg-coral/15 text-coral2 border-l-2 border-coral" : "text-lavender2/70 hover:bg-plum2 hover:text-warm border-l-2 border-transparent"}`}><Icon className="w-4 h-4" />{label}</button>
            ))}
          </aside>

          <main className="bg-plum border border-plumborder rounded-2xl p-6">
            {section === "general" && <General item={item} save={save} />}
            {section === "description" && <Description item={item} save={save} />}
            {section === "gallery" && <GallerySec item={item} onDone={load} />}
            {section === "versions" && <VersionsSec item={item} onUpload={() => setUploadOpen(true)} />}
            {section === "license" && <LicenseSec item={item} save={save} />}
            {section === "tags" && <TagsSec item={item} save={save} />}
            {section === "submit" && <SubmitSec item={item} onDone={load} />}
            {["disclosures", "links", "members", "analytics"].includes(section) && (
              <div className="text-center py-16 text-lavender2/40 font-mono">
                {section === "analytics" ? <Link to="/creator" className="text-coral2 underline">Open analytics dashboard →</Link> : `${section} — coming soon`}
              </div>
            )}
          </main>
        </div>
      </div>
      {uploadOpen && <UploadVersionModal mod={item} onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); load(); }} />}
    </div>
  );
}

function Field({ label, ...p }) {
  return <div><label className="block text-sm font-semibold text-warm mb-1.5">{label}</label><input {...p} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" /></div>;
}

function General({ item, save }) {
  const [name, setName] = useState(item.title);
  const [summary, setSummary] = useState(item.summary);
  const [visibility, setVisibility] = useState(item.visibility || "public");
  const [icon, setIcon] = useState(item.icon);
  const [mon, setMon] = useState(!!item.monetization);
  const [delOpen, setDelOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState("");
  const nav = useNavigate();

  const handleDelete = async () => {
    if (delConfirm !== item.slug && delConfirm !== item.title) return;
    try {
      await api.delete(`/creator/mods/${item.id}`);
      toast.success("Project deleted");
      nav("/creator");
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post(`/creator/mods/${item.id}/icon`, fd);
      setIcon(data.url);
      save({ icon: data.url });
      toast.success("Icon uploaded");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    }
  };

  return (
    <div className="space-y-5 max-w-xl relative">
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
          <div className="relative group">
            <img src={icon} alt="" className="w-20 h-20 rounded-2xl border-2 border-plumborder bg-plum2 object-cover" />
            <label className="absolute inset-0 bg-ink/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <Upload className="w-6 h-6 text-warm" />
              <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
            </label>
          </div>
          <div className="text-sm text-lavender2/60">
            <p>Click the image to upload a new icon.</p>
            <p className="text-xs mt-1">1:1 aspect ratio recommended.</p>
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
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center justify-between bg-ink border border-plumborder rounded-xl p-4">
            <div><p className="text-warm font-semibold text-sm">Monetization</p><p className="text-lavender2/50 text-xs">Earn from downloads. (UI preview — payments not enabled)</p></div>
            <button data-testid="mon-toggle" onClick={() => { setMon(!mon); save({ monetization: !mon }); }} className={`w-12 h-6 rounded-full border transition-colors ${mon ? "bg-mint border-mint" : "bg-plum2 border-plumborder"}`}><div className={`w-4 h-4 rounded-full bg-warm transition-transform ${mon ? "translate-x-6" : "translate-x-1"}`} /></button>
          </div>
          
          <div className="flex items-center justify-between bg-ink border border-rose/30 rounded-xl p-4">
            <div><p className="text-warm font-semibold text-sm">Delete Project</p><p className="text-lavender2/50 text-xs">Permanently delete this project and all files.</p></div>
            <button onClick={() => setDelOpen(true)} className="bg-rose/10 text-rose border border-rose/30 hover:bg-rose/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors">Delete</button>
          </div>
        </div>
      </div>

      {delOpen && (
        <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-4">
          <div className="bg-plum border border-rose/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="font-heading text-xl font-bold text-rose mb-2">Delete Project?</h2>
            <p className="text-sm text-lavender2/80 mb-4">This action is irreversible. It will permanently delete this project, all uploaded versions, gallery images, stats, and comments.</p>
            <p className="text-sm text-warm mb-3">Type <strong className="font-mono bg-ink px-1.5 py-0.5 rounded text-coral2">{item.slug}</strong> to confirm.</p>
            <input value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} className="w-full bg-ink border border-plumborder rounded-lg px-3 py-2.5 text-warm text-sm font-mono focus:outline-none focus:border-rose focus:ring-1 focus:ring-rose mb-5" placeholder={item.slug} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-lavender2 hover:text-warm">Cancel</button>
              <button onClick={handleDelete} disabled={delConfirm !== item.slug} className="bg-rose text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">Delete Forever</button>
            </div>
          </div>
        </div>
      )}
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
  const [game, setGame] = useState(item.game_slug || "minecraft");
  const [category, setCategory] = useState(item.category || "plugins");

  const saveTags = () => {
    save({ 
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      game_slug: game,
      category: category
    });
  };

  return (
    <div className="max-w-md space-y-5 bg-[#24201A] border border-[#92400E] rounded-3xl p-6">
      <h2 className="font-heading font-black text-[#FFF8E1] text-xl">Classification & Tags</h2>
      
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-widest text-[#FFF8E1]/50 mb-1.5 font-bold">Game / Platform</label>
        <select value={game} onChange={(e) => { setGame(e.target.value); setCategory(GAME_CATEGORIES[e.target.value]?.[0]?.id || ""); }} className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors">
          {Object.keys(GAME_CATEGORIES).map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-widest text-[#FFF8E1]/50 mb-1.5 font-bold">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors">
          {(GAME_CATEGORIES[game] || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-widest text-[#FFF8E1]/50 mb-1.5 font-bold">Tags (comma separated)</label>
        <input data-testid="edit-tags" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full bg-[#171512] border border-[#92400E] rounded-xl px-4 py-3 text-[#FFF8E1] text-sm focus:outline-none focus:border-[#F5C542] transition-colors" />
      </div>

      <div className="pt-2">
        <button data-testid="edit-tags-save" onClick={saveTags} className="w-full bg-[#F5C542] text-[#171512] px-5 py-3 rounded-full text-sm font-bold hover:bg-[#FFD84D] transition-colors">Save classification</button>
      </div>
    </div>
  );
}

function SubmitSec({ item, onDone }) {
  const versions = item.versions || [];
  const hasVersions = versions.length > 0;
  const hasSummary = (item.summary || "").length >= 20;
  const hasDesc = (item.description || "").length >= 100;
  const hasIcon = item.icon && !item.icon.includes("api.dicebear.com");
  const hasCategory = !!item.category;
  const hasLoaders = (item.mod_loaders || []).length > 0 || versions.some(v => (v.mod_loaders || []).length > 0);
  
  const allGood = hasVersions && hasSummary && hasDesc && hasIcon && hasCategory && hasLoaders;
  const [loading, setLoading] = useState(false);
  const [containsAi, setContainsAi] = useState(!!item.contains_ai);

  const submit = async () => {
    if (!allGood) return;
    setLoading(true);
    try {
      await api.put(`/creator/mods/${item.id}`, { contains_ai: containsAi });
      await api.post(`/creator/mods/${item.id}/submit`);
      toast.success("Submitted for review!");
      onDone();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    }
    setLoading(false);
  };

  if (item.status !== "draft") {
    return (
      <div className="text-center py-16">
        <h2 className="font-heading font-bold text-warm text-2xl mb-2">Project is {item.status.replace("_", " ")}</h2>
        <p className="text-lavender2/60">This project has already been submitted.</p>
      </div>
    );
  }

  const Req = ({ ok, text }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${ok ? "bg-moss/10 border-moss/30 text-moss" : "bg-ink border-plumborder text-warm"}`}>
      {ok ? <Check className="w-5 h-5" /> : <X className="w-5 h-5 text-rust" />}
      <span className="text-sm font-semibold">{text}</span>
    </div>
  );

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="font-heading font-bold text-warm text-lg">Pre-Submission Checklist</h2>
      <p className="text-sm text-lavender2/80">Complete all requirements before submitting your project for review.</p>
      <div className="space-y-3">
        <Req ok={hasVersions} text="Upload at least 1 version file" />
        <Req ok={hasSummary} text="Summary is at least 20 characters" />
        <Req ok={hasDesc} text="Description is at least 100 characters" />
        <Req ok={hasIcon} text="Upload a custom project icon" />
        <Req ok={hasCategory} text="Select a category" />
        <Req ok={hasLoaders} text="Select at least 1 mod loader or platform" />
      </div>

      <div className="bg-ink border border-plumborder rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={containsAi} 
            onChange={(e) => setContainsAi(e.target.checked)} 
            className="mt-1 w-4 h-4 rounded border-plumborder text-coral focus:ring-coral bg-transparent"
          />
          <div>
            <p className="text-sm font-bold text-warm">Contains AI-Generated Content</p>
            <p className="text-xs text-lavender2/60 mt-0.5">Check this if your project includes code, assets, or descriptions generated by AI tools.</p>
          </div>
        </label>
      </div>
      <button 
        disabled={!allGood || loading} 
        onClick={submit} 
        className="w-full bg-coral text-ink py-3 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-transform"
      >
        Submit for Review
      </button>
    </div>
  );
}
