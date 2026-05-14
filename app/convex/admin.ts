"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

async function resolveTargetNurseId(
  ctx: any,
  override: Id<"users"> | undefined,
): Promise<Id<"users">> {
  const me: any = await ctx.runQuery(api.queries.me.current, {});
  if (!me) throw new Error("Not authenticated");
  // Only an admin can target a different nurse. Nurses always run on themselves.
  if (override && me.role === "admin") return override;
  if (me.role !== "nurse" && me.role !== "admin") {
    throw new Error("Forbidden: nurse or admin role required");
  }
  return me._id as Id<"users">;
}

export const triggerMorningBriefing = action({
  args: { targetNurseId: v.optional(v.id("users")) },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const nurseId = await resolveTargetNurseId(ctx, args.targetNurseId);
    await ctx.runAction(internal.scheduled.briefings.generateMorningForNurse, {
      nurseId,
    });
    return { ok: true };
  },
});

export const triggerEndOfDay = action({
  args: { targetNurseId: v.optional(v.id("users")) },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const nurseId = await resolveTargetNurseId(ctx, args.targetNurseId);
    await ctx.runAction(internal.scheduled.briefings.generateEndOfDayForNurse, {
      nurseId,
    });
    return { ok: true };
  },
});
