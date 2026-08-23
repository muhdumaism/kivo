import { Link } from "react-router-dom";
import { Download, Star, Package } from "lucide-react";
import { VerifiedBadge } from "./Badges";

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function ModCard({ mod }) {
  return (
    <Link
      to={`/mod/${mod.slug}`}
      data-testid={`mod-card-${mod.slug}`}
      className="group block bg-slate border border-slate-light p-4 transition-transform duration-150 hover:-translate-y-1 hover:hard-shadow-teal"
    >
      <div className="flex gap-4">
        <img src={mod.icon} alt={mod.title} className="w-16 h-16 border border-slate-light bg-charcoal shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-heading font-bold text-warm truncate group-hover:text-amber transition-colors">{mod.title}</h3>
            {mod.author_verified && <VerifiedBadge />}
          </div>
          <p className="text-xs text-warm/50 font-mono mt-0.5">by {mod.author_name}</p>
          <p className="text-sm text-warm/70 mt-1.5 line-clamp-2">{mod.summary}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-light">
        <div className="flex gap-3 font-mono text-xs text-warm/60">
          <span className="inline-flex items-center gap-1"><Download className="w-3.5 h-3.5 text-teal-light" />{fmt(mod.downloads)}</span>
          <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber" />{mod.rating_avg || "—"}</span>
          <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" />{mod.category}</span>
        </div>
        {mod.staff_pick && <span className="font-mono text-[10px] uppercase tracking-widest border border-amber text-amber px-1.5">Staff Pick</span>}
      </div>
    </Link>
  );
}

export { fmt };
