import { useEffect, useState } from "react";
import { Navbar } from "@/components/qiveo/Navbar";
import { Footer } from "@/components/qiveo/Footer";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/news")
      .then((r) => {
        setArticles(r.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 text-[#FFF8E1] w-full">
        <div className="border-b-2 border-[#92400E] pb-6 mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#92400E] font-bold">// platform updates</span>
          <h1 className="font-heading text-4xl lg:text-5xl font-black uppercase tracking-tight mt-2">Qiveo Newsroom</h1>
          <p className="text-[#FFF8E1]/60 mt-2 font-semibold">Latest announcements, feature updates, and engineering logs from Qiveo.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#92400E] animate-spin" />
            <span className="font-mono text-xs text-[#FFF8E1]/40">Fetching articles...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-[#24201A] border-2 border-[#92400E] rounded-3xl p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <p className="font-mono text-sm text-[#FFF8E1]/50 font-bold">No news articles published yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {articles.map((article) => (
              <article 
                key={article.id}
                className="bg-[#24201A] border-2 border-[#92400E] rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(139,92,246,0.3)] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(139,92,246,0.4)]"
              >
                <div className="flex items-center gap-3 text-xs font-mono text-[#92400E] font-bold mb-4">
                  <span className="bg-[#92400E]/10 px-2.5 py-1 rounded-md border border-[#92400E]/30 uppercase">{article.category}</span>
                  <span>•</span>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  {article.read_time && (
                    <>
                      <span>•</span>
                      <span>{article.read_time}</span>
                    </>
                  )}
                </div>

                <h2 className="font-heading text-2xl md:text-3xl font-black uppercase leading-tight hover:text-[#92400E] transition-colors cursor-pointer">
                  {article.title}
                </h2>
                
                {article.summary && (
                  <p className="text-[#FFF8E1]/70 font-semibold mt-3 text-sm md:text-base leading-relaxed">
                    {article.summary}
                  </p>
                )}

                <div className="mt-6 pt-6 border-t border-[#92400E]/10 text-sm text-[#FFF8E1]/80 leading-relaxed font-medium whitespace-pre-wrap">
                  {article.content}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#92400E]/20 border border-[#92400E]/50 flex items-center justify-center font-mono font-black text-xs text-[#92400E]">
                      {article.author ? article.author.charAt(0) : "A"}
                    </div>
                    <span className="font-mono text-xs font-bold text-[#FFF8E1]/60">Written by {article.author || "Qiveo Admin"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
