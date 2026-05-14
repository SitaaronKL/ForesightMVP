import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireNurse, requirePatientAccess } from "../lib/auth";

export const createForCall = mutation({
  args: {
    patientId: v.id("patients"),
    durationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    await requirePatientAccess(ctx, args.patientId);
    const now = Date.now();
    const id = await ctx.db.insert("encounters", {
      patientId: args.patientId,
      nurseId: nurse._id,
      type: "phone_call",
      direction: "outbound",
      startedAt: now - args.durationSeconds * 1000,
      endedAt: now,
      durationSeconds: args.durationSeconds,
      status: "completed",
      topicTags: ["symptom_check"],
      serviceElementsTouched: [6],
    });
    await ctx.db.patch(args.patientId, { lastTouchedAt: now });
    return id;
  },
});
