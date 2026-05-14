import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { requireNurse, requirePatientAccess } from "../lib/auth";

const contentValidator = v.object({
  problemList: v.array(v.string()),
  expectedOutcomes: v.array(v.string()),
  treatmentGoals: v.array(v.string()),
  symptomManagement: v.array(v.string()),
  plannedInterventions: v.array(v.string()),
  medicationManagement: v.array(v.string()),
  communityResources: v.array(v.string()),
  providerCoordination: v.array(v.string()),
  reviewSchedule: v.string(),
});

export const approveVersion = mutation({
  args: { versionId: v.id("carePlanVersions") },
  handler: async (ctx, { versionId }) => {
    const nurse = await requireNurse(ctx);
    const version = await ctx.db.get(versionId);
    if (!version) throw new Error("Version not found");
    await requirePatientAccess(ctx, version.patientId);

    await ctx.db.patch(versionId, {
      reviewStatus: "approved",
      approvedAt: Date.now(),
      approvedBy: nurse._id,
    });
    await ctx.db.patch(version.carePlanId, {
      currentVersionId: versionId,
    });
    return { ok: true };
  },
});

export const rejectVersion = mutation({
  args: { versionId: v.id("carePlanVersions") },
  handler: async (ctx, { versionId }) => {
    await requireNurse(ctx);
    const version = await ctx.db.get(versionId);
    if (!version) throw new Error("Version not found");
    await requirePatientAccess(ctx, version.patientId);
    await ctx.db.patch(versionId, { reviewStatus: "rejected" });
    return { ok: true };
  },
});

export const createManualVersion = mutation({
  args: {
    patientId: v.id("patients"),
    content: contentValidator,
    rationale: v.string(),
    diffSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    await requirePatientAccess(ctx, args.patientId);

    let carePlan = await ctx.db
      .query("carePlans")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .first();
    if (!carePlan) {
      const id = await ctx.db.insert("carePlans", {
        patientId: args.patientId,
        currentVersionId: undefined,
        createdBy: nurse._id,
      });
      carePlan = (await ctx.db.get(id))!;
    }

    const lastVersion = await ctx.db
      .query("carePlanVersions")
      .withIndex("by_carePlan", (q) => q.eq("carePlanId", carePlan!._id))
      .order("desc")
      .first();
    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const versionId = await ctx.db.insert("carePlanVersions", {
      carePlanId: carePlan._id,
      patientId: args.patientId,
      versionNumber: nextVersionNumber,
      content: args.content,
      diffSummary: args.diffSummary,
      rationale: args.rationale,
      draftedAt: Date.now(),
      draftedBy: nurse._id,
      draftSource: "manual",
      reviewStatus: "approved",
      approvedAt: Date.now(),
      approvedBy: nurse._id,
    });
    await ctx.db.patch(carePlan._id, { currentVersionId: versionId });
    return versionId;
  },
});

// Internal: create AI-suggested version awaiting nurse review.
export const _internalCreateAiVersion = internalMutation({
  args: {
    patientId: v.id("patients"),
    nurseId: v.id("users"),
    content: contentValidator,
    rationale: v.string(),
    diffSummary: v.string(),
  },
  handler: async (ctx, args) => {
    let carePlan = await ctx.db
      .query("carePlans")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .first();
    if (!carePlan) {
      const id = await ctx.db.insert("carePlans", {
        patientId: args.patientId,
        currentVersionId: undefined,
        createdBy: args.nurseId,
      });
      carePlan = (await ctx.db.get(id))!;
    }
    const lastVersion = await ctx.db
      .query("carePlanVersions")
      .withIndex("by_carePlan", (q) => q.eq("carePlanId", carePlan!._id))
      .order("desc")
      .first();
    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;
    return await ctx.db.insert("carePlanVersions", {
      carePlanId: carePlan._id,
      patientId: args.patientId,
      versionNumber: nextVersionNumber,
      content: args.content,
      diffSummary: args.diffSummary,
      rationale: args.rationale,
      draftedAt: Date.now(),
      draftedBy: args.nurseId,
      draftSource: "ai_suggested",
      reviewStatus: "pending_review",
    });
  },
});
