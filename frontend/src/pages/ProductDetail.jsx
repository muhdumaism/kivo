import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { API, apiError } from "@/lib/api";
import { useAuth, isStaff } from "@/context/AuthContext";
import { Navbar } from "@/components/kivo/Navbar";
import { StatusBadge, VerifiedBadge } from "@/components/kivo/Badges";
import { renderMarkdown } from "@/lib/md";
import { fmt } from "@/components/kivo/ModCard";
import { toast } from "sonner";
import {
  Download, Heart, Bookmark, MoreHorizontal, Settings, Crown, Scale, CalendarDays,
  RefreshCw, Flag, Star, Send, MessageSquare, Layers, Bell, Tag,
} from "lucide-react";

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [tab, setTab] = useState("Description");
  const [comments, setComments] = useState([]);
  const [lib, setLib] = useState({ following: [], favorites: [], bookmarks: [] });

  const reload = () => api.get(`/mods/${slug}`).then((r) => setItem(r.data));
  useEffect(() => {
    reload().catch(() => setItem(false));
    api.get(`/mods/${slug}/comments`).then((r) => setComments(r.data)).catch(() => {});
    if (user) api.get("/me/library").then((r) => setLib(r.data.ids)).catch(() => {});
    window.scrollTo(0, 0);
  }, [slug, user]);

  if (item === false) return <div className="min-h-screen bg-ink"><Navbar /><p className="text-warm p-10 font-mono">Project not found.</p></div>;
  if (!item) return <div className="min-h-screen bg-ink"><Navbar /></div>;

  const owner = user && (user.id === item.author_id || isStaff(user));
  const latest = item.versions?.[0];
  const isFav = lib.favorites?.includes(item.id);
  const isFollow = lib.following?.includes(item.id);
  const isBook = lib.bookmarks?.includes(item.id);

  const TABS = ["Description", "Gallery", "Changelog", "Versions", ...(owner ? ["Moderation"] : [])];

  const act = async (kind) => {
    if (!user) { nav("/login"); return; }
    try {
      const { data } = await api.post(`/mods/${slug}/${kind}`);
      setLib((l) => {
        const key = { follow: "following", favorite: "favorites", bookmark: "bookmarks" }[kind];
        const arr = new Set(l[key] || []);
        data.active ? arr.add(item.id) : arr.delete(item.id);
        return { ...l, [key]: [...arr] };
      });
      if (kind === "follow" && data.count != null) setItem((it) => ({ ...it, follows: data.count }));
      toast.success(data.active ? `${kind === "follow" ? "Following" : kind === "favorite" ? "Favorited" : "Bookmarked"}` : "Removed");
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const grab = () => {
    if (!latest) return toast.error("No file available yet");
    window.open(`${API}/download/${latest.id}`, "_blank");
    toast.success(`Downloading ${item.title}`);
    setTimeout(reload, 1200);
  };

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="bg-plum border border-plumborder rounded-2xl p-5 flex flex-col md:flex-row gap-5">
          <img src={item.icon} alt={item.title} className="w-24 h-24 rounded-xl border border-plumborder bg-plum2 object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl lg:text-3xl font-extrabold text-warm">{item.title}</h1>
              {item.status !== "approved" && (
                <span data-testid="status-pill" className="inline-flex items-center gap-1.5 border border-gold/50 text-gold bg-gold/10 rounded-full px-2.5 py-0.5 text-xs font-semibold"><RefreshCw className="w-3 h-3" />{item.status === "in_review" ? "Under review" : item.status.replace("_", " ")}</span>
              )}
              {item.visibility && item.visibility !== "public" && <span className="text-[10px] font-mono uppercase tracking-widest border border-plumborder text-lavender2/60 rounded-full px-2 py-0.5">{item.visibility}</span>}
            </div>
            <p className="text-lavender2/70 mt-1.5">{item.summary}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-lavender2/60 font-mono">
              <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-lavender2" />{fmt(item.downloads)} downloads</span>
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-coral" />{fmt(item.follows || 0)} followers</span>
            </div>
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3" data-testid="project-tags">
                <Tag className="w-3.5 h-3.5 text-lavender2/40" />
                {item.tags.map((t) => <span key={t} className="text-xs font-mono border border-plumborder text-lavender2/70 rounded-full px-2 py-0.5">{t}</span>)}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            {owner && <Link to={`/project/${slug}/edit`} data-testid="edit-project-btn" className="inline-flex items-center gap-1.5 bg-violet/15 border border-violet/40 text-lavender2 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-violet/25"><Settings className="w-4 h-4" />Edit project</Link>}
            <IconBtn testid="follow-btn" active={isFollow} onClick={() => act("follow")} title="Follow"><Bell className={`w-4 h-4 ${isFollow ? "fill-lavender2" : ""}`} /></IconBtn>
            <IconBtn testid="favorite-btn" active={isFav} onClick={() => act("favorite")} title="Favorite" activeCls="border-coral text-coral"><Heart className={`w-4 h-4 ${isFav ? "fill-coral" : ""}`} /></IconBtn>
            <IconBtn testid="bookmark-btn" active={isBook} onClick={() => act("bookmark")} title="Bookmark" activeCls="border-violet text-lavender2"><Bookmark className={`w-4 h-4 ${isBook ? "fill-lavender2" : ""}`} /></IconBtn>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-6">
          {/* Left */}
          <div className="min-w-0">
            <div className="flex gap-1 border-b border-plumborder overflow-x-auto mb-5">
              {TABS.map((t) => (
                <button key={t} data-testid={`tab-${t.toLowerCase()}`} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-colors ${tab === t ? "text-coral2 border-b-2 border-coral -mb-px" : "text-lavender2/50 hover:text-warm"}`}>{t}</button>
              ))}
            </div>
            <div className="bg-plum border border-plumborder rounded-2xl p-6 min-h-[300px]">
              {tab === "Description" && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }} />}
              {tab === "Gallery" && <Gallery item={item} />}
              {tab === "Changelog" && <Changelog versions={item.versions} />}
              {tab === "Versions" && <Versions versions={item.versions} />}
              {tab === "Moderation" && <Moderation item={item} />}
            </div>

            {/* Download + reviews/comments below */}
            <div className="mt-6">
              <button data-testid="download-btn" onClick={grab} disabled={!latest} className="shine w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-coral text-ink px-6 py-3 rounded-lg font-bold hover:-translate-y-0.5 transition-transform glow-coral disabled:opacity-40"><Download className="w-5 h-5" />Download {latest ? `v${latest.version_number}` : ""}</button>
            </div>

            <Engagement item={item} user={user} comments={comments} onReload={reload} onComments={() => api.get(`/mods/${slug}/comments`).then((r) => setComments(r.data))} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <Card title="Compatibility">
              <p className="text-xs font-mono uppercase tracking-widest text-lavender2/50 mb-1.5">Minecraft: Java Edition</p>
              <div className="flex flex-wrap gap-1.5">
                {(item.game_versions.length ? item.game_versions : ["Any"]).map((v) => <Pill key={v}>{v}</Pill>)}
              </div>
              {item.mod_loaders.length > 0 && (
                <>
                  <p className="text-xs font-mono uppercase tracking-widest text-lavender2/50 mt-3 mb-1.5">Platforms</p>
                  <div className="flex flex-wrap gap-1.5">{item.mod_loaders.map((l) => <Pill key={l} accent><Layers className="w-3 h-3" />{l}</Pill>)}</div>
                </>
              )}
            </Card>

            <Card title="Creators">
              <div className="flex items-center gap-2.5">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${item.author_name}`} alt="" className="w-9 h-9 rounded-lg bg-plum2" />
                <div className="min-w-0">
                  <p className="text-warm font-semibold text-sm flex items-center gap-1.5 truncate">@{item.author_name} {item.author_verified && <VerifiedBadge />}</p>
                  <p className="text-[11px] text-lavender2/50 flex items-center gap-1"><Crown className="w-3 h-3 text-gold" />Owner</p>
                </div>
              </div>
            </Card>

            <Card title="Details">
              <Detail icon={Scale} label="License" value={<span className="text-coral2">{item.license}</span>} />
              <Detail icon={CalendarDays} label="Created" value={new Date(item.created_at).toLocaleDateString()} />
              <Detail icon={CalendarDays} label="Updated" value={new Date(item.updated_at).toLocaleDateString()} />
            </Card>

            {user && <ReportBox item={item} />}
          </aside>
        </div>
      </div>
    </div>
  );
}

const IconBtn = ({ children, onClick, testid, title, active, activeCls = "border-violet text-lavender2" }) => (
  <button data-testid={testid} onClick={onClick} title={title} className={`w-9 h-9 grid place-items-center rounded-lg border transition-colors ${active ? activeCls : "border-plumborder text-lavender2/70 hover:text-warm hover:border-violet/60"}`}>{children}</button>
);
const Card = ({ title, children }) => (
  <div className="bg-plum border border-plumborder rounded-2xl p-4">
    <h3 className="font-heading font-bold text-warm text-sm mb-3">{title}</h3>{children}
  </div>
);
const Pill = ({ children, accent }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-mono ${accent ? "border border-violet/50 text-lavender2" : "border border-plumborder text-lavender2/70"}`}>{children}</span>
);
const Detail = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between py-1.5 text-sm border-b border-plumborder/40 last:border-0">
    <span className="flex items-center gap-1.5 text-lavender2/50 text-xs uppercase tracking-wide font-mono"><Icon className="w-3.5 h-3.5" />{label}</span>
    <span className="text-warm">{value}</span>
  </div>
);

function Gallery({ item }) {
  const imgs = item.gallery || [];
  if (!imgs.length) return <p className="text-lavender2/40 font-mono">No gallery images yet.</p>;
  return <div className="grid grid-cols-2 gap-3">{imgs.map((g, i) => <img key={i} src={g.startsWith("http") ? g : `${API.replace("/api", "")}${g}`} alt="" className="rounded-xl border border-plumborder w-full object-cover" />)}</div>;
}
function Changelog({ versions }) {
  if (!versions?.length) return <p className="text-lavender2/40 font-mono">No changelog yet.</p>;
  return <div className="space-y-4">{versions.map((v) => (<div key={v.id} className="border-l-2 border-violet/50 pl-4"><p className="font-mono font-bold text-coral2">v{v.version_number}</p><p className="text-lavender2/70 text-sm mt-1">{v.changelog || "No notes."}</p></div>))}</div>;
}
function Versions({ versions }) {
  if (!versions?.length) return <p className="text-lavender2/40 font-mono">No versions yet.</p>;
  return <div className="space-y-2">{versions.map((v) => (<div key={v.id} className="flex items-center justify-between bg-ink border border-plumborder rounded-xl p-3"><div><span className="font-mono font-bold text-coral2">v{v.version_number}</span><p className="text-[11px] font-mono text-lavender2/50">{v.file_name} · {fmt(v.file_size)}B</p></div><div className="flex flex-wrap gap-1 justify-end">{v.game_versions.map((g) => <Pill key={g}>{g}</Pill>)}</div></div>))}</div>;
}
function Moderation({ item }) {
  return (
    <div className="space-y-3">
      <div className={`rounded-xl p-4 border ${item.status === "approved" ? "border-mint/40 bg-mint/10" : "border-gold/40 bg-gold/10"}`}>
        <p className="font-heading font-bold text-warm">Status: {item.status.replace("_", " ")}</p>
        {item.review_reason && <p className="text-sm text-lavender2/70 mt-1">Reviewer note: "{item.review_reason}"</p>}
      </div>
      <p className="text-sm text-lavender2/60">New projects and every new version are reviewed by our staff before going live. You'll get a notification when the status changes.</p>
    </div>
  );
}

function Engagement({ item, user, comments, onReload, onComments }) {
  const [rating, setRating] = useState(5);
  const [rbody, setRbody] = useState("");
  const [cbody, setCbody] = useState("");
  const postReview = async () => { try { await api.post(`/mods/${item.slug}/reviews`, { rating, body: rbody }); setRbody(""); onReload(); toast.success("Review posted"); } catch (e) { toast.error(apiError(e.response?.data?.detail)); } };
  const postComment = async () => { if (!cbody.trim()) return; try { await api.post(`/mods/${item.slug}/comments`, { body: cbody }); setCbody(""); onComments(); } catch (e) { toast.error(apiError(e.response?.data?.detail)); } };
  return (
    <div className="mt-8 grid md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-heading font-bold text-warm mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-coral" />Reviews</h3>
        {user && (
          <div className="bg-plum border border-plumborder rounded-xl p-3 mb-3">
            <div className="flex gap-1 mb-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} data-testid={`review-star-${n}`} onClick={() => setRating(n)}><Star className={`w-5 h-5 ${n <= rating ? "text-coral fill-coral" : "text-lavender2/25"}`} /></button>)}</div>
            <textarea data-testid="review-body" value={rbody} onChange={(e) => setRbody(e.target.value)} rows={2} placeholder="Your review" className="w-full bg-ink border border-plumborder rounded-lg p-2 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" />
            <button data-testid="submit-review-btn" onClick={postReview} className="mt-2 bg-violet text-warm px-3 py-1.5 rounded-lg text-xs font-semibold">Post</button>
          </div>
        )}
        <div className="space-y-2">{item.reviews?.length ? item.reviews.map((r) => (<div key={r.id} className="bg-plum border border-plumborder rounded-xl p-3"><div className="flex justify-between"><span className="text-warm text-sm font-semibold">{r.user_name}</span><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3 h-3 ${n <= r.rating ? "text-coral fill-coral" : "text-lavender2/20"}`} />)}</div></div>{r.body && <p className="text-lavender2/70 text-sm mt-1">{r.body}</p>}</div>)) : <p className="text-lavender2/40 font-mono text-sm">No reviews yet.</p>}</div>
      </div>
      <div>
        <h3 className="font-heading font-bold text-warm mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-lavender2" />Comments</h3>
        {user && <div className="flex gap-2 mb-3"><input data-testid="comment-input" value={cbody} onChange={(e) => setCbody(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-plum border border-plumborder rounded-lg px-3 py-2 text-warm text-sm focus:outline-none focus:ring-2 focus:ring-violet" /><button data-testid="submit-comment-btn" onClick={postComment} className="bg-violet text-warm w-10 grid place-items-center rounded-lg"><Send className="w-4 h-4" /></button></div>}
        <div className="space-y-2">{comments.length ? comments.map((c) => (<div key={c.id} className="flex gap-2"><img src={c.user_avatar} alt="" className="w-7 h-7 rounded-lg bg-plum2" /><div className="bg-plum border border-plumborder rounded-xl p-2.5 flex-1"><span className="text-warm text-sm font-semibold">{c.user_name}</span><p className="text-lavender2/70 text-sm">{c.body}</p></div></div>)) : <p className="text-lavender2/40 font-mono text-sm">No comments yet.</p>}</div>
      </div>
    </div>
  );
}

function ReportBox({ item }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("malware");
  const [reason, setReason] = useState("");
  const submit = async () => { try { await api.post("/reports", { target_type: "mod", target_id: item.id, category, reason }); toast.success("Reported to Trust & Safety"); setOpen(false); setReason(""); } catch (e) { toast.error(apiError(e.response?.data?.detail)); } };
  return (
    <div className="bg-plum border border-plumborder rounded-2xl p-4">
      <button data-testid="report-mod-btn" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-rose/80 text-sm font-semibold hover:text-rose"><Flag className="w-4 h-4" />Report project</button>
      {open && (
        <div className="mt-3 space-y-2">
          <select data-testid="report-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-ink border border-plumborder rounded-lg p-2 text-warm text-sm">{["malware", "dmca", "harassment", "impersonation", "csam", "spam", "other"].map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <textarea data-testid="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="What's wrong?" className="w-full bg-ink border border-plumborder rounded-lg p-2 text-warm text-sm" />
          <button data-testid="submit-report-btn" onClick={submit} className="w-full bg-rose text-warm py-2 rounded-lg text-xs font-semibold">Submit report</button>
        </div>
      )}
    </div>
  );
}
