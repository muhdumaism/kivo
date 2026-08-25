import { Link } from "react-router-dom";
import { Download, Sparkles } from "lucide-react";
import { getCategoryName } from "@/content/games";

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function ItemCard({ item }) {
  return (
    <Link to={`/${item.category || "item"}/${item.slug}`} data-testid={`item-card-${item.slug}`} className="group block">
      <div className="bg-[#171512] border-2 border-[#92400E] rounded-3xl p-3.5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
        <div className="relative overflow-hidden rounded-2xl aspect-square border-2 border-[#92400E] bg-[#24201A]">
          <img src={item.icon} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            <span className="font-mono text-[9px] uppercase tracking-wider bg-[#F5C542] text-[#171512] px-2.5 py-0.5 rounded-full border border-[#92400E] font-bold">
              {item.rarity}
            </span>
            {item.contains_ai && (
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider bg-[#24201A] text-amber px-2.5 py-0.5 rounded-full border border-amber font-bold" title="Contains AI-generated content">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            )}
          </div>
          {item.staff_pick && (
            <span className="absolute top-2 right-2 font-mono text-[9px] uppercase tracking-widest bg-[#F5C542] text-[#171512] px-2 py-0.5 rounded-full border border-[#92400E] font-bold">
              PICK
            </span>
          )}
          <span className="absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-widest bg-[#F5C542] text-[#171512] px-2 py-0.5 rounded-full border border-[#92400E] font-bold">
            {getCategoryName(item.game_slug, item.category)}
          </span>
        </div>
        <div className="pt-3 pb-1">
          <h3 className="font-heading font-extrabold text-base text-[#FFF8E1] truncate group-hover:underline">{item.title}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-mono text-[10px] uppercase text-[#FFF8E1]/70 font-semibold">BY {item.author_name.toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-[#92400E]/30">
            <span className="font-mono text-xs font-extrabold text-[#FFF8E1] uppercase tracking-wide">Free</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-[#FFF8E1]/60 font-medium">
              <Download className="w-3.5 h-3.5 text-[#FFF8E1]/60" />
              {fmt(item.downloads)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export { fmt };
