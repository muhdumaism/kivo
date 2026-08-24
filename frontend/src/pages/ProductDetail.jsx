import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { API, apiError } from "@/lib/api";
import { useAuth, isStaff } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/pages/Home";
import { renderMarkdown } from "@/lib/md";
import { fmt } from "@/components/qiveo/ModCard";
import { toast } from "sonner";
import {
  Download, Heart, Bookmark, Settings, Crown, Scale, CalendarDays,
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

  const { addListener } = useWebSocket();
  const reload = () => api.get(`/mods/${slug}`).then((r) => setItem(r.data));
  
  useEffect(() => {
    reload().catch(() => setItem(false));
    api.get(`/mods/${slug}/comments`).then((r) => setComments(r.data)).catch(() => {});
    if (user) api.get("/me/library").then((r) => setLib(r.data.ids)).catch(() => {});
    window.scrollTo(0, 0);
  }, [slug, user]);

  useEffect(() => {
    if (!addListener) return;
    
    const unbindComment = addListener("comment_added", (data) => {
      if (data.mod_slug === slug) {
        setComments((prev) => {
          if (prev.some((c) => c.id === data.comment.id)) return prev;
          return [...prev, data.comment];
        });
      }
    });

    const unbindReview = addListener("review_added", (data) => {
      if (data.mod_slug === slug) {
        setItem((prev) => {
          if (!prev) return prev;
          const reviews = prev.reviews || [];
          if (reviews.some((r) => r.id === data.review.id)) return prev;
          return {
            ...prev,
            rating_avg: data.rating_avg,
            rating_count: data.rating_count,
            reviews: [data.review, ...reviews]
          };
        });
      }
    });

    const unbindDownloads = addListener("downloads_updated", (data) => {
      if (item && data.mod_id === item.id) {
        setItem((prev) => prev ? { ...prev, downloads: data.downloads } : prev);
      }
    });

    const unbindStatus = addListener("status_updated", (data) => {
      if (item && data.mod_id === item.id) {
        setItem((prev) => prev ? { ...prev, status: data.status } : prev);
      }
    });

    return () => {
      unbindComment();
      unbindReview();
      unbindDownloads();
      unbindStatus();
    };
  }, [slug, item, addListener]);

  if (item === false) return <div className="min-h-screen bg-transparent"><Navbar /><p className="text-[#E9D5FF] p-10 font-mono font-bold">Project not found.</p><Footer /></div>;
  if (!item) return <div className="min-h-screen bg-transparent"><Navbar /></div>;

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
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header Retro Card */}
        <div className="bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-3xl p-6 flex flex-col md:flex-row gap-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <img src={item.icon} alt={item.title} className="w-24 h-24 rounded-2xl border-2 border-[#E9D5FF] bg-[#15141E] object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl lg:text-3xl font-black text-[#E9D5FF] uppercase tracking-tight">{item.title}</h1>
              {item.status !== "approved" && (
                <span data-testid="status-pill" className="inline-flex items-center gap-1.5 border-2 border-[#E9D5FF] text-[#E9D5FF] bg-[#15141E] rounded-full px-3 py-0.5 text-xs font-heading font-extrabold uppercase"><RefreshCw className="w-3 h-3" />{item.status === "in_review" ? "Under review" : item.status.replace("_", " ")}</span>
              )}
              {item.visibility && item.visibility !== "public" && <span className="text-[10px] font-mono uppercase tracking-widest border border-[#E9D5FF] text-[#E9D5FF]/60 rounded-full px-2 py-0.5 font-bold">{item.visibility}</span>}
            </div>
            <p className="text-[#E9D5FF]/80 mt-1.5 font-medium">{item.summary}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-[#E9D5FF]/60 font-mono font-bold">
              <span className="flex items-center gap-1.5"><Download className="w-4 h-4 text-[#E9D5FF]" />{fmt(item.downloads)} downloads</span>
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-red-500" />{fmt(item.follows || 0)} followers</span>
            </div>
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3" data-testid="project-tags">
                <Tag className="w-3.5 h-3.5 text-[#E9D5FF]/40" />
                {item.tags.map((t) => <span key={t} className="text-xs font-mono border border-[#E9D5FF] text-[#E9D5FF]/80 rounded-full px-2 py-0.5 font-semibold">{t}</span>)}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            {owner && <Link to={`/project/${slug}/edit`} data-testid="edit-project-btn" className="inline-flex items-center gap-1.5 retro-btn px-4 py-2 text-sm font-extrabold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"><Settings className="w-4 h-4" />Edit project</Link>}
            <IconBtn testid="follow-btn" active={isFollow} onClick={() => act("follow")} title="Follow"><Bell className={`w-4 h-4 ${isFollow ? "fill-[#E9D5FF]" : ""}`} /></IconBtn>
            <IconBtn testid="favorite-btn" active={isFav} onClick={() => act("favorite")} title="Favorite" activeCls="border-red-500 text-red-500"><Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} /></IconBtn>
            <IconBtn testid="bookmark-btn" active={isBook} onClick={() => act("bookmark")} title="Bookmark" activeCls="border-blue-600 text-blue-600"><Bookmark className={`w-4 h-4 ${isBook ? "fill-blue-600 text-blue-600" : ""}`} /></IconBtn>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-8">
          {/* Left Column */}
          <div className="min-w-0">
            <div className="flex gap-1 border-b-2 border-[#E9D5FF] overflow-x-auto mb-5">
              {TABS.map((t) => (
                <button key={t} data-testid={`tab-${t.toLowerCase()}`} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-heading font-extrabold uppercase tracking-wider rounded-t-2xl whitespace-nowrap transition-colors border-2 border-b-0 border-[#E9D5FF] -mb-0.5 ${tab === t ? "bg-[#E9D5FF] text-[#0A0A0C]" : "bg-[#15141E] text-[#E9D5FF]/60 hover:text-[#E9D5FF]"}`}>{t}</button>
              ))}
            </div>
            
            <div className="bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-3xl p-6 min-h-[300px] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              {tab === "Description" && <div className="prose max-w-none text-[#E9D5FF] font-medium" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }} />}
              {tab === "Gallery" && <Gallery item={item} />}
              {tab === "Changelog" && <Changelog versions={item.versions} />}
              {tab === "Versions" && <Versions versions={item.versions} />}
              {tab === "Moderation" && <Moderation item={item} />}
            </div>

            {/* Download Button */}
            <div className="mt-6">
              <button data-testid="download-btn" onClick={grab} disabled={!latest} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 retro-btn-black px-8 py-4 font-extrabold text-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,0.3)] disabled:opacity-40"><Download className="w-5 h-5" />Download {latest ? `v${latest.version_number}` : ""}</button>
            </div>

            {/* Engagement (Comments/Reviews) */}
            <Engagement item={item} user={user} comments={comments} onReload={reload} onComments={() => api.get(`/mods/${slug}/comments`).then((r) => setComments(r.data))} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card title="Compatibility">
              <p className="text-xs font-mono uppercase tracking-widest text-[#E9D5FF]/50 mb-2 font-bold">Minecraft Version</p>
              <div className="flex flex-wrap gap-1.5">
                {(item.game_versions.length ? item.game_versions : ["Any"]).map((v) => <Pill key={v}>{v}</Pill>)}
              </div>
              {item.mod_loaders.length > 0 && (
                <>
                  <p className="text-xs font-mono uppercase tracking-widest text-[#E9D5FF]/50 mt-4 mb-2 font-bold">Platforms</p>
                  <div className="flex flex-wrap gap-1.5">{item.mod_loaders.map((l) => <Pill key={l} accent><Layers className="w-3 h-3" />{l}</Pill>)}</div>
                </>
              )}
            </Card>

            <Card title="Creators">
              <div className="flex items-center gap-3">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${item.author_name}`} alt="" className="w-10 h-10 rounded-xl border border-[#E9D5FF] bg-[#15141E] object-cover" />
                <div className="min-w-0">
                  <p className="text-[#E9D5FF] font-heading font-extrabold text-sm flex items-center gap-1.5 truncate">@{item.author_name}</p>
                  <p className="text-[10px] font-mono text-[#E9D5FF]/50 font-bold flex items-center gap-1"><Crown className="w-3 h-3 text-[#E9D5FF]" />Owner</p>
                </div>
              </div>
            </Card>

            <Card title="Details">
              <Detail icon={Scale} label="License" value={<span className="text-[#E9D5FF] font-bold">{item.license}</span>} />
              <Detail icon={CalendarDays} label="Created" value={new Date(item.created_at).toLocaleDateString()} />
              <Detail icon={CalendarDays} label="Updated" value={new Date(item.updated_at).toLocaleDateString()} />
            </Card>

            {user && <ReportBox item={item} />}
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const IconBtn = ({ children, onClick, testid, title, active, activeCls = "border-[#E9D5FF] text-[#E9D5FF] bg-[#15141E]" }) => (
  <button data-testid={testid} onClick={onClick} title={title} className={`w-10 h-10 grid place-items-center rounded-xl border-2 transition-colors ${active ? activeCls : "border-[#E9D5FF] text-[#E9D5FF]/75 hover:bg-[#E9D5FF]/5"}`}>{children}</button>
);

const Card = ({ title, children }) => (
  <div className="bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
    <h3 className="font-heading font-extrabold text-[#E9D5FF] text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#E9D5FF]/20">{title}</h3>
    {children}
  </div>
);

const Pill = ({ children, accent }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-mono font-bold ${accent ? "bg-[#E9D5FF] text-[#0A0A0C]" : "border border-[#E9D5FF] text-[#E9D5FF]"}`}>{children}</span>
);

