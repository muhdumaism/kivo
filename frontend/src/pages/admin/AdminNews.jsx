import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";

export default function AdminNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "Announcements" });

  const load = () => {
    setLoading(true);
    api.get("/news")
      .then((r) => {
        setArticles(r.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(load, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("Please fill in title and content fields.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/news", form);
      toast.success("News article published successfully!");
      setForm({ title: "", content: "", category: "Announcements" });
      load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await api.delete(`/news/${id}`);
      toast.success("Article deleted");
      load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    }
  };

  return (
    <div className="text-[#FFF8E1] space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-black uppercase tracking-tight">Publish News</h1>
        <p className="font-mono text-xs text-[#FFF8E1]/40 uppercase tracking-widest mt-1">// manage platform updates & announcements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Publish Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handlePublish} className="bg-[#24201A] border-2 border-[#92400E] rounded-2xl p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#92400E]">New Article</h2>

            <div>
              <label className="block font-mono text-[10px] uppercase text-[#FFF8E1]/60 mb-1 font-bold">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#171512] border-2 border-[#92400E]/20 rounded-xl p-2.5 text-xs text-[#FFF8E1] focus:outline-none focus:border-[#92400E] font-semibold"
              >
                <option value="Announcements">Announcements</option>
                <option value="Policy">Policy & Safety</option>
                <option value="Updates">Feature Updates</option>
                <option value="Community">Community spotlight</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase text-[#FFF8E1]/60 mb-1 font-bold">Article Title</label>
              <input
                type="text"
                placeholder="Platform Update v1.3"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#171512] border-2 border-[#92400E]/20 rounded-xl p-2.5 text-xs text-[#FFF8E1] focus:outline-none focus:border-[#92400E] font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase text-[#FFF8E1]/60 mb-1 font-bold">Content</label>
              <textarea
                rows={8}
                placeholder="Write full article markdown or text here..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full bg-[#171512] border-2 border-[#92400E]/20 rounded-xl p-2.5 text-xs text-[#FFF8E1] focus:outline-none focus:border-[#92400E] font-semibold leading-relaxed font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 bg-[#F5C542] text-[#171512] py-2.5 rounded-xl font-heading font-extrabold text-xs shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:bg-[#92400E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {busy ? "Publishing..." : "Publish Article"}
            </button>
          </form>
        </div>

        {/* Existing Articles List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#92400E]">Active Articles ({articles.length})</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-[#92400E] animate-spin" />
              <span className="font-mono text-xs text-[#FFF8E1]/40">Loading news feed...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 bg-[#24201A] border-2 border-[#92400E] rounded-2xl p-6 font-mono text-xs text-[#FFF8E1]/40 font-bold border-dashed">
              No news articles published yet.
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="bg-[#24201A] border-2 border-[#92400E] rounded-2xl p-4 flex gap-4 items-start justify-between shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#92400E] font-bold">
                      <span className="bg-[#92400E]/10 px-2 py-0.5 rounded border border-[#92400E]/30 uppercase">{article.category}</span>
                      <span>•</span>
                      <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{article.read_time}</span>
                    </div>
                    <h3 className="font-heading font-extrabold text-sm uppercase tracking-tight text-[#FFF8E1]">{article.title}</h3>
                    <p className="text-xs text-[#FFF8E1]/60 line-clamp-2 font-medium leading-relaxed mt-1">{article.summary || article.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="w-8 h-8 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500 shrink-0 grid place-items-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
