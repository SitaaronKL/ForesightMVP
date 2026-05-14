"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Resolve the nurse id to generate a briefing for.
 *
 * - If no override is supplied → use the calling user (any authed user can
 *   generate their own briefing).
 * - If an override is supplied → only allowed for admins (they may target
 *   another nurse). A non-admin passing an override is silently coerced
 *   back to their own id so they can't generate for someone else.
 *
 * Auth is read directly via getAuthUserId (instead of routing through a
 * runQuery to me.current) because in some Convex versions the auth context
 * isn't forwarded across runQuery from node actions.
 */
async function resolveTargetNurseId(
  ctx: any,
  _override: Id<"users"> | undefined,
): Promise<Id<"users">> {
  // Admin role removed — every nurse can only act on themselves.
  void _override;
  const callerId = await getAuthUserId(ctx);
  if (!callerId) throw new Error("Not authenticated");
  return callerId as Id<"users">;
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
