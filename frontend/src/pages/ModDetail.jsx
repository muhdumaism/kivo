import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { API, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/qiveo/Navbar";
import { StatusBadge, VerifiedBadge } from "@/components/qiveo/Badges";
import { renderMarkdown } from "@/lib/md";
import { fmt } from "@/components/qiveo/ModCard";
import { toast } from "sonner";
import { Download, Star, Tag, Scale, Layers, GitBranch, Flag, MessageSquare, Send } from "lucide-react";

const TABS = ["Description", "Versions", "Reviews", "Comments"];

export default function ModDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [mod, setMod] = useState(null);
  const [tab, setTab] = useState("Description");
  const [comments, setComments] = useState([]);

  const reload = () => api.get(`/mods/${slug}`).then((r) => setMod(r.data));
  useEffect(() => { reload(); api.get(`/mods/${slug}/comments`).then((r) => setComments(r.data)); }, [slug]);

  if (!mod) return <div className="min-h-screen bg-transparent"><Navbar /></div>;

  const latest = mod.versions?.[0];

  const download = () => {
    if (!latest) return toast.error("[ERROR] No approved version available");
    window.open(`${API}/download/${latest.id}`, "_blank");
    toast.success(`[DOWNLOAD] ${mod.title} ${latest.version_number}`);
    setTimeout(reload, 1200);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Main */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <img src={mod.icon} alt={mod.title} className="w-20 h-20 border border-slate-light bg-slate" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-3xl lg:text-4xl font-black uppercase tracking-tighter text-warm">{mod.title}</h1>
                {mod.staff_pick && <span className="font-mono text-[10px] uppercase tracking-widest border border-amber text-amber px-1.5 py-0.5">Staff Pick</span>}
              </div>
              <p className="flex items-center gap-1.5 text-warm/60 font-mono text-sm mt-1">by {mod.author_name}{mod.author_verified && <VerifiedBadge />}</p>
              <p className="text-warm/70 mt-2">{mod.summary}</p>
            </div>
          </div>

          <div className="flex gap-1 border-b border-slate mt-8">
            {TABS.map((t) => (
              <button key={t} data-testid={`tab-${t.toLowerCase()}`} onClick={() => setTab(t)}
                className={`px-4 py-2 font-mono text-sm uppercase tracking-wide border-b-2 -mb-px transition-colors ${tab === t ? "border-amber text-amber" : "border-transparent text-warm/50 hover:text-warm"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="py-6">
            {tab === "Description" && <div className="prose prose-invert max-w-none prose-headings:font-heading prose-headings:font-black prose-headings:text-[#E9D5FF] prose-p:text-[#E9D5FF]/80 prose-a:text-amber prose-a:underline hover:prose-a:text-[#E9D5FF] prose-strong:text-[#E9D5FF] prose-code:text-amber prose-code:bg-[#15141E] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#15141E] prose-pre:border-2 prose-pre:border-[#E9D5FF] prose-pre:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] prose-img:rounded-xl prose-img:border-2 prose-img:border-[#E9D5FF] prose-img:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] prose-ul:list-disc prose-ol:list-decimal prose-li:text-[#E9D5FF]/80 prose-blockquote:border-l-4 prose-blockquote:border-amber prose-blockquote:text-[#E9D5FF]/60 prose-blockquote:font-mono prose-blockquote:italic prose-table:border-collapse prose-th:border prose-th:border-[#E9D5FF]/20 prose-th:p-2 prose-td:border prose-td:border-[#E9D5FF]/20 prose-td:p-2 font-medium text-[#E9D5FF]" dangerouslySetInnerHTML={{ __html: renderMarkdown(mod.description) }} />}
            {tab === "Versions" && <Versions versions={mod.versions} />}
            {tab === "Reviews" && <Reviews mod={mod} user={user} onDone={reload} />}
            {tab === "Comments" && <Comments slug={slug} comments={comments} user={user} onDone={() => api.get(`/mods/${slug}/comments`).then((r) => setComments(r.data))} />}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-slate border border-slate-light p-5 lg:sticky lg:top-20">
            <button data-testid="download-btn" onClick={download} disabled={!latest}
              className="w-full flex items-center justify-center gap-2 bg-amber text-charcoal py-3 font-mono font-bold uppercase tracking-wide hover:-translate-y-0.5 transition-transform hard-shadow-teal disabled:opacity-40">
              <Download className="w-5 h-5" /> Download {latest ? latest.version_number : ""}
            </button>
            <div className="grid grid-cols-2 gap-3 mt-5 font-mono text-sm">
              <Stat icon={Download} label="Downloads" value={fmt(mod.downloads)} />
              <Stat icon={Star} label="Rating" value={`${mod.rating_avg || "—"} (${mod.rating_count})`} />
            </div>
            <Divider />
            <Meta icon={Tag} label="Category" value={mod.category} />
            <Meta icon={Scale} label="License" value={mod.license} />
            <Meta icon={Layers} label="Loaders" value={mod.mod_loaders.join(", ") || "—"} />
            <Meta icon={GitBranch} label="Game Versions" value={mod.game_versions.join(", ") || "—"} />
            <Divider />
            <div className="flex flex-wrap gap-1.5">
              {mod.tags.map((t) => <span key={t} className="font-mono text-[10px] uppercase border border-slate-light text-warm/60 px-1.5 py-0.5">{t}</span>)}
            </div>
            <Divider />
            <ReportButton mod={mod} user={user} />
          </div>
        </aside>
      </div>
    </div>
  );
}

const Divider = () => <div className="h-px bg-slate-light my-4" />;
const Stat = ({ icon: Icon, label, value }) => (
  <div className="bg-charcoal border border-slate-light p-3">
    <Icon className="w-4 h-4 text-teal-light" />
    <p className="text-warm font-semibold mt-1">{value}</p>
    <p className="text-[10px] text-warm/40 uppercase tracking-widest">{label}</p>
  </div>
);
const Meta = ({ icon: Icon, label, value }) => (
  <div className="flex justify-between items-center py-1.5 text-sm">
    <span className="flex items-center gap-2 text-warm/50 font-mono text-xs uppercase tracking-wide"><Icon className="w-3.5 h-3.5" />{label}</span>
    <span className="text-warm text-right">{value}</span>
  </div>
);

function Versions({ versions }) {
  if (!versions?.length) return <p className="text-warm/40 font-mono">No approved versions yet.</p>;
  return (
    <div className="space-y-3">
      {versions.map((v) => (
        <div key={v.id} className="bg-slate border border-slate-light p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-amber">v{v.version_number}</span>
            <span className="font-mono text-xs text-warm/40">{fmt(v.file_size)}B · {v.file_name}</span>
          </div>
          <p className="text-warm/70 text-sm mt-2">{v.changelog}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {v.game_versions.map((g) => <span key={g} className="font-mono text-[10px] border border-slate-light text-warm/50 px-1.5">{g}</span>)}
            {v.mod_loaders.map((l) => <span key={l} className="font-mono text-[10px] border border-teal text-teal-light px-1.5">{l}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Reviews({ mod, user, onDone }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  const submit = async () => {
    try {
      await api.post(`/mods/${mod.slug}/reviews`, { rating, body });
      toast.success("[REVIEW] Posted");
      setBody(""); onDone();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  return (
    <div>
      {user && (
        <div className="bg-slate border border-slate-light p-4 mb-6">
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} data-testid={`review-star-${n}`} onClick={() => setRating(n)}>
                <Star className={`w-6 h-6 ${n <= rating ? "text-amber fill-amber" : "text-warm/30"}`} />
              </button>
            ))}
          </div>
          <textarea data-testid="review-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience..." rows={3}
            className="w-full bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
          <button data-testid="submit-review-btn" onClick={submit} className="mt-3 bg-teal text-warm px-4 py-2 font-mono text-xs uppercase tracking-wide border border-teal-light hover:-translate-y-0.5 transition-transform">Post Review</button>
        </div>
      )}
      <div className="space-y-3">
        {mod.reviews?.length ? mod.reviews.map((r) => (
          <div key={r.id} className="bg-slate border border-slate-light p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-warm">{r.user_name}</span>
              <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "text-amber fill-amber" : "text-warm/20"}`} />)}</div>
            </div>
            {r.body && <p className="text-warm/70 text-sm mt-2">{r.body}</p>}
          </div>
        )) : <p className="text-warm/40 font-mono">No reviews yet.</p>}
      </div>
    </div>
  );
}

