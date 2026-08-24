import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/qiveo/Navbar";
import { StatusBadge } from "@/components/qiveo/Badges";
import { fmt } from "@/components/qiveo/ModCard";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Upload, Download, Star, Package, Clock, Plus } from "lucide-react";
import UploadVersionModal from "@/components/qiveo/UploadVersionModal";

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
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-lavender2/60">Creator Studio</span>
            <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-warm mt-1">Your drops</h1>
          </div>
          <Link to="/creator/new" data-testid="new-mod-btn" className="shine flex items-center gap-2 bg-coral text-ink px-5 py-3 rounded-full text-sm font-bold hover:-translate-y-0.5 transition-transform glow-coral">
            <Plus className="w-4 h-4" />New drop
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard icon={Download} label="Total Grabs" value={fmt(stats.total_downloads)} />
            <KpiCard icon={Package} label="Drops" value={stats.total_mods} />
            <KpiCard icon={Star} label="Avg Rating" value={stats.avg_rating || "—"} />
            <KpiCard icon={Clock} label="In Review" value={stats.in_review} />
          </div>
        )}

        {stats?.trend && (
          <div className="bg-slate border border-slate-light rounded-2xl p-5 mb-8">
            <h3 className="font-mono text-xs uppercase tracking-widest text-coral2 mb-4">Downloads · Last 14 Days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E2456" vertical={false} />
                <XAxis dataKey="day" stroke="#A78BFA80" fontSize={11} fontFamily="IBM Plex Mono" />
                <YAxis stroke="#A78BFA80" fontSize={11} fontFamily="IBM Plex Mono" />
                <Tooltip contentStyle={{ background: "#191233", border: "1px solid #2E2456", borderRadius: 12, fontFamily: "IBM Plex Mono", fontSize: 12 }} cursor={{ fill: "#7C3AED22" }} />
                <Bar dataKey="downloads" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <h2 className="font-heading text-xl font-bold text-warm mb-4">My drops</h2>
        <div className="space-y-3">
          {mods.length === 0 && <div className="border border-dashed border-slate-light rounded-2xl p-10 text-center text-warm/40 font-mono">No drops yet. Create your first one.</div>}
          {mods.map((m) => (
            <div key={m.id} data-testid={`creator-mod-${m.slug}`} className="bg-slate border border-slate-light rounded-2xl p-4 flex items-center gap-4 flex-wrap">
              <img src={m.icon} alt="" className="w-12 h-12 rounded-xl border border-slate-light bg-charcoal object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={`/item/${m.slug}`} className="font-heading font-bold text-warm hover:text-coral2 transition-colors">{m.title}</Link>
                <p className="font-mono text-xs text-warm/50">{m.version_count} versions · {fmt(m.downloads)} grabs</p>
              </div>
              {m.review_reason && m.status !== "approved" && <p className="font-mono text-xs text-mustard max-w-xs">"{m.review_reason}"</p>}
              <StatusBadge status={m.status} testid={`creator-status-${m.slug}`} />
              <Link to={`/project/${m.slug}/edit`} data-testid={`edit-mod-${m.slug}`} className="flex items-center gap-1.5 bg-plum2 border border-plumborder text-lavender2 px-4 py-2 rounded-full text-xs font-bold hover:-translate-y-0.5 transition-transform hover:text-warm hover:border-violet/60">
                Go to
              </Link>
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
    <div className="bg-slate border border-slate-light rounded-2xl p-4">
      <Icon className="w-5 h-5 text-lavender2" />
      <p className="font-heading text-2xl font-extrabold text-warm mt-2">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-warm/40">{label}</p>
    </div>
  );
}
