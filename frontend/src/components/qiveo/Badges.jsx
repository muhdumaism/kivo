import { Sparkles, Gem, Star, Circle } from "lucide-react";

const RARITY = {
  Common: { cls: "border-lavender/50 text-lavender2 bg-ink/60 backdrop-blur", Icon: Circle },
  Rare: { cls: "border-violet2/60 text-violet2 bg-ink/60 backdrop-blur", Icon: Star },
  Epic: { cls: "border-coral/60 text-coral2 bg-ink/60 backdrop-blur", Icon: Sparkles },
  Legendary: { cls: "border-gold/70 text-gold bg-ink/60 backdrop-blur", Icon: Gem },
};

export function RarityBadge({ rarity, testid, className = "" }) {
  if (!rarity) return null;
  const r = RARITY[rarity] || RARITY.Common;
  const { Icon } = r;
  return (
    <span data-testid={testid} className={`inline-flex items-center gap-1 border ${r.cls} px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-widest ${className}`}>
      <Icon className="w-3 h-3" /> {rarity}
    </span>
  );
}

const STATUS = {
  approved: "border-mint/50 text-mint bg-mint/10",
  in_review: "border-gold/50 text-gold bg-gold/10",
  changes_requested: "border-gold/50 text-gold bg-gold/10",
  rejected: "border-rose/50 text-rose bg-rose/10",
  quarantined: "border-rose/50 text-rose bg-rose/10",
  draft: "border-lavender/30 text-lavender2/70 bg-white/5",
};
const STATUS_LABEL = { approved: "Live", in_review: "In Review", changes_requested: "Changes Req", rejected: "Rejected", quarantined: "Quarantined", draft: "Draft" };

export function StatusBadge({ status, testid }) {
  return (
    <span data-testid={testid} className={`inline-flex items-center gap-1.5 border ${STATUS[status] || STATUS.draft} px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

const TRUST = { new: "border-lavender/30 text-lavender2/70", established: "border-violet/50 text-violet2", verified: "border-coral/50 text-coral2" };
export function TrustBadge({ tier, testid }) {
  return (
    <span data-testid={testid} className={`inline-flex items-center gap-1 border ${TRUST[tier] || TRUST.new} px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-widest`}>{tier}</span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-coral text-ink" title="Verified Creator">
      <Sparkles className="w-2.5 h-2.5" />
    </span>
  );
}
