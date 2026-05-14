export function RiskBadge({ score }: { score: number }) {
  const level =
    score >= 75 ? "high" : score >= 50 ? "med" : "low";
  const styles = {
    high: "bg-red-50 text-red-warning border-red-200",
    med: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-green-50 text-green-700 border-green-200",
  }[level];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {Math.round(score)}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const label = tier.replace("level_", "L");
  const styles = {
    level_3: "bg-brand-900 text-white",
    level_2: "bg-brand-200 text-brand-950",
    level_1: "bg-brand-50 text-brand-700",
  }[tier as keyof typeof styles] ?? "bg-brand-50 text-brand-700";
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${styles}`}>
      {label}
    </span>
  );
}

export function BillingBadge({ program }: { program: string }) {
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 uppercase tracking-wider">
      {program}
    </span>
  );
}
