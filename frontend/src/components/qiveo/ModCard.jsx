import { Link } from "react-router-dom";
import { Download } from "lucide-react";

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function ItemCard({ item }) {
  return (
    <Link to={`/item/${item.slug}`} data-testid={`item-card-${item.slug}`} className="group block">
      <div className="bg-[#0A0A0C] border-2 border-[#E9D5FF] rounded-3xl p-3.5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
        <div className="relative overflow-hidden rounded-2xl aspect-square border-2 border-[#E9D5FF] bg-[#15141E]">
          <img src={item.icon} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-2 left-2">
            <span className="font-mono text-[9px] uppercase tracking-wider bg-[#E9D5FF] text-[#0A0A0C] px-2.5 py-0.5 rounded-full border border-[#E9D5FF] font-bold">
              {item.rarity}
            </span>
          </div>
          {item.staff_pick && (
            <span className="absolute top-2 right-2 font-mono text-[9px] uppercase tracking-widest bg-[#E9D5FF] text-[#0A0A0C] px-2 py-0.5 rounded-full border border-[#E9D5FF] font-bold">
              PICK
            </span>
          )}
          <span className="absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-widest bg-[#E9D5FF] text-[#0A0A0C] px-2 py-0.5 rounded-full border border-[#E9D5FF] font-bold">
            {item.item_type}
          </span>
        </div>
        <div className="pt-3 pb-1">
          <h3 className="font-heading font-extrabold text-base text-[#E9D5FF] truncate group-hover:underline">{item.title}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-mono text-[10px] uppercase text-[#E9D5FF]/70 font-semibold">BY {item.author_name.toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-[#E9D5FF]/30">
            <span className="font-mono text-xs font-extrabold text-[#E9D5FF] uppercase tracking-wide">Free</span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-[#E9D5FF]/60 font-medium">
              <Download className="w-3.5 h-3.5 text-[#E9D5FF]/60" />
              {fmt(item.downloads)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export { fmt };
