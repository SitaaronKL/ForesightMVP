import Link from "next/link";
import { RiskBadge, TierBadge, BillingBadge } from "./RiskBadge";

export function PatientPill({ patient: p }: { patient: any }) {
  return (
    <Link
      href={`/patient/${p._id}`}
      className="flex items-center justify-between gap-3 pl-2 pr-4 py-2 rounded-full bg-white/60 hover:bg-white/90 transition border border-brand-100 min-w-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <RiskBadge score={p.riskScore} />
        <TierBadge tier={p.tier} />
        <BillingBadge program={p.billingProgram} />
        <span className="font-medium text-brand-900 truncate">
          {p.firstName} {p.lastName}
        </span>
      </div>
      <span className="text-xs text-brand-600 truncate flex-shrink min-w-0 max-w-[45%] text-right">
        {p.urgencyReason}
      </span>
    </Link>
  );
}
