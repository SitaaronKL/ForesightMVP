"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const triggerMorningBriefing = action({
  args: { nurseId: v.id("users") },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.runAction(internal.scheduled.briefings.generateMorningForNurse, {
      nurseId: args.nurseId,
    });
    return { ok: true };
  },
});

export const triggerEndOfDay = action({
  args: { nurseId: v.id("users") },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.runAction(internal.scheduled.briefings.generateEndOfDayForNurse, {
      nurseId: args.nurseId,
    });
    return { ok: true };
  },
});
