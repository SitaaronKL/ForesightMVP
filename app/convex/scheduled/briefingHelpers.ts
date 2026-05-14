import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const _internalCreateBriefingThread = internalMutation({
  args: { nurseId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentThreads", {
      userId: args.nurseId,
      title: "Morning briefing generation",
      lastMessageAt: Date.now(),
    });
  },
});

export const _internalSaveBriefing = internalMutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    type: v.union(v.literal("morning"), v.literal("end_of_day")),
    content: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentBriefings")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", args.userId)
          .eq("date", args.date)
          .eq("type", args.type),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { content: args.content });
      return existing._id;
    }
    return await ctx.db.insert("agentBriefings", {
      userId: args.userId,
      date: args.date,
      type: args.type,
      content: args.content,
    });
  },
});
