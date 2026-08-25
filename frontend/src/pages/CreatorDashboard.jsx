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
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#FFF8E1]/60">Creator Studio</span>
            <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-[#FFF8E1] mt-1">Your drops</h1>
          </div>
          <Link to="/creator/new" data-testid="new-mod-btn" className="flex items-center gap-2 bg-[#F5C542] text-[#171512] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#FFD84D] hover:-translate-y-0.5 transition-all">
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
          <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-6 mb-8">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#F5C542] mb-6 font-bold">Downloads · Last 14 Days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#92400E" opacity={0.3} vertical={false} />
                <XAxis dataKey="day" stroke="#FFF8E1" opacity={0.5} fontSize={11} fontFamily="IBM Plex Mono" />
                <YAxis stroke="#FFF8E1" opacity={0.5} fontSize={11} fontFamily="IBM Plex Mono" />
                <Tooltip contentStyle={{ background: "#171512", border: "1px solid #92400E", borderRadius: 12, fontFamily: "IBM Plex Mono", fontSize: 12, color: "#FFF8E1" }} cursor={{ fill: "#FFF8E1", opacity: 0.05 }} />
                <Bar dataKey="downloads" fill="#F5C542" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <h2 className="font-heading text-xl font-bold text-[#FFF8E1] mb-4">My drops</h2>
        <div className="space-y-4">
          {mods.length === 0 && <div className="border border-dashed border-[#92400E]/50 rounded-3xl p-12 text-center text-[#FFF8E1]/40 font-mono font-bold">No drops yet. Create your first one.</div>}
          {mods.map((m) => (
            <div key={m.id} data-testid={`creator-mod-${m.slug}`} className="bg-[#24201A] border border-[#92400E] rounded-2xl p-4 flex items-center gap-4 flex-wrap transition-colors hover:border-[#F5C542]/50">
              <img src={m.icon} alt="" className="w-14 h-14 rounded-xl border border-[#92400E] bg-[#171512] object-cover" />
              <div className="min-w-0 flex-1">
                <Link to={`/${m.category || "item"}/${m.slug}`} className="font-heading font-bold text-[#FFF8E1] hover:text-[#F5C542] transition-colors">{m.title}</Link>
                <p className="font-mono text-xs text-[#FFF8E1]/50 mt-1">{m.version_count} versions · {fmt(m.downloads)} grabs</p>
              </div>
              {m.review_reason && m.status !== "approved" && <p className="font-mono text-xs text-[#F59E0B] max-w-xs bg-[#F59E0B]/10 px-3 py-1.5 rounded-lg">"{m.review_reason}"</p>}
              <StatusBadge status={m.status} testid={`creator-status-${m.slug}`} />
              <Link to={`/project/${m.slug}/edit`} data-testid={`edit-mod-${m.slug}`} className="flex items-center gap-1.5 bg-[#171512] border border-[#92400E] text-[#FFF8E1] px-5 py-2.5 rounded-full text-xs font-bold hover:-translate-y-0.5 transition-transform hover:border-[#F5C542] hover:text-[#F5C542]">
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
    <div className="bg-[#24201A] border border-[#92400E] rounded-3xl p-5">
      <Icon className="w-5 h-5 text-[#F5C542] mb-3" />
      <p className="font-heading text-3xl font-black text-[#FFF8E1] tracking-tight">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#FFF8E1]/50 mt-1 font-bold">{label}</p>
    </div>
  );
}
