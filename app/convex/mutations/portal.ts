import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireUser, requirePatientAccess } from "../lib/auth";

export const sendMessage = mutation({
  args: { patientId: v.id("patients"), content: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requirePatientAccess(ctx, args.patientId);
    const senderType =
      user.role === "patient" ? "patient" : user.role === "nurse" ? "nurse" : "system";
    return await ctx.db.insert("portalMessages", {
      patientId: args.patientId,
      senderType: senderType as any,
      senderId: user._id,
      content: args.content,
    });
  },
});