function Comments({ slug, comments, user, onDone }) {
  const [body, setBody] = useState("");
  const submit = async () => {
    if (!body.trim()) return;
    try { await api.post(`/mods/${slug}/comments`, { body }); setBody(""); onDone(); toast.success("[COMMENT] Posted"); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  return (
    <div>
      {user && (
        <div className="flex gap-2 mb-6">
          <input data-testid="comment-input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment..."
            className="flex-1 bg-charcoal border border-slate-light p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-amber" />
          <button data-testid="submit-comment-btn" onClick={submit} className="bg-teal text-warm px-4 border border-teal-light hover:-translate-y-0.5 transition-transform"><Send className="w-4 h-4" /></button>
        </div>
      )}
      <div className="space-y-3">
        {comments.length ? comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <img src={c.user_avatar} alt="" referrerPolicy="no-referrer" className="w-8 h-8 border border-slate-light bg-slate" />
            <div className="bg-slate border border-slate-light p-3 flex-1">
              <span className="font-semibold text-warm text-sm">{c.user_name}</span>
              <p className="text-warm/70 text-sm mt-1">{c.body}</p>
            </div>
          </div>
        )) : <p className="text-warm/40 font-mono flex items-center gap-2"><MessageSquare className="w-4 h-4" />No comments yet.</p>}
      </div>
    </div>
  );
}

function ReportButton({ mod, user }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("malware");
  const [reason, setReason] = useState("");
  const submit = async () => {
    try { await api.post("/reports", { target_type: "mod", target_id: mod.id, category, reason }); toast.success("[REPORT] Submitted to Trust & Safety"); setOpen(false); setReason(""); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  if (!user) return null;
  return (
    <div>
      <button data-testid="report-mod-btn" onClick={() => setOpen(!open)} className="flex items-center gap-2 text-rust font-mono text-xs uppercase tracking-wide hover:underline"><Flag className="w-3.5 h-3.5" />Report this mod</button>
      {open && (
        <div className="mt-3 space-y-2">
          <select data-testid="report-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-charcoal border border-slate-light p-2 text-warm text-sm">
            {["malware", "dmca", "harassment", "impersonation", "csam", "spam", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea data-testid="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Describe the issue" className="w-full bg-charcoal border border-slate-light p-2 text-warm text-sm" />
          <button data-testid="submit-report-btn" onClick={submit} className="w-full bg-rust text-warm py-2 font-mono text-xs uppercase tracking-wide">Submit Report</button>
        </div>
      )}
    </div>
  );
}
