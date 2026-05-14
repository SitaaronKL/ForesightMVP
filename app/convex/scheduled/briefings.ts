"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { run } from "@openai/agents";
import { briefingAgent } from "../agent/sage";
import { ConvexSession } from "../agent/session";

/**
 * Generate the morning briefing for a specific nurse for today.
 * Triggered manually from the admin page or by a cron in production.
 */
export const generateMorningForNurse = internalAction({
  args: { nurseId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);

    // Get a snapshot of panel data via tools (the agent will call them)
    const tempThreadId: Id<"agentThreads"> = await ctx.runMutation(
      internal.scheduled.briefingHelpers._internalCreateBriefingThread,
      { nurseId: args.nurseId },
    );

    const session = new ConvexSession(ctx, tempThreadId, args.nurseId);
    const result = await run(
      briefingAgent,
      `Generate today's morning briefing for the calling nurse. Today is ${today}. Return JSON with this exact shape:
{
  "headline": "string",
  "priorityQueue": [{"patientId": "string", "patientName": "string", "tier": "string", "reason": "string"}],
  "kpis": {"panelSize": 0, "reachedThisMonth": 0, "reachRate": 0, "avgDocMinutes": 0, "serviceElementCoverage": 0},
  "headsUp": ["string"]
}`,
      {
        session,
        maxTurns: 10,
        context: { ctx, nurseId: args.nurseId, threadId: tempThreadId },
      },
    );

    const text =
      typeof result.finalOutput === "string"
        ? result.finalOutput
        : JSON.stringify(result.finalOutput ?? "");

    // Try to extract JSON
    let parsed: any = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {}

    if (!parsed) {
      // Fallback: build a deterministic briefing from queries
      parsed = await ctx.runQuery(api.queries.panels.kpis, {}).then(async (k: any) => {
        const queue = await ctx.runQuery(api.queries.panels.todaysQueue, { limit: 8 });
        return {
          headline: text.slice(0, 200) || `${queue.length} patients flagged for today.`,
          priorityQueue: queue.map((p: any) => ({
            patientId: p._id,
            patientName: `${p.firstName} ${p.lastName}`,
            tier: p.tier,
            reason: p.urgencyReason,
          })),
          kpis: {
            panelSize: k.panelSize,
            reachedThisMonth: k.reachedThisMonth,
            reachRate: k.reachRate,
            avgDocMinutes: k.avgDocMinutes,
            serviceElementCoverage: k.serviceElementCoverage,
          },
          headsUp: [],
        };
      });
    }

    await ctx.runMutation(internal.scheduled.briefingHelpers._internalSaveBriefing, {
      userId: args.nurseId,
      date: today,
      type: "morning",
      content: parsed,
    });

    return { ok: true };
  },
});

export const generateEndOfDayForNurse = internalAction({
  args: { nurseId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);
    const kpis: any = await ctx.runQuery(api.queries.panels.kpis, {});
    const queue: any = await ctx.runQuery(api.queries.panels.todaysQueue, { limit: 5 });
    const recap = {
      headline: `Day wrap-up: ${kpis.reachedThisMonth} patients reached this month.`,
      priorityQueue: queue.map((p: any) => ({
        patientId: p._id,
        patientName: `${p.firstName} ${p.lastName}`,
        tier: p.tier,
        reason: "Carry to tomorrow",
      })),
      kpis: {
        panelSize: kpis.panelSize,
        reachedThisMonth: kpis.reachedThisMonth,
        reachRate: kpis.reachRate,
        avgDocMinutes: kpis.avgDocMinutes,
        serviceElementCoverage: kpis.serviceElementCoverage,
      },
      headsUp: ["Unsigned documentation count", "Service-element gaps for APCM panel"],
      recap: "End-of-day wrap generated.",
    };
    await ctx.runMutation(internal.scheduled.briefingHelpers._internalSaveBriefing, {
      userId: args.nurseId,
      date: today,
      type: "end_of_day",
      content: recap,
    });
    return { ok: true };
  },
});
