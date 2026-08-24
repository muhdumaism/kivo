import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { toast } from "sonner";
import { Activity, TrendingUp, Users, ThumbsUp, ShieldCheck } from "lucide-react";
import { fmt } from "@/components/qiveo/ModCard";

export default function Anomaly() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/admin/anomalies").then((r) => setData(r.data)).catch((e) => toast.error(apiError(e.response?.data?.detail))); }, []);
  if (!data) return null;

  const clean = !data.download_spikes.length && !data.signup_clusters.length && !data.vote_manipulation.length;

  return (
    <div>
      <h1 className="font-heading text-3xl font-black uppercase tracking-tighter text-warm mb-1 flex items-center gap-2"><Activity className="w-6 h-6 text-rust" />Anomaly Detection</h1>
      <p className="font-mono text-xs text-warm/50 uppercase tracking-widest mb-8">// bot farms · vote manipulation · mass signups</p>

      {clean && (
        <div className="border border-moss/40 bg-moss/10 p-6 flex items-center gap-3 text-moss font-mono text-sm">
          <ShieldCheck className="w-5 h-5" />All clear. No anomalous patterns detected in current window.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel icon={TrendingUp} title="Download Spikes" count={data.download_spikes.length}>
          {data.download_spikes.map((s, i) => (
            <Row key={i} testid={`spike-${i}`} main={s.mod} meta={`${fmt(s.downloads)} dl / ${s.reviews} reviews · ratio ${fmt(s.ratio)}`} />
          ))}
        </Panel>
        <Panel icon={ThumbsUp} title="Vote Manipulation" count={data.vote_manipulation.length}>
          {data.vote_manipulation.map((s, i) => (
            <Row key={i} testid={`vote-${i}`} main={s.mod} meta={`suspicious download/review ratio ${fmt(s.ratio)}`} />
          ))}
        </Panel>
        <Panel icon={Users} title="Mass Signup Clusters" count={data.signup_clusters.length}>
          {data.signup_clusters.map((s, i) => (
            <Row key={i} testid={`signup-${i}`} main={s.day} meta={`${s.accounts} accounts created same day`} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, count, children }) {
  return (
    <div className="bg-slate border border-slate-light">
      <div className="flex items-center justify-between p-4 border-b border-slate-light">
        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-warm"><Icon className="w-4 h-4 text-amber" />{title}</h3>
        <span className={`font-mono text-xs px-2 py-0.5 border ${count ? "border-rust text-rust" : "border-moss text-moss"}`}>{count}</span>
      </div>
      <div className="divide-y divide-slate-light/50">
        {count === 0 ? <p className="p-4 font-mono text-xs text-warm/40">No flags.</p> : children}
      </div>
    </div>
  );
}

const Row = ({ main, meta, testid }) => (
  <div data-testid={testid} className="p-3">
    <p className="text-warm text-sm font-mono">{main}</p>
    <p className="text-rust/80 text-xs font-mono">{meta}</p>
  </div>
);
