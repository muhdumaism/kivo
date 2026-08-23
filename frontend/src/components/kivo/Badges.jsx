import { CheckCircle2, Clock, XCircle, ShieldAlert, AlertTriangle, BadgeCheck } from "lucide-react";

const STATUS = {
  approved: { label: "Approved", cls: "border-moss text-moss", Icon: CheckCircle2 },
  in_review: { label: "In Review", cls: "border-mustard text-mustard", Icon: Clock },
  changes_requested: { label: "Changes Req", cls: "border-mustard text-mustard", Icon: AlertTriangle },
  rejected: { label: "Rejected", cls: "border-rust text-rust", Icon: XCircle },
  quarantined: { label: "Quarantined", cls: "border-rust text-rust", Icon: ShieldAlert },
  draft: { label: "Draft", cls: "border-slate-light text-warm/60", Icon: Clock },
};

export function StatusBadge({ status, testid }) {
  const s = STATUS[status] || STATUS.draft;
  const { Icon } = s;
  return (
    <span data-testid={testid} className={`inline-flex items-center gap-1.5 border ${s.cls} px-2 py-0.5 font-mono text-xs uppercase tracking-wider`}>
      <Icon className="w-3.5 h-3.5" /> {s.label}
    </span>
  );
}

const TRUST = {
  new: "border-slate-light text-warm/60",
  established: "border-teal-light text-teal-light",
  verified: "border-amber text-amber",
};

export function TrustBadge({ tier, testid }) {
  return (
    <span data-testid={testid} className={`inline-flex items-center gap-1 border ${TRUST[tier] || TRUST.new} px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest`}>
      {tier === "verified" && <BadgeCheck className="w-3 h-3" />}{tier}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-amber" title="Verified Creator">
      <BadgeCheck className="w-4 h-4" />
    </span>
  );
}
