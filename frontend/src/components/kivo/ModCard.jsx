import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { RarityBadge, VerifiedBadge } from "./Badges";
import { CornerFrame } from "./CornerFrame";

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function ItemCard({ item }) {
  return (
    <Link to={`/${item.category || "item"}/${item.slug}`} data-testid={`item-card-${item.slug}`} className="group block">
      <CornerFrame hover className="bg-plum border border-plumborder rounded-2xl p-2.5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-violet/60 group-hover:glow-violet">
        <div className="relative overflow-hidden rounded-xl aspect-square bg-gradient-to-br from-plum2 to-ink">
          <img src={item.icon} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-2 left-2"><RarityBadge rarity={item.rarity} /></div>
          {item.staff_pick && <span className="absolute top-2 right-2 font-mono text-[9px] uppercase tracking-widest bg-coral text-ink px-1.5 py-0.5 rounded-full">Pick</span>}
          <span className="absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-widest bg-ink/70 text-lavender2 px-1.5 py-0.5 rounded-full backdrop-blur">{item.item_type}</span>
        </div>
        <div className="px-1.5 pt-3 pb-1.5">
          <h3 className="font-heading font-bold text-warm truncate group-hover:text-coral2 transition-colors">{item.title}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${item.author_name}`} alt="" className="w-4 h-4 rounded-full bg-plum2" />
            <span className="text-xs text-lavender2/70 truncate">@{item.author_name}</span>
            {item.author_verified && <VerifiedBadge />}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-plumborder">
            <span className="font-mono text-xs font-bold text-mint uppercase tracking-wide">Free</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-lavender2/60"><Download className="w-3.5 h-3.5" />{fmt(item.downloads)}</span>
          </div>
        </div>
      </CornerFrame>
    </Link>
  );
}

export { fmt };
