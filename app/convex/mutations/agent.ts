import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { requireUserId } from "../lib/auth";

export const createThread = mutation({
  args: {
    title: v.optional(v.string()),
    contextPatientId: v.optional(v.id("patients")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("agentThreads", {
      userId,
      title: args.title ?? "New thread",
      contextPatientId: args.contextPatientId,
      lastMessageAt: Date.now(),
    });
  },
});

export const renameThreadIfDefault = mutation({
  args: { threadId: v.id("agentThreads"), title: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== userId) throw new Error("Forbidden");
    const defaultTitles = ["New thread", "Today", "Patient session"];
    if (defaultTitles.includes(thread.title)) {
      const trimmed = args.title.replace(/\s+/g, " ").trim().slice(0, 60);
      if (trimmed.length > 0) {
        await ctx.db.patch(args.threadId, { title: trimmed });
      }
    }
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("agentThreads") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== userId) throw new Error("Forbidden");
    const messages = await ctx.db
      .query("agentMessages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    for (const m of messages) await ctx.db.delete(m._id);
    await ctx.db.delete(args.threadId);
  },
});

export const appendUserMessage = mutation({
  args: {
    threadId: v.id("agentThreads"),
    content: v.string(),
  },
  handler: async (ctx, { threadId, content }) => {
    const userId = await requireUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) throw new Error("Forbidden");
    const id = await ctx.db.insert("agentMessages", {
      threadId,
      userId,
      role: "user",
      content,
    });
    await ctx.db.patch(threadId, { lastMessageAt: Date.now() });
    return id;
  },
});

export const dismissActionCard = mutation({
  args: { messageId: v.id("agentMessages"), cardIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const msg = await ctx.db.get(args.messageId);
    if (!msg || msg.userId !== userId) throw new Error("Forbidden");
    if (!msg.actionCards) return;
    const cards = [...msg.actionCards];
    cards[args.cardIndex] = { ...cards[args.cardIndex], status: "dismissed" };
    await ctx.db.patch(args.messageId, { actionCards: cards });
  },
});

export const markActionApplied = mutation({
  args: { messageId: v.id("agentMessages"), cardIndex: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const msg = await ctx.db.get(args.messageId);
    if (!msg || msg.userId !== userId) throw new Error("Forbidden");
    if (!msg.actionCards) return;
    const cards = [...msg.actionCards];
    cards[args.cardIndex] = { ...cards[args.cardIndex], status: "applied" };
    await ctx.db.patch(args.messageId, { actionCards: cards });
  },
});

// Internal: agent loop writes messages here
export const _internalAppendMessage = internalMutation({
  args: {
    threadId: v.id("agentThreads"),
    userId: v.id("users"),
    role: v.union(
      v.literal("assistant"),
      v.literal("tool"),
      v.literal("system"),
      v.literal("user"),
    ),
    content: v.string(),
    toolName: v.optional(v.string()),
    toolArgs: v.optional(v.any()),
    toolResult: v.optional(v.any()),
    actionCards: v.optional(
      v.array(
        v.object({
          kind: v.string(),
          targetId: v.optional(v.string()),
          summary: v.string(),
          status: v.union(
            v.literal("pending"),
            v.literal("applied"),
            v.literal("dismissed"),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("agentMessages", {
      threadId: args.threadId,
      userId: args.userId,
      role: args.role,
      content: args.content,
      toolName: args.toolName,
      toolArgs: args.toolArgs,
      toolResult: args.toolResult,
      actionCards: args.actionCards,
    });
    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() });
    return id;
  },
});