const Detail = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between py-2 text-sm border-b border-dashed border-[#E9D5FF]/20 last:border-0">
    <span className="flex items-center gap-1.5 text-[#E9D5FF]/50 text-xs uppercase tracking-wide font-mono font-bold"><Icon className="w-3.5 h-3.5" />{label}</span>
    <span className="text-[#E9D5FF] font-medium">{value}</span>
  </div>
);

function Gallery({ item }) {
  const imgs = item.gallery || [];
  if (!imgs.length) return <p className="text-[#E9D5FF]/40 font-mono font-bold">No gallery images yet.</p>;
  return <div className="grid grid-cols-2 gap-4">{imgs.map((g, i) => <img key={i} src={g.startsWith("http") ? g : `${API.replace("/api", "")}${g}`} alt="" className="rounded-2xl border-2 border-[#E9D5FF] w-full object-cover shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]" />)}</div>;
}

function Changelog({ versions }) {
  if (!versions?.length) return <p className="text-[#E9D5FF]/40 font-mono font-bold">No changelog yet.</p>;
  return <div className="space-y-4">{versions.map((v) => (<div key={v.id} className="border-l-2 border-[#E9D5FF] pl-4"><p className="font-mono font-bold text-[#E9D5FF]">v{v.version_number}</p><p className="text-[#E9D5FF]/75 text-sm mt-1">{v.changelog || "No notes."}</p></div>))}</div>;
}

