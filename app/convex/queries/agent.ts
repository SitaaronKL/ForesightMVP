import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { requireUserId } from "../lib/auth";

export const myThreads = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("agentThreads")
      .withIndex("by_user_recent", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const messages = query({
  args: { threadId: v.id("agentThreads") },
  handler: async (ctx, { threadId }) => {
    const userId = await requireUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) throw new Error("Forbidden");
    return await ctx.db
      .query("agentMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .collect();
  },
});

export const todaysBriefing = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const today = new Date().toISOString().slice(0, 10);
    const type = args.type ?? "morning";

    // Build the full set of candidate user ids: the caller's auth row + any
    // other user row sharing the same email (the seeded "Sarah Chen, RN"
    // row in the demo). Then read all briefings saved under any of them for
    // today and pick the freshest one with NON-EMPTY panel data. This way
    // a stale "panel zero" briefing left over from before the auth-bridge
    // fix doesn't shadow a freshly-generated one with real data.
    const me = await ctx.db.get(userId);
    const email = (me as any)?.email;
    const candidateIds: any[] = [userId];
    if (typeof email === "string" && email.trim()) {
      const sameEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email.toLowerCase().trim()))
        .collect();
      for (const u of sameEmail) {
        if (!candidateIds.includes(u._id)) candidateIds.push(u._id);
      }
    }

    const found: any[] = [];
    for (const uid of candidateIds) {
      const row = await ctx.db
        .query("agentBriefings")
        .withIndex("by_user_and_date", (q) =>
          q
            .eq("userId", uid as any)
            .eq("date", today)
            .eq("type", type as any),
        )
        .first();
      if (row) found.push(row);
    }
    if (found.length === 0) return null;

    // Prefer briefings whose content has a non-zero panel size — that's the
    // signal of a "real" generation vs the empty-auth-row case.
    const real = found.find((b) => {
      const c: any = b.content;
      return (c?.kpis?.panelSize ?? 0) > 0 || (c?.priorityQueue?.length ?? 0) > 0;
    });
    if (real) return real;

    // Otherwise return the most recently created one.
    return found.sort((a, b) => b._creationTime - a._creationTime)[0];
  },
});

// Internal versions used by the agent action loop (no auth, called server-to-server)
export const _internalListMessages = internalQuery({
  args: { threadId: v.id("agentThreads") },
  handler: async (ctx, { threadId }) => {
    return await ctx.db
      .query("agentMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .order("asc")
      .collect();
  },
});
