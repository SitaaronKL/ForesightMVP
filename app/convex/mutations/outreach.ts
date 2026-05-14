import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireNurse, requirePatientAccess } from "../lib/auth";

export const schedule = mutation({
  args: {
    patientId: v.id("patients"),
    method: v.union(
      v.literal("call"),
      v.literal("sms"),
      v.literal("portal"),
      v.literal("email"),
      v.literal("mail"),
    ),
    scheduledFor: v.number(),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    await requirePatientAccess(ctx, args.patientId);

    const existing = await ctx.db
      .query("outreachAttempts")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .collect();
    const month = new Date(args.scheduledFor).toISOString().slice(0, 7);
    const thisMonthCount = existing.filter(
      (e) => new Date(e.scheduledFor).toISOString().slice(0, 7) === month,
    ).length;

    return await ctx.db.insert("outreachAttempts", {
      patientId: args.patientId,
      scheduledByUserId: nurse._id,
      scheduledByAgent: false,
      method: args.method,
      scheduledFor: args.scheduledFor,
      status: "scheduled",
      attemptNumber: thisMonthCount + 1,
    });
  },
});

export const upcoming = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    await requirePatientAccess(ctx, patientId);
    const all = await ctx.db
      .query("outreachAttempts")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .collect();
    return all
      .filter((a) => a.status === "scheduled" && a.scheduledFor >= Date.now())
      .sort((a, b) => a.scheduledFor - b.scheduledFor);
  },
});
