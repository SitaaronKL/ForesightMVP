import Link from "next/link";
import { RiskBadge, TierBadge, BillingBadge } from "./RiskBadge";
import { HelpHint } from "./HelpHint";

const TIER_LABEL: Record<string, string> = {
  level_3: "Level 3 (highest acuity)",
  level_2: "Level 2 (moderate acuity)",
  level_1: "Level 1 (stable)",
};

const PROGRAM_LABEL: Record<string, string> = {
  CCM: "Chronic Care Management",
  PCM: "Principal Care Management (single condition)",
  APCM: "Advanced Primary Care Management",
};

export function PatientPill({ patient: p }: { patient: any }) {
  const conditions: string[] = Array.isArray(p.chronicConditions)
    ? p.chronicConditions
    : [];
  const tierLabel = TIER_LABEL[String(p.tier).toLowerCase()] ?? p.tier;
  const programKey = String(p.billingProgram ?? "").toUpperCase();
  const programLabel = PROGRAM_LABEL[programKey] ?? p.billingProgram;

  return (
    <Link
      href={`/patient/${p._id}`}
      className="flex items-center justify-between gap-3 pl-2 pr-4 py-2 rounded-full bg-white/60 hover:bg-white/90 transition border border-brand-100 min-w-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <RiskBadge score={p.riskScore} />
        <TierBadge tier={p.tier} />
        <BillingBadge program={p.billingProgram} />
        <span className="font-medium text-brand-950 truncate">
          {p.firstName} {p.lastName}
        </span>
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="flex-shrink-0"
        >
          <HelpHint width={260}>
            <div className="space-y-1">
              <div>
                <span className="text-brand-600 font-medium">Risk score:</span>{" "}
                {Math.round(p.riskScore)} / 100
              </div>
              <div>
                <span className="text-brand-600 font-medium">Tier:</span> {tierLabel}
              </div>
              <div>
                <span className="text-brand-600 font-medium">Program:</span> {programLabel}
              </div>
              {conditions.length > 0 && (
                <div>
                  <span className="text-brand-600 font-medium">Conditions:</span>{" "}
                  {conditions.slice(0, 4).join(", ")}
                  {conditions.length > 4 ? "…" : ""}
                </div>
              )}
              {p.urgencyReason && (
                <div>
                  <span className="text-brand-600 font-medium">Flagged:</span> {p.urgencyReason}
                </div>
              )}
            </div>
          </HelpHint>
        </span>
      </div>
      <span className="text-xs text-brand-600 truncate flex-shrink min-w-0 max-w-[45%] text-right">
        {p.urgencyReason}
      </span>
    </Link>
  );
}