function Versions({ versions }) {
  if (!versions?.length) return <p className="text-[#E9D5FF]/40 font-mono font-bold">No versions yet.</p>;
  return <div className="space-y-3">{versions.map((v) => (<div key={v.id} className="flex items-center justify-between bg-[#15141E] border-2 border-[#E9D5FF] rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"><div><span className="font-mono font-bold text-[#E9D5FF] text-sm">v{v.version_number}</span><p className="text-[11px] font-mono text-[#E9D5FF]/50 font-bold">{v.file_name} · {fmt(v.file_size)}B</p></div><div className="flex flex-wrap gap-1 justify-end">{v.game_versions.map((g) => <Pill key={g}>{g}</Pill>)}</div></div>))}</div>;
}

function Moderation({ item }) {
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-4 border-2 border-[#E9D5FF] bg-[#15141E] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]`}>
        <p className="font-heading font-extrabold text-[#E9D5FF] text-sm uppercase">Status: {item.status.replace("_", " ")}</p>
        {item.review_reason && <p className="text-sm text-[#E9D5FF]/70 mt-2 font-medium">Reviewer note: "{item.review_reason}"</p>}
      </div>
      <p className="text-sm text-[#E9D5FF]/60 font-medium">New projects and every new version are reviewed by our staff before going live. You'll get a notification when the status changes.</p>
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
    <div className="mt-10 grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="font-heading font-extrabold text-[#E9D5FF] text-lg uppercase tracking-wider mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-[#E9D5FF] fill-[#E9D5FF]" />Reviews</h3>
        {user && (
          <div className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-2xl p-4 mb-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex gap-1 mb-3">{[1, 2, 3, 4, 5].map((n) => <button key={n} data-testid={`review-star-${n}`} onClick={() => setRating(n)}><Star className={`w-6 h-6 ${n <= rating ? "text-[#E9D5FF] fill-[#E9D5FF]" : "text-[#E9D5FF]/20"}`} /></button>)}</div>
            <textarea data-testid="review-body" value={rbody} onChange={(e) => setRbody(e.target.value)} rows={2} placeholder="Your review..." className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] font-medium" />
            <button data-testid="submit-review-btn" onClick={postReview} className="mt-2.5 retro-btn-black px-4 py-2 text-xs font-extrabold shadow-[2px_2px_0px_0px_rgba(20,20,20,0.3)]">Post Review</button>
          </div>
        )}
        <div className="space-y-3">
          {item.reviews?.length ? item.reviews.map((r) => (
            <div key={r.id} className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-2xl p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#E9D5FF] text-sm font-heading font-extrabold">@{r.user_name}</span>
                <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "text-[#E9D5FF] fill-[#E9D5FF]" : "text-[#E9D5FF]/10"}`} />)}</div>
              </div>
              {r.body && <p className="text-[#E9D5FF]/80 text-sm font-medium">{r.body}</p>}
            </div>
          )) : <p className="text-[#E9D5FF]/40 font-mono font-bold text-sm">No reviews yet.</p>}
        </div>
      </div>
      
      <div>
        <h3 className="font-heading font-extrabold text-[#E9D5FF] text-lg uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#E9D5FF]" />Comments</h3>
        {user && (
          <div className="flex gap-2 mb-4">
            <input 
              data-testid="comment-input" 
              value={cbody} 
              onChange={(e) => setCbody(e.target.value)} 
              placeholder="Add a comment..." 
              className="flex-1 bg-[#15141E] border-2 border-[#E9D5FF] rounded-xl px-4 py-2.5 text-[#E9D5FF] text-sm focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] font-semibold" 
            />
            <button data-testid="submit-comment-btn" onClick={postComment} className="retro-btn-black w-12 h-11 grid place-items-center shrink-0 shadow-[2px_2px_0px_0px_rgba(20,20,20,0.3)]">
              <Send className="w-4 h-4 text-[#0A0A0C]" />
            </button>
          </div>
        )}
        <div className="space-y-3">
          {comments.length ? comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 items-start">
              <img src={c.user_avatar} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg border border-[#E9D5FF] bg-[#15141E] object-cover mt-1" />
              <div className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-2xl p-3 flex-1 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                <span className="text-[#E9D5FF] text-xs font-heading font-extrabold">@{c.user_name}</span>
                <p className="text-[#E9D5FF]/85 text-sm mt-1 font-medium">{c.body}</p>
              </div>
            </div>
          )) : <p className="text-[#E9D5FF]/40 font-mono font-bold text-sm">No comments yet.</p>}
        </div>
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
    <div className="bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
      <button data-testid="report-mod-btn" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-red-600 text-sm font-extrabold uppercase hover:underline"><Flag className="w-4 h-4" />Report project</button>
      {open && (
        <div className="mt-4 space-y-3">
          <select data-testid="report-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#15141E] border-2 border-[#E9D5FF] rounded-xl p-2.5 text-[#E9D5FF] text-xs font-heading font-extrabold uppercase tracking-wide">
            {["malware", "dmca", "harassment", "impersonation", "csam", "spam", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea data-testid="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="What's wrong? Details..." className="w-full bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-xl p-3 text-[#E9D5FF] text-sm focus:outline-none font-medium" />
          <button data-testid="submit-report-btn" onClick={submit} className="w-full bg-red-600 text-[#0A0A0C] border-2 border-[#E9D5FF] py-2.5 rounded-xl text-xs font-heading font-extrabold uppercase shadow-[2px_2px_0px_0px_rgba(20,20,20,0.3)]">Submit report</button>
        </div>
      )}
    </div>
  );
}
