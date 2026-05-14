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
    return await ctx.db
      .query("agentBriefings")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", userId)
          .eq("date", today)
          .eq("type", type as any),
      )
      .first();
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
