"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { SmileIcon, type SmileIconHandle } from "./SmileIcon";
import { AnnoyedIcon, type AnnoyedIconHandle } from "./AnnoyedIcon";
import { AngryIcon, type AngryIconHandle } from "./AngryIcon";

export type RiskTierBadgeHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

type Tier = "level_1" | "level_2" | "level_3" | string;

const TIER_META: Record<
  string,
  { ariaLabel: string; toneText: string }
> = {
  level_1: {
    ariaLabel: "Level 1 (stable)",
    toneText: "text-emerald-700",
  },
  level_2: {
    ariaLabel: "Level 2 (moderate acuity)",
    toneText: "text-amber-700",
  },
  level_3: {
    ariaLabel: "Level 3 (highest acuity)",
    toneText: "text-red-700",
  },
};

const FALLBACK = {
  ariaLabel: "Risk score",
  toneText: "text-zinc-700",
};

/**
 * Inline risk + tier chip — no pill background. Face icon picked by tier
 * (smile / annoyed / angry) and rendered larger so it carries the row.
 * Forwards an imperative ref so a parent row can trigger the icon's hover
 * animation when the user hovers anywhere on the row.
 */
export const RiskTierBadge = forwardRef<
  RiskTierBadgeHandle,
  { score: number; tier: Tier; size?: number }
>(function RiskTierBadge({ score, tier, size = 20 }, ref) {
  const smileRef = useRef<SmileIconHandle>(null);
  const annoyedRef = useRef<AnnoyedIconHandle>(null);
  const angryRef = useRef<AngryIconHandle>(null);
  const meta = TIER_META[tier] ?? FALLBACK;
  const label = `${meta.ariaLabel} · risk ${Math.round(score)}`;

  useImperativeHandle(ref, () => ({
    startAnimation: () => {
      smileRef.current?.startAnimation();
      annoyedRef.current?.startAnimation();
      angryRef.current?.startAnimation();
    },
    stopAnimation: () => {
      smileRef.current?.stopAnimation();
      annoyedRef.current?.stopAnimation();
      angryRef.current?.stopAnimation();
    },
  }));

  return (
    <span
      className={`inline-flex items-center gap-1 ${meta.toneText}`}
      aria-label={label}
      title={label}
    >
      {tier === "level_1" && (
        <SmileIcon ref={smileRef} size={size} className="flex items-center" />
      )}
      {tier === "level_2" && (
        <AnnoyedIcon ref={annoyedRef} size={size} className="flex items-center" />
      )}
      {tier === "level_3" && (
        <AngryIcon ref={angryRef} size={size} className="flex items-center" />
      )}
      <span className="text-sm font-semibold tabular-nums">
        {Math.round(score)}
      </span>
    </span>
  );
});
