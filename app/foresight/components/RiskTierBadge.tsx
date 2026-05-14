"use client";

import { SmileIcon } from "./SmileIcon";
import { AnnoyedIcon } from "./AnnoyedIcon";
import { AngryIcon } from "./AngryIcon";
import type { ComponentType } from "react";

type IconCmp = ComponentType<{ size?: number; className?: string }>;

const TIER_META: Record<
  string,
  { styles: string; ariaLabel: string; Icon: IconCmp }
> = {
  level_1: {
    styles: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ariaLabel: "Level 1 (stable)",
    Icon: SmileIcon as IconCmp,
  },
  level_2: {
    styles: "bg-amber-50 text-amber-700 border-amber-200",
    ariaLabel: "Level 2 (moderate acuity)",
    Icon: AnnoyedIcon as IconCmp,
  },
  level_3: {
    styles: "bg-red-50 text-red-700 border-red-200",
    ariaLabel: "Level 3 (highest acuity)",
    Icon: AngryIcon as IconCmp,
  },
};

const FALLBACK = {
  styles: "bg-zinc-50 text-zinc-700 border-zinc-200",
  ariaLabel: "Risk score",
  Icon: SmileIcon as IconCmp,
};

export function RiskTierBadge({ score, tier }: { score: number; tier: string }) {
  const { styles, ariaLabel, Icon } = TIER_META[tier] ?? FALLBACK;
  const label = `${ariaLabel} · risk ${Math.round(score)}`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles}`}
      aria-label={label}
      title={label}
    >
      <Icon size={12} className="flex items-center" />
      {Math.round(score)}
    </span>
  );
}
