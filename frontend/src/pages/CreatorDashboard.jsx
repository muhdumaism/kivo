import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/kivo/Navbar";
import { StatusBadge } from "@/components/kivo/Badges";
import { fmt } from "@/components/kivo/ModCard";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Upload, Download, Star, Package, Clock, Plus } from "lucide-react";
import UploadVersionModal from "@/components/kivo/UploadVersionModal";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [mods, setMods] = useState([]);
  const [stats, setStats] = useState(null);
  const [uploadFor, setUploadFor] = useState(null);

  const load = () => {
    api.get("/creator/mods").then((r) => setMods(r.data));
    api.get("/creator/analytics").then((r) => setStats(r.data));
  };
  useEffect(load, []);

  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-warm/50">Creator Studio</span>
            <h1 className="font-heading text-3xl lg:text-4xl font-black uppercase tracking-tighter text-warm mt-1">Dashboard</h1>
          </div>
          <Link to="/creator/new" data-testid="new-mod-btn" className="flex items-center gap-2 bg-amber text-charcoal px-5 py-3 font-mono text-xs uppercase tracking-wide font-bold hover:-translate-y-0.5 transition-transform hard-shadow-teal">
            <Plus className="w-4 h-4" />New Mod
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard icon={Download} label="Total Downloads" value={fmt(stats.total_downloads)} />
            <KpiCard icon={Package} label="Projects" value={stats.total_mods} />
            <KpiCard icon={Star} label="Avg Rating" value={stats.avg_rating || "—"} />
            <KpiCard icon={Clock} label="In Review" value={stats.in_review} />
          </div>
        )}

        {stats?.trend && (
          <div className="bg-slate border border-slate-light p-5 mb-8">
            <h3 className="font-mono text-xs uppercase tracking-widest text-amber mb-4">Downloads · Last 14 Days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#353A45" vertical={false} />
                <XAxis dataKey="day" stroke="#EDEAE280" fontSize={11} fontFamily="IBM Plex Mono" />
                <YAxis stroke="#EDEAE280" fontSize={11} fontFamily="IBM Plex Mono" />
                <Tooltip contentStyle={{ background: "#1A1D23", border: "1px solid #353A45", fontFamily: "IBM Plex Mono", fontSize: 12 }} cursor={{ fill: "#F2A93C22" }} />
                <Bar dataKey="downloads" fill="#0F6E6E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <h2 className="font-heading text-xl font-bold text-warm mb-4">My Projects</h2>
        <div className="space-y-3">
          {mods.length === 0 && <div className="border border-dashed border-slate-light p-10 text-center text-warm/40 font-mono">No mods yet. Create your first project.</div>}
          {mods.map((m) => (
            <div key={m.id} data-testid={`creator-mod-${m.slug}`} className="bg-slate border border-slate-light p-4 flex items-center gap-4 flex-wrap">
              <img src={m.icon} alt="" className="w-12 h-12 border border-slate-light bg-charcoal" />
              <div className="min-w-0 flex-1">
                <Link to={`/mod/${m.slug}`} className="font-heading font-bold text-warm hover:text-amber transition-colors">{m.title}</Link>
                <p className="font-mono text-xs text-warm/50">{m.version_count} versions · {fmt(m.downloads)} downloads</p>
              </div>
              {m.review_reason && m.status !== "approved" && <p className="font-mono text-xs text-mustard max-w-xs">"{m.review_reason}"</p>}
              <StatusBadge status={m.status} testid={`creator-status-${m.slug}`} />
              <button data-testid={`upload-version-${m.slug}`} onClick={() => setUploadFor(m)} className="flex items-center gap-1.5 bg-teal text-warm px-3 py-2 font-mono text-xs uppercase tracking-wide border border-teal-light hover:-translate-y-0.5 transition-transform">
                <Upload className="w-3.5 h-3.5" />Version
              </button>
            </div>
          ))}
        </div>
      </div>

      {uploadFor && <UploadVersionModal mod={uploadFor} onClose={() => setUploadFor(null)} onDone={() => { setUploadFor(null); load(); }} />}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate border border-slate-light p-4">
      <Icon className="w-5 h-5 text-teal-light" />
      <p className="font-heading text-2xl font-black text-warm mt-2">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-warm/40">{label}</p>
    </div>
  );
}
