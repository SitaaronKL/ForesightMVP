"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  run,
  MaxTurnsExceededError,
  InputGuardrailTripwireTriggered,
} from "@openai/agents";
import { sage } from "./sage";
import { ConvexSession } from "./session";

export const runAgentTurn = action({
  args: {
    threadId: v.id("agentThreads"),
    userInput: v.string(),
  },
  handler: async (ctx, args): Promise<
    | { kind: "final"; text: string }
    | { kind: "needs_continue" }
    | { kind: "guardrail_blocked"; reason: string }
    | { kind: "error"; message: string }
  > => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = new ConvexSession(ctx, args.threadId, userId);

    try {
      const result = await run(sage, args.userInput, {
        session,
        maxTurns: 4,
        context: {
          ctx,
          nurseId: userId,
          threadId: args.threadId,
        },
      });

      const text =
        typeof result.finalOutput === "string"
          ? result.finalOutput
          : JSON.stringify(result.finalOutput ?? "");

      // The session adapter already wrote tool calls + assistant items as they
      // streamed in. Belt-and-suspenders: write a final assistant message if the
      // last persisted message isn't the final.
      return { kind: "final", text };
    } catch (err: any) {
      if (err instanceof MaxTurnsExceededError) {
        await ctx.runMutation(internal.mutations.agent._internalAppendMessage, {
          threadId: args.threadId,
          userId,
          role: "system",
          content:
            "Reached the 4-tool-call cap for this turn. Press Continue to keep going.",
        });
        return { kind: "needs_continue" };
      }
      if (err instanceof InputGuardrailTripwireTriggered) {
        const reason =
          (err as any).outputInfo?.reason ??
          "Request blocked by safety guardrail.";
        await ctx.runMutation(internal.mutations.agent._internalAppendMessage, {
          threadId: args.threadId,
          userId,
          role: "system",
          content: `Guardrail: ${reason}`,
        });
        return { kind: "guardrail_blocked", reason };
      }
      console.error("Agent run error:", err);
      await ctx.runMutation(internal.mutations.agent._internalAppendMessage, {
        threadId: args.threadId,
        userId,
        role: "system",
        content: `Error: ${err?.message ?? "Unknown error"}`,
      });
      return { kind: "error", message: err?.message ?? "Unknown error" };
    }
  },
});
