import { Doc } from "../_generated/dataModel";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Smart sort score. Higher = more urgent.
 * 1) Care transition deadlines in next 48 hours (events table feeds in elsewhere; modelled here via lastTouched gap)
 * 2) Overdue from prior month
 * 3) Due this week
 * 4) Due this month, sorted by tier (Level 3 first)
 * 5) Stable patients on routine cadence
 */
export function urgencyScore(p: Doc<"patients">, now: number = Date.now()): number {
  const lastTouched = p.lastTouchedAt ?? p.enrolledAt;
  const daysSinceTouch = (now - lastTouched) / DAY_MS;
  const tierWeight =
    p.tier === "level_3" ? 30 : p.tier === "level_2" ? 15 : 5;
  const risk = p.riskScore;
  const overdueBoost = daysSinceTouch > 30 ? 50 : 0;
  const weekBoost = daysSinceTouch > 7 ? 20 : 0;
  return overdueBoost + weekBoost + tierWeight + risk * 0.6 + daysSinceTouch * 0.2;
}

export function isOverdue(p: Doc<"patients">, now: number = Date.now()): boolean {
  const lastTouched = p.lastTouchedAt ?? p.enrolledAt;
  return (now - lastTouched) / DAY_MS > 30;
}

export function isDueThisWeek(p: Doc<"patients">, now: number = Date.now()): boolean {
  const lastTouched = p.lastTouchedAt ?? p.enrolledAt;
  const days = (now - lastTouched) / DAY_MS;
  return days > 7 && days <= 30;
}

export function isDueToday(p: Doc<"patients">, now: number = Date.now()): boolean {
  const lastTouched = p.lastTouchedAt ?? p.enrolledAt;
  const days = (now - lastTouched) / DAY_MS;
  // Today if overdue this week and Level 2+ or risk above 60, or strictly overdue past 30.
  if (days > 30) return true;
  if (days > 14 && (p.tier === "level_3" || p.riskScore > 75)) return true;
  if (days > 21 && (p.tier === "level_2" || p.riskScore > 60)) return true;
  return false;
}

export function reasonFor(p: Doc<"patients">, now: number = Date.now()): string {
  const lastTouched = p.lastTouchedAt ?? p.enrolledAt;
  const days = Math.floor((now - lastTouched) / DAY_MS);
  if (days > 30) return `${days} days since last touch (overdue)`;
  if (p.riskScore > 75) return `Risk score ${Math.round(p.riskScore)}, ${p.tier.replace("_", " ")}`;
  if (days > 14) return `${days} days since last touch`;
  return `${p.tier.replace("_", " ")} routine`;
}
