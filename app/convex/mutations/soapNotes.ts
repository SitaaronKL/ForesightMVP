import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { requireNurse, requirePatientAccess } from "../lib/auth";

export const sign = mutation({
  args: {
    soapNoteId: v.id("soapNotes"),
    subjective: v.string(),
    objective: v.string(),
    assessment: v.string(),
    plan: v.string(),
    timeLogDurationSeconds: v.number(),
    activityDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    const note = await ctx.db.get(args.soapNoteId);
    if (!note) throw new Error("SOAP note not found");
    await requirePatientAccess(ctx, note.patientId);

    const now = Date.now();
    const month = new Date(now).toISOString().slice(0, 7);

    // Update note
    await ctx.db.patch(args.soapNoteId, {
      subjective: args.subjective,
      objective: args.objective,
      assessment: args.assessment,
      plan: args.plan,
      status: "signed",
      signedAt: now,
      signedBy: nurse._id,
    });

    // Create time log
    await ctx.db.insert("timeLogs", {
      patientId: note.patientId,
      nurseId: nurse._id,
      encounterId: note.encounterId,
      startTimestamp: now - args.timeLogDurationSeconds * 1000,
      endTimestamp: now,
      durationSeconds: args.timeLogDurationSeconds,
      activityType: "phone_call",
      activityDescription: args.activityDescription,
      billable: true,
      month,
    });

    return { ok: true };
  },
});

// Internal: create a draft SOAP note from an agent draft.
export const _internalCreateDraft = internalMutation({
  args: {
    patientId: v.id("patients"),
    encounterId: v.id("encounters"),
    nurseId: v.id("users"),
    subjective: v.string(),
    objective: v.string(),
    assessment: v.string(),
    plan: v.string(),
    draftSource: v.union(
      v.literal("manual"),
      v.literal("ai_from_transcript"),
      v.literal("ai_from_notes"),
    ),
    aiConfidenceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("soapNotes", {
      ...args,
      status: "draft",
      draftedAt: Date.now(),
    });
  },
});
