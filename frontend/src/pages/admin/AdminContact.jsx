import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Loader2, Mail, Calendar, MessageSquare, AlertCircle } from "lucide-react";

export default function AdminContact() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/admin/contact")
      .then((r) => {
        setSubmissions(r.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    try {
      await api.delete(`/admin/contact/${id}`);
      toast.success("Submission deleted successfully");
      load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    }
  };

  return (
    <div className="text-[#E9D5FF] space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-black uppercase tracking-tight">Contact Inquiries</h1>
        <p className="font-mono text-xs text-[#E9D5FF]/40 uppercase tracking-widest mt-1">// manage messages and user reports from contact form</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
          <span className="font-mono text-xs text-[#E9D5FF]/40">Loading contact submissions...</span>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] max-w-xl mx-auto">
          <AlertCircle className="w-10 h-10 text-[#E9D5FF]/30 mx-auto mb-4" />
          <p className="font-mono text-sm text-[#E9D5FF]/50 font-bold">No inquiries submitted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((sub) => (
            <div 
              key={sub.id} 
              className="bg-[#15141E] border-2 border-[#E9D5FF] rounded-3xl p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
            >
              <div>
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-[#E9D5FF]/10 mb-4">
                  <div>
                    <h3 className="font-heading font-extrabold text-base uppercase tracking-tight text-[#E9D5FF]">{sub.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs font-bold text-[#8B5CF6]">{sub.name}</span>
                      <span className="text-[#E9D5FF]/30 text-xs">•</span>
                      <span className="font-mono text-xs text-[#E9D5FF]/50">{sub.email}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <a 
                      href={`mailto:${sub.email}?subject=RE: ${sub.subject}`}
                      className="w-8 h-8 rounded-lg border border-[#E9D5FF]/20 text-[#E9D5FF]/60 hover:text-[#8B5CF6] hover:border-[#8B5CF6] grid place-items-center transition-colors"
                      title="Reply by Mail"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="w-8 h-8 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500 grid place-items-center transition-colors"
                      title="Delete inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs md:text-sm text-[#E9D5FF]/80 leading-relaxed font-semibold font-mono bg-[#0A0A0C]/50 p-4 rounded-xl border border-[#E9D5FF]/5 whitespace-pre-wrap">
                  {sub.message}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E9D5FF]/10 flex items-center justify-between text-[10px] font-mono text-[#E9D5FF]/40">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#E9D5FF]/30" /> {new Date(sub.created_at).toLocaleString()}</span>
                <span className="bg-[#E9D5FF]/5 px-2 py-0.5 rounded uppercase font-bold text-[9px] tracking-wide text-[#E9D5FF]/60">ID: {sub.id.substring(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
