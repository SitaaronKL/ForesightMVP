"use client";

import Link from "next/link";
import { BillingBadge } from "./RiskBadge";
import { RiskTierBadge } from "./RiskTierBadge";

export function PatientCard({ patient: p }: { patient: any }) {
  const conditions: string[] = Array.isArray(p.chronicConditions)
    ? p.chronicConditions
    : [];
  const conditionsText = conditions.join(", ");

  return (
    <Link
      href={`/patient/${p._id}`}
      className="group flex flex-col gap-2 p-3 rounded-2xl bg-white/70 hover:bg-white/90 transition border border-brand-100 min-w-0 shadow-sm hover:shadow"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <RiskTierBadge score={p.riskScore} tier={p.tier} />
        <BillingBadge program={p.billingProgram} />
      </div>
      <div className="font-semibold text-brand-950 text-sm truncate">
        {p.firstName} {p.lastName}
      </div>
      {conditionsText && (
        <div
          className="text-[11px] text-brand-500 truncate"
          title={conditionsText}
        >
          {conditionsText}
        </div>
      )}
      {p.urgencyReason && (
        <div
          className="mt-auto text-[11px] text-brand-600 truncate"
          title={p.urgencyReason}
        >
          {p.urgencyReason}
        </div>
      )}
    </Link>
  );
}
