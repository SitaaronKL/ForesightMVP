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
