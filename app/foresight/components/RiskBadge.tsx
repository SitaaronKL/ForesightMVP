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

import { SmileIcon } from "./SmileIcon";
import { AnnoyedIcon } from "./AnnoyedIcon";
import { AngryIcon } from "./AngryIcon";

const TIER_META: Record<
  string,
  { styles: string; ariaLabel: string; Icon: React.FC<{ size?: number; className?: string }> }
> = {
  level_1: {
    styles: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    ariaLabel: "Level 1 (stable)",
    Icon: SmileIcon as any,
  },
  level_2: {
    styles: "bg-amber-50 text-amber-700 border border-amber-200",
    ariaLabel: "Level 2 (moderate acuity)",
    Icon: AnnoyedIcon as any,
  },
  level_3: {
    styles: "bg-red-50 text-red-700 border border-red-200",
    ariaLabel: "Level 3 (highest acuity)",
    Icon: AngryIcon as any,
  },
};

export function TierBadge({ tier }: { tier: string }) {
  const meta = TIER_META[tier];
  if (meta) {
    const { Icon, styles, ariaLabel } = meta;
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-5 rounded ${styles}`}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <Icon size={12} className="flex items-center" />
      </span>
    );
  }

  // Fallback for unknown tiers.
  const label = tier.replace("level_", "L");
  return (
    <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-50 text-zinc-700 border border-zinc-200">
      {label}
    </span>
  );
}

import { forwardRef, useImperativeHandle, useRef } from "react";
import {
  AlarmClockCheckIcon,
  type AlarmClockCheckIconHandle,
} from "./AlarmClockCheckIcon";
import {
  AlarmClockMinusIcon,
  type AlarmClockMinusIconHandle,
} from "./AlarmClockMinusIcon";
import {
  AlarmClockPlusIcon,
  type AlarmClockPlusIconHandle,
} from "./AlarmClockPlusIcon";

const PROGRAM_FULL: Record<string, string> = {
  ccm: "Chronic Care Management",
  pcm: "Principal Care Management",
  apcm: "Advanced Primary Care Management",
};

export type BillingBadgeHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

/**
 * Program chip: animated alarm-clock icon + uppercase program text, no
 * background pill. Forwards an imperative animation handle so a parent row
 * can trigger the icon's hover animation when the user hovers the row.
 */
export const BillingBadge = forwardRef<
  BillingBadgeHandle,
  { program: string; size?: number; iconOnly?: boolean }
>(function BillingBadge({ program, size = 18, iconOnly = false }, ref) {
  const checkRef = useRef<AlarmClockCheckIconHandle>(null);
  const plusRef = useRef<AlarmClockPlusIconHandle>(null);
  const minusRef = useRef<AlarmClockMinusIconHandle>(null);
  const key = String(program ?? "").toLowerCase();
  const full = PROGRAM_FULL[key] ?? program;

  useImperativeHandle(ref, () => ({
    startAnimation: () => {
      checkRef.current?.startAnimation();
      plusRef.current?.startAnimation();
      minusRef.current?.startAnimation();
    },
    stopAnimation: () => {
      checkRef.current?.stopAnimation();
      plusRef.current?.stopAnimation();
      minusRef.current?.stopAnimation();
    },
  }));

  function handleEnter() {
    checkRef.current?.startAnimation();
    plusRef.current?.startAnimation();
    minusRef.current?.startAnimation();
  }
  function handleLeave() {
    checkRef.current?.stopAnimation();
    plusRef.current?.stopAnimation();
    minusRef.current?.stopAnimation();
  }

  // Map program → which animated icon to render at this slot.
  const Icon =
    key === "ccm" ? (
      <AlarmClockCheckIcon ref={checkRef} size={size} className="flex items-center" />
    ) : key === "pcm" ? (
      <AlarmClockPlusIcon ref={plusRef} size={size} className="flex items-center" />
    ) : key === "apcm" ? (
      <AlarmClockMinusIcon ref={minusRef} size={size} className="flex items-center" />
    ) : null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 uppercase tracking-wider"
      aria-label={full}
      title={full}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {Icon}
      {!iconOnly && <span>{program}</span>}
    </span>
  );
});
