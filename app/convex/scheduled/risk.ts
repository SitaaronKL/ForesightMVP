import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";
import { requireAdmin, requireNurse } from "../lib/auth";

/**
 * Risk score is computed from: tier (base), recency since last touch (decay),
 * recent hospital events (boost), and recent encounters reaching the patient (drop).
 * Deterministic for the demo.
 */
function computeRiskScore(args: {
  tier: string;
  lastTouchedAt: number | undefined;
  recentHospitalEventCount: number;
  recentEncounterCount: number;
  baselineConditions: number;
}): number {
  const base = args.tier === "level_3" ? 70 : args.tier === "level_2" ? 50 : 30;
  const now = Date.now();
  const lastTouch = args.lastTouchedAt ?? now;
  const daysSinceTouch = (now - lastTouch) / (24 * 60 * 60 * 1000);
  const touchPenalty = Math.min(daysSinceTouch * 0.4, 20);
  const eventBoost = args.recentHospitalEventCount * 8;
  const encounterRelief = Math.min(args.recentEncounterCount * 2, 12);
  const conditionWeight = args.baselineConditions * 1.5;
  const score = base + touchPenalty + eventBoost + conditionWeight - encounterRelief;
  return Math.max(0, Math.min(100, score));
}

export const recomputeAll = mutation({
  args: {},
  handler: async (ctx) => {
    await requireNurse(ctx);
    const now = Date.now();
    const patients = await ctx.db.query("patients").collect();
    const cutoff = now - 30 * 24 * 60 * 60 * 1000;
    for (const p of patients) {
      const events = await ctx.db
        .query("hospitalEvents")
        .withIndex("by_patient_recent", (q) =>
          q.eq("patientId", p._id).gte("eventDate", cutoff),
        )
        .collect();
      const encounters = await ctx.db
        .query("encounters")
        .withIndex("by_patient_recent", (q) =>
          q.eq("patientId", p._id).gte("startedAt", cutoff),
        )
        .collect();
      const score = computeRiskScore({
        tier: p.tier,
        lastTouchedAt: p.lastTouchedAt,
        recentHospitalEventCount: events.length,
        recentEncounterCount: encounters.filter((e) => e.status === "completed").length,
        baselineConditions: p.chronicConditions.length,
      });
      await ctx.db.patch(p._id, { riskScore: score, riskScoreUpdatedAt: now });
    }
    return { count: patients.length };
  },
});

export const recomputeForPatient = mutation({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await requireNurse(ctx);
    const now = Date.now();
    const p = await ctx.db.get(args.patientId);
    if (!p) throw new Error("Patient not found");
    const cutoff = now - 30 * 24 * 60 * 60 * 1000;
    const events = await ctx.db
      .query("hospitalEvents")
      .withIndex("by_patient_recent", (q) =>
        q.eq("patientId", p._id).gte("eventDate", cutoff),
      )
      .collect();
    const encounters = await ctx.db
      .query("encounters")
      .withIndex("by_patient_recent", (q) =>
        q.eq("patientId", p._id).gte("startedAt", cutoff),
      )
      .collect();
    const score = computeRiskScore({
      tier: p.tier,
      lastTouchedAt: p.lastTouchedAt,
      recentHospitalEventCount: events.length,
      recentEncounterCount: encounters.filter((e) => e.status === "completed").length,
      baselineConditions: p.chronicConditions.length,
    });
    await ctx.db.patch(args.patientId, {
      riskScore: score,
      riskScoreUpdatedAt: now,
    });
    return { score };
  },
});
