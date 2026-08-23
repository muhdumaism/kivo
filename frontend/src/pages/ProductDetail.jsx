import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { API, apiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/kivo/Navbar";
import { RarityBadge, VerifiedBadge } from "@/components/kivo/Badges";
import { CornerFrame } from "@/components/kivo/CornerFrame";
import { ItemCard, fmt } from "@/components/kivo/ModCard";
import { Reveal } from "@/components/kivo/Reveal";
import { renderMarkdown } from "@/lib/md";
import { toast } from "sonner";
import { Download, Star, Layers, GitBranch, Scale, Flag, Send, MessageSquare, Check, ArrowLeft } from "lucide-react";

const TABS = ["Details", "Versions", "Reviews", "Comments"];

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [tab, setTab] = useState("Details");
  const [comments, setComments] = useState([]);
  const [similar, setSimilar] = useState([]);

  const reload = () => api.get(`/mods/${slug}`).then((r) => setItem(r.data));
  useEffect(() => {
    reload();
    api.get(`/mods/${slug}/comments`).then((r) => setComments(r.data));
    window.scrollTo(0, 0);
  }, [slug]);
  useEffect(() => {
    if (item) api.get("/mods", { params: { item_type: item.item_type, limit: 5 } }).then((r) => setSimilar(r.data.filter((x) => x.slug !== slug).slice(0, 4)));
  }, [item?.item_type, slug]);

  if (!item) return <div className="min-h-screen bg-ink"><Navbar /></div>;
  const latest = item.versions?.[0];

  const grab = () => {
    if (!latest) return toast.error("No file available yet");
    window.open(`${API}/download/${latest.id}`, "_blank");
    toast.success(`Grabbed ${item.title} ✨`);
    setTimeout(reload, 1200);
  };

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/browse" className="inline-flex items-center gap-1.5 text-lavender2/60 hover:text-coral2 text-sm mb-6"><ArrowLeft className="w-4 h-4" />Back to explore</Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Hero render */}
          <div>
            <CornerFrame color="violet" className="relative bg-gradient-to-br from-plum2 to-ink rounded-3xl overflow-hidden">
              <div className="absolute inset-0 mesh-bg opacity-40" />
              <img src={item.icon} alt={item.title} className="relative w-full aspect-square object-cover animate-floaty-slow" />
            </CornerFrame>
          </div>

          {/* Sticky details */}
          <aside>
            <div className="lg:sticky lg:top-20">
              <div className="flex items-center gap-2 mb-3">
                <RarityBadge rarity={item.rarity} testid="detail-rarity" />
                <span className="font-mono text-[10px] uppercase tracking-widest border border-plumborder text-lavender2/70 rounded-full px-2 py-0.5">{item.item_type}</span>
                {item.staff_pick && <span className="font-mono text-[10px] uppercase tracking-widest bg-coral text-ink rounded-full px-2 py-0.5">Staff Pick</span>}
              </div>
              <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-warm">{item.title}</h1>
              <Link to="#" className="flex items-center gap-2 mt-3">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${item.author_name}`} alt="" className="w-7 h-7 rounded-full bg-plum2" />
                <span className="text-sm text-lavender2/80">@{item.author_name}</span>
                {item.author_verified && <VerifiedBadge />}
              </Link>
              <p className="text-lavender2/70 mt-4">{item.summary}</p>

              <CornerFrame color="coral" className="bg-plum border border-plumborder rounded-2xl p-5 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-lavender2/50">Price</p>
                    <p className="font-heading text-2xl font-extrabold text-mint">Free</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-lavender2/50">Grabs</p>
                    <p className="font-heading text-2xl font-extrabold text-warm">{fmt(item.downloads)}</p>
                  </div>
                </div>
                <button data-testid="download-btn" onClick={grab} disabled={!latest}
                  className="shine w-full mt-4 flex items-center justify-center gap-2 bg-coral text-ink py-3.5 rounded-full font-bold hover:-translate-y-0.5 transition-transform glow-coral disabled:opacity-40">
                  <Download className="w-5 h-5" /> Get it {latest ? `· v${latest.version_number}` : ""}
                </button>
                <p className="font-mono text-[10px] text-center text-lavender2/40 mt-2">Paid drops coming soon</p>
              </CornerFrame>

              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <Meta icon={Star} label="Rating" value={`${item.rating_avg || "—"} (${item.rating_count})`} />
                <Meta icon={Scale} label="License" value={item.license} />
                <Meta icon={Layers} label="Loaders" value={item.mod_loaders.join(", ") || "—"} />
                <Meta icon={GitBranch} label="Versions" value={item.game_versions.join(", ") || "—"} />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {item.tags.map((t) => <span key={t} className="font-mono text-[10px] uppercase border border-plumborder text-lavender2/60 rounded-full px-2 py-0.5">#{t}</span>)}
              </div>

              <ReportButton item={item} user={user} />
            </div>
          </aside>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-2 border-b border-plumborder overflow-x-auto">
            {TABS.map((t) => (
              <button key={t} data-testid={`tab-${t.toLowerCase()}`} onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t ? "border-coral text-coral2" : "border-transparent text-lavender2/50 hover:text-warm"}`}>{t}</button>
            ))}
          </div>
          <div className="py-6 max-w-3xl">
            {tab === "Details" && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }} />}
            {tab === "Versions" && <Versions versions={item.versions} />}
            {tab === "Reviews" && <Reviews item={item} user={user} onDone={reload} />}
            {tab === "Comments" && <Comments slug={slug} comments={comments} user={user} onDone={() => api.get(`/mods/${slug}/comments`).then((r) => setComments(r.data))} />}
          </div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-8">
            <h2 className="font-heading text-2xl font-bold text-warm mb-5">More {item.item_type.toLowerCase()}s you'll like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((m, i) => <Reveal key={m.id} delay={i * 80}><ItemCard item={m} /></Reveal>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Meta = ({ icon: Icon, label, value }) => (
  <div className="bg-plum border border-plumborder rounded-xl p-3">
    <span className="flex items-center gap-1.5 text-lavender2/50 font-mono text-[10px] uppercase tracking-wide"><Icon className="w-3.5 h-3.5" />{label}</span>
    <p className="text-warm mt-1 truncate">{value}</p>
  </div>
);

