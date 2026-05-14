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
    contextPatientId: v.optional(v.id("patients")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    | { kind: "final"; text: string }
    | { kind: "needs_continue" }
    | { kind: "guardrail_blocked"; reason: string }
    | { kind: "error"; message: string }
  > => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Resolve the seeded nurse id (matches patients.primaryNurseId). For demo
    // users, the signup auth row and the seeded role row are bridged by email.
    const me: any = await ctx.runQuery(api.queries.me.current, {});
    const nurseId: Id<"users"> = (me?._id as Id<"users">) ?? userId;

    const session = new ConvexSession(ctx, args.threadId, userId);

    try {
      // Patient context goes via runContext.context, not the user input,
      // so it ends up in the agent's instructions instead of as a visible
      // user bubble.
      const result = await run(sage, args.userInput, {
        session,
        maxTurns: 4,
        context: {
          ctx,
          userId,
          nurseId,
          threadId: args.threadId,
          contextPatientId: args.contextPatientId,
        },
      });

      const text =
        typeof result.finalOutput === "string"
          ? result.finalOutput
          : JSON.stringify(result.finalOutput ?? "");
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
