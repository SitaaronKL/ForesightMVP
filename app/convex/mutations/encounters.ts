import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireNurse, requirePatientAccess } from "../lib/auth";

export const create = mutation({
  args: {
    patientId: v.id("patients"),
    type: v.string(),
    direction: v.string(),
    durationSeconds: v.number(),
    status: v.string(),
    topicTags: v.array(v.string()),
    jotNotes: v.optional(v.string()),
    serviceElementsTouched: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    await requirePatientAccess(ctx, args.patientId);
    const now = Date.now();
    const id = await ctx.db.insert("encounters", {
      patientId: args.patientId,
      nurseId: nurse._id,
      type: args.type as any,
      direction: args.direction as any,
      startedAt: now - args.durationSeconds * 1000,
      endedAt: now,
      durationSeconds: args.durationSeconds,
      status: args.status as any,
      topicTags: args.topicTags,
      jotNotes: args.jotNotes,
      serviceElementsTouched: args.serviceElementsTouched ?? [],
    });
    // Touch patient lastTouchedAt
    await ctx.db.patch(args.patientId, { lastTouchedAt: now });

    // Mark touched service elements as delivered for the month
    if (args.serviceElementsTouched && args.serviceElementsTouched.length > 0) {
      const month = new Date(now).toISOString().slice(0, 7);
      for (const elementId of args.serviceElementsTouched) {
        const existing = await ctx.db
          .query("serviceElements")
          .withIndex("by_patient_and_month", (q) =>
            q.eq("patientId", args.patientId).eq("month", month),
          )
          .filter((q) => q.eq(q.field("elementId"), elementId))
          .first();
        if (existing) {
          await ctx.db.patch(existing._id, {
            status: "delivered",
            evidence: [
              ...existing.evidence,
              { kind: "encounter", refId: id, note: undefined },
            ],
          });
        }
      }
    }

    return id;
  },
});

/**
 * Lightweight "quick note" encounter: nurse logs an off-call touch (e.g.,
 * refill submitted, chart review, family call). Defaults to a 5-minute
 * phone_call encounter so it shows up in the activity feed and counts toward
 * the monthly touch.
 */
export const quickNote = mutation({
  args: {
    patientId: v.id("patients"),
    note: v.string(),
    durationMinutes: v.optional(v.number()),
    topicTags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    await requirePatientAccess(ctx, args.patientId);
    const now = Date.now();
    const durationSeconds = (args.durationMinutes ?? 5) * 60;
    const id = await ctx.db.insert("encounters", {
      patientId: args.patientId,
      nurseId: nurse._id,
      type: "phone_call",
      direction: "outbound",
      startedAt: now - durationSeconds * 1000,
      endedAt: now,
      durationSeconds,
      status: "completed",
      topicTags: args.topicTags ?? ["other"],
      jotNotes: args.note,
      serviceElementsTouched: [],
    });
    await ctx.db.patch(args.patientId, { lastTouchedAt: now });
    return id;
  },
});

/**
 * Mark a single APCM service element as delivered for the current month.
 * Records the calling nurse as the evidence source.
 */
export const markServiceElementDelivered = mutation({
  args: {
    patientId: v.id("patients"),
    elementId: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    await requirePatientAccess(ctx, args.patientId);
    const month = new Date().toISOString().slice(0, 7);
    const existing = await ctx.db
      .query("serviceElements")
      .withIndex("by_patient_and_month", (q) =>
        q.eq("patientId", args.patientId).eq("month", month),
      )
      .filter((q) => q.eq(q.field("elementId"), args.elementId))
      .first();
    if (!existing) throw new Error("Service element not found for this month");
    await ctx.db.patch(existing._id, {
      status: "delivered",
      evidence: [
        ...existing.evidence,
        {
          kind: "nurse_attestation",
          refId: nurse._id,
          note: args.note,
        },
      ],
    });
    return existing._id;
  },
});
