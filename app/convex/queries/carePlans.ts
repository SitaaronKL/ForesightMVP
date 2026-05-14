import { v } from "convex/values";
import { query } from "../_generated/server";
import { requirePatientAccess } from "../lib/auth";

export const current = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    await requirePatientAccess(ctx, patientId);
    const carePlan = await ctx.db
      .query("carePlans")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .first();
    if (!carePlan?.currentVersionId) return { carePlan, currentVersion: null };
    const currentVersion = await ctx.db.get(carePlan.currentVersionId);
    return { carePlan, currentVersion };
  },
});

export const versions = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    await requirePatientAccess(ctx, patientId);
    const versions = await ctx.db
      .query("carePlanVersions")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", patientId))
      .order("desc")
      .collect();

    // Hydrate drafter and approver names
    const userIds = new Set<string>();
    versions.forEach((v) => {
      userIds.add(v.draftedBy);
      if (v.approvedBy) userIds.add(v.approvedBy);
    });
    const users = await Promise.all(
      Array.from(userIds).map((id) => ctx.db.get(id as any)),
    );
    const userMap = new Map(users.filter(Boolean).map((u: any) => [u._id, u]));

    return versions.map((v) => ({
      ...v,
      drafter: userMap.get(v.draftedBy) ?? null,
      approver: v.approvedBy ? userMap.get(v.approvedBy) ?? null : null,
    }));
  },
});
