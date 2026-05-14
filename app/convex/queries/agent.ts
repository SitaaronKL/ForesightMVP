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

    // First, the exact match: briefing saved under the calling user's id.
    const direct = await ctx.db
      .query("agentBriefings")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", userId)
          .eq("date", today)
          .eq("type", type as any),
      )
      .first();
    if (direct) return direct;

    // Fall back: if the user shares an email with another user row (e.g. an
    // orphan auth row + a seeded role row both pointing at
    // sarah@foresight.demo), check briefings saved against any of them.
    // This makes the dashboard resilient to the duplicate-user case we hit
    // during demos without forcing a manual cleanup first.
    const me = await ctx.db.get(userId);
    const email = (me as any)?.email;
    if (!email) return null;

    const sameEmail = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .collect();

    for (const u of sameEmail) {
      if (u._id === userId) continue;
      const found = await ctx.db
        .query("agentBriefings")
        .withIndex("by_user_and_date", (q) =>
          q
            .eq("userId", u._id)
            .eq("date", today)
            .eq("type", type as any),
        )
        .first();
      if (found) return found;
    }
    return null;
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