function Versions({ versions }) {
  if (!versions?.length) return <p className="text-lavender2/40 font-mono">No versions yet.</p>;
  return (
    <div className="space-y-3">
      {versions.map((v) => (
        <div key={v.id} className="bg-plum border border-plumborder rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-coral2">v{v.version_number}</span>
            <span className="font-mono text-xs text-lavender2/40">{fmt(v.file_size)}B · {v.file_name}</span>
          </div>
          <p className="text-lavender2/70 text-sm mt-2">{v.changelog}</p>
        </div>
      ))}
    </div>
  );
}

function Reviews({ item, user, onDone }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const submit = async () => {
    try { await api.post(`/mods/${item.slug}/reviews`, { rating, body }); toast.success("Review posted"); setBody(""); onDone(); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  return (
    <div>
      {user && (
        <div className="bg-plum border border-plumborder rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} data-testid={`review-star-${n}`} onClick={() => setRating(n)}><Star className={`w-6 h-6 ${n <= rating ? "text-coral fill-coral" : "text-lavender2/25"}`} /></button>
            ))}
          </div>
          <textarea data-testid="review-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="How's the drop?" rows={3}
            className="w-full bg-ink border border-plumborder rounded-xl p-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
          <button data-testid="submit-review-btn" onClick={submit} className="mt-3 bg-violet text-warm px-4 py-2 rounded-full text-sm font-semibold hover:-translate-y-0.5 transition-transform">Post review</button>
        </div>
      )}
      <div className="space-y-3">
        {item.reviews?.length ? item.reviews.map((r) => (
          <div key={r.id} className="bg-plum border border-plumborder rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-warm">{r.user_name}</span>
              <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "text-coral fill-coral" : "text-lavender2/20"}`} />)}</div>
            </div>
            {r.body && <p className="text-lavender2/70 text-sm mt-2">{r.body}</p>}
          </div>
        )) : <p className="text-lavender2/40 font-mono">No reviews yet.</p>}
      </div>
    </div>
  );
}

function Comments({ slug, comments, user, onDone }) {
  const [body, setBody] = useState("");
  const submit = async () => {
    if (!body.trim()) return;
    try { await api.post(`/mods/${slug}/comments`, { body }); setBody(""); onDone(); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  return (
    <div>
      {user && (
        <div className="flex gap-2 mb-6">
          <input data-testid="comment-input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Drop a comment..."
            className="flex-1 bg-plum border border-plumborder rounded-full px-4 py-3 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
          <button data-testid="submit-comment-btn" onClick={submit} className="bg-violet text-warm w-12 grid place-items-center rounded-full hover:-translate-y-0.5 transition-transform"><Send className="w-4 h-4" /></button>
        </div>
      )}
      <div className="space-y-3">
        {comments.length ? comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <img src={c.user_avatar} alt="" className="w-8 h-8 rounded-full bg-plum2" />
            <div className="bg-plum border border-plumborder rounded-xl p-3 flex-1">
              <span className="font-semibold text-warm text-sm">{c.user_name}</span>
              <p className="text-lavender2/70 text-sm mt-1">{c.body}</p>
            </div>
          </div>
        )) : <p className="text-lavender2/40 font-mono flex items-center gap-2"><MessageSquare className="w-4 h-4" />No comments yet.</p>}
      </div>
    </div>
  );
}

function ReportButton({ item, user }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("malware");
  const [reason, setReason] = useState("");
  const submit = async () => {
    try { await api.post("/reports", { target_type: "mod", target_id: item.id, category, reason }); toast.success("Reported to Trust & Safety"); setOpen(false); setReason(""); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  if (!user) return null;
  return (
    <div className="mt-4">
      <button data-testid="report-mod-btn" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-rose/80 text-xs font-mono uppercase tracking-wide hover:text-rose"><Flag className="w-3.5 h-3.5" />Report</button>
      {open && (
        <div className="mt-3 space-y-2">
          <select data-testid="report-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-ink border border-plumborder rounded-lg p-2 text-warm text-sm">
            {["malware", "dmca", "harassment", "impersonation", "csam", "spam", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea data-testid="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="What's wrong?" className="w-full bg-ink border border-plumborder rounded-lg p-2 text-warm text-sm" />
          <button data-testid="submit-report-btn" onClick={submit} className="w-full bg-rose text-warm py-2 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5" />Submit report</button>
        </div>
      )}
    </div>
  );
}
