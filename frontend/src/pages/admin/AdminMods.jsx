import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { fmt } from "@/components/qiveo/ModCard";
import { StatusBadge } from "@/components/qiveo/Badges";
import { Check, X, AlertTriangle, Trash2, Eye, ExternalLink, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminMods() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  
  const [selected, setSelected] = useState([]);
  const [reasonFor, setReasonFor] = useState(null);

  const load = () => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (category) params.append("category", category);
    
    api.get(`/admin/mods?${params.toString()}`)
       .then(r => setData(r.data))
       .catch(e => toast.error(apiError(e.response?.data?.detail)));
  };

  useEffect(() => { load(); }, [page, search, status, category]);

  const toggleAll = () => {
    if (selected.length === data.items.length && data.items.length > 0) setSelected([]);
    else setSelected(data.items.map(m => m.id));
  };
  
  const toggleOne = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const moderateOne = async (id, action, reason = "") => {
    try {
      await api.post(`/admin/mods/${id}/moderate`, { action, reason });
      toast.success(`[${action.toUpperCase()}] executed.`);
      setReasonFor(null);
      load();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const bulkModerate = async (action, reason = "") => {
    try {
      await api.post(`/admin/mods/bulk`, { mod_ids: selected, action, reason });
      toast.success(`Bulk ${action} executed on ${selected.length} items.`);
      setSelected([]);
      setReasonFor(null);
      load();
    } catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };

  const handleAction = (id, action, title) => {
    if (["reject", "request_changes", "quarantine", "flag", "delete"].includes(action)) {
      setReasonFor({ id, action, title });
    } else {
      if (id === "bulk") bulkModerate(action);
      else moderateOne(id, action);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm mb-1">Mod Moderation</h1>
      <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-6">// browse and manage all projects</p>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-slate border border-slate-light p-4 rounded-2xl mb-4 shadow-[3px_3px_0px_0px_rgba(251,191,36,0.3)]">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-warm/40" />
          <input 
            type="text" 
            placeholder="Search by title or author..." 
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm font-mono text-warm placeholder-warm/40 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-4">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="bg-charcoal text-xs font-mono text-warm border border-slate-light rounded px-2 py-1 outline-none focus:border-amber">
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="in_review">In Review</option>
            <option value="draft">Draft</option>
            <option value="flagged">Flagged</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="bg-charcoal text-xs font-mono text-warm border border-slate-light rounded px-2 py-1 outline-none focus:border-amber">
            <option value="">All Categories</option>
            <option value="mod">Mods</option>
            <option value="plugin">Plugins</option>
            <option value="modpack">Modpacks</option>
            <option value="shader">Shaders</option>
            <option value="resource_pack">Resource Packs</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between bg-charcoal border border-amber p-3 rounded-xl mb-4">
          <span className="font-mono text-xs text-amber font-bold">{selected.length} items selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handleAction("bulk", "approve", "Selected items")} className="bg-teal text-ink px-3 py-1.5 rounded text-[10px] font-bold font-mono uppercase hover:opacity-80 transition-opacity">Approve</button>
            <button onClick={() => handleAction("bulk", "reject", "Selected items")} className="bg-coral text-ink px-3 py-1.5 rounded text-[10px] font-bold font-mono uppercase hover:opacity-80 transition-opacity">Reject</button>
            <button onClick={() => handleAction("bulk", "flag", "Selected items")} className="bg-mustard text-ink px-3 py-1.5 rounded text-[10px] font-bold font-mono uppercase hover:opacity-80 transition-opacity">Flag</button>
            <button onClick={() => handleAction("bulk", "delete", "Selected items")} className="bg-red-500 text-white px-3 py-1.5 rounded text-[10px] font-bold font-mono uppercase hover:opacity-80 transition-opacity">Delete</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-light rounded-2xl overflow-hidden bg-slate mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-light text-[10px] font-mono text-warm/40 uppercase tracking-widest bg-charcoal">
                <th className="p-3 w-10 text-center"><input type="checkbox" checked={data.items.length > 0 && selected.length === data.items.length} onChange={toggleAll} className="accent-amber w-3.5 h-3.5" /></th>
                <th className="p-3">Project</th>
                <th className="p-3">Author</th>
                <th className="p-3">Status</th>
                <th className="p-3">Stats</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-light text-sm font-mono text-warm">
              {data.items.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-warm/40">No projects found matching criteria.</td></tr>
              )}
              {data.items.map(m => (
                <tr key={m.id} className="hover:bg-charcoal/50 transition-colors group">
                  <td className="p-3 text-center"><input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleOne(m.id)} className="accent-amber w-3.5 h-3.5" /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={m.icon} alt="" className="w-9 h-9 rounded border border-slate-light bg-charcoal object-cover shrink-0" />
                      <div className="min-w-0">
                        <Link to={`/${m.category || "item"}/${m.slug}`} className="font-heading font-bold text-warm hover:text-amber transition-colors flex items-center gap-1.5 truncate" target="_blank" rel="noreferrer">
                          {m.title} <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                        </Link>
                        <p className="text-[10px] text-warm/50 mt-0.5 truncate">{m.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs truncate max-w-[150px]">{m.author_name}</td>
                  <td className="p-3"><StatusBadge status={m.status} /></td>
                  <td className="p-3 text-[10px] text-warm/50 whitespace-nowrap">
                    {fmt(m.downloads || 0)} DLs<br />
                    {m.version_count || 0} Ver
                  </td>
                  <td className="p-3 text-right flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleAction(m.id, "approve", m.title)} className="text-teal hover:bg-teal/10 p-1.5 rounded transition-colors" title="Approve"><Check className="w-4 h-4" /></button>
                    <button onClick={() => handleAction(m.id, "reject", m.title)} className="text-coral hover:bg-coral/10 p-1.5 rounded transition-colors" title="Reject"><X className="w-4 h-4" /></button>
                    <button onClick={() => handleAction(m.id, "flag", m.title)} className="text-mustard hover:bg-mustard/10 p-1.5 rounded transition-colors" title="Flag"><AlertTriangle className="w-4 h-4" /></button>
                    <button onClick={() => handleAction(m.id, "delete", m.title)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between font-mono text-xs text-warm/50 px-2">
        <div>Total: {data.total} items</div>
        <div className="flex items-center gap-4 bg-charcoal border border-slate-light px-3 py-1.5 rounded-lg">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 hover:text-warm disabled:opacity-30 transition-colors flex items-center"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-bold text-warm min-w-[60px] text-center">Page {page}</span>
          <button disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)} className="p-1 hover:text-warm disabled:opacity-30 transition-colors flex items-center"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {reasonFor && (
        <ReasonModal 
          info={reasonFor} 
          onClose={() => setReasonFor(null)} 
          onSubmit={(r) => reasonFor.id === "bulk" ? bulkModerate(reasonFor.action, r) : moderateOne(reasonFor.id, reasonFor.action, r)} 
        />
      )}
    </div>
  );
}

function ReasonModal({ info, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="bg-slate border-2 border-slate-light w-full max-w-md p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-warm/50 hover:text-warm transition-colors"><X className="w-5 h-5" /></button>
        <h3 className="font-heading text-xl font-bold text-warm mb-1">Confirm {info.action}</h3>
        <p className="font-mono text-xs text-warm/50 mb-4 uppercase tracking-widest truncate">{info.title}</p>
        
        <label className="block font-mono text-[10px] text-coral2 uppercase tracking-widest mb-2">Reason (required)</label>
        <textarea 
          autoFocus
          value={reason} 
          onChange={e => setReason(e.target.value)}
          className="w-full h-24 bg-charcoal border border-slate-light rounded-lg text-warm text-sm p-3 font-mono resize-none outline-none focus:border-amber transition-colors mb-4"
          placeholder="Explain the reason for this action... (sent to author)"
        />
        
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-mono text-xs text-warm hover:text-amber transition-colors">Cancel</button>
          <button 
            disabled={!reason.trim()} 
            onClick={() => onSubmit(reason)}
            className="bg-amber text-ink px-4 py-2 rounded font-mono font-bold text-xs uppercase disabled:opacity-50 hover:-translate-y-0.5 transition-transform"
          >
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
}
