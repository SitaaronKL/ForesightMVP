"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import OpenAI from "openai";

/**
 * Morning briefing generation. Reads panel data via internal queries,
 * synthesises a short headline + 2–3 heads-up bullets with a direct OpenAI
 * call (NO Agents SDK, NO ConvexSession, NO agentMessages writes), and
 * persists the result. This keeps the Sage chat thread untouched —
 * generating a briefing is a background system task, not a conversation.
 */
export const generateMorningForNurse = internalAction({
  args: { nurseId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);

    const kpis: any = await ctx.runQuery(
      internal.queries.panels._internalKpisForNurse,
      { nurseId: args.nurseId },
    );
    const queue: any = await ctx.runQuery(
      internal.queries.panels._internalTodaysQueueForNurse,
      { nurseId: args.nurseId, limit: 8 },
    );

    const priorityQueue = queue.map((p: any) => ({
      patientId: p._id,
      patientName: `${p.firstName} ${p.lastName}`,
      tier: p.tier,
      reason: p.urgencyReason,
    }));

    // Default briefing content, used if the LLM call fails for any reason.
    let headline =
      priorityQueue.length > 0
        ? `Focus today on ${priorityQueue
            .slice(0, 2)
            .map((p: any) => p.patientName)
            .join(" and ")}.`
        : "No patients are flagged for today. Use this time for proactive outreach.";
    let headsUp: string[] = [];

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const compact = {
        kpis,
        priorityQueue: priorityQueue.slice(0, 8),
      };
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are Sage, an operational assistant for a CCM/APCM nurse. " +
              "Given today's panel snapshot, produce a tight morning briefing. " +
              "Return JSON {headline: string, headsUp: string[]}. " +
              "Headline: one operational sentence naming 1-2 specific patients to prioritise. " +
              "headsUp: 2-3 bullet items (each <=120 chars) noting reach rate, APCM gaps, " +
              "or any overdue cohort. Plain professional English, no clinical abbreviations.",
          },
          {
            role: "user",
            content: JSON.stringify(compact),
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content ?? "{}";
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.headline === "string" && parsed.headline.trim()) {
          headline = parsed.headline.trim();
        }
        if (Array.isArray(parsed.headsUp)) {
          headsUp = parsed.headsUp
            .filter((s: unknown): s is string => typeof s === "string")
            .slice(0, 4);
        }
      } catch {
        // keep defaults
      }
    } catch (err) {
      console.error("briefing OpenAI call failed:", err);
      // keep defaults
    }

    await ctx.runMutation(
      internal.scheduled.briefingHelpers._internalSaveBriefing,
      {
        userId: args.nurseId,
        date: today,
        type: "morning",
        content: {
          headline,
          priorityQueue,
          kpis: {
            panelSize: kpis.panelSize,
            reachedThisMonth: kpis.reachedThisMonth,
            reachRate: kpis.reachRate,
            avgDocMinutes: kpis.avgDocMinutes,
            serviceElementCoverage: kpis.serviceElementCoverage,
          },
          headsUp,
        },
      },
    );

    return { ok: true };
  },
});

/**
 * End-of-day wrap. Same pattern — deterministic data + a small OpenAI call
 * for the prose, no Sage chat involvement.
 */
export const generateEndOfDayForNurse = internalAction({
  args: { nurseId: v.id("users") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);

    const kpis: any = await ctx.runQuery(
      internal.queries.panels._internalKpisForNurse,
      { nurseId: args.nurseId },
    );
    const queue: any = await ctx.runQuery(
      internal.queries.panels._internalTodaysQueueForNurse,
      { nurseId: args.nurseId, limit: 5 },
    );
    const priorityQueue = queue.map((p: any) => ({
      patientId: p._id,
      patientName: `${p.firstName} ${p.lastName}`,
      tier: p.tier,
      reason: "Carry to tomorrow",
    }));

    let headline = `Day wrap-up: ${kpis.reachedThisMonth} patients reached this month.`;
    let headsUp: string[] = [
      "Review unsigned documentation before signing off.",
      "Check APCM service-element gaps for any patient due this month.",
    ];

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are Sage. Produce an end-of-day wrap for a CCM/APCM nurse. " +
              "Return JSON {headline: string, headsUp: string[]}. Headline = one " +
              "sentence summarising today's progress. headsUp = 2-3 concrete things " +
              "to do before tomorrow. Plain professional English.",
          },
          {
            role: "user",
            content: JSON.stringify({ kpis, priorityQueue }),
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content ?? "{}";
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.headline === "string" && parsed.headline.trim()) {
          headline = parsed.headline.trim();
        }
        if (Array.isArray(parsed.headsUp)) {
          headsUp = parsed.headsUp
            .filter((s: unknown): s is string => typeof s === "string")
            .slice(0, 4);
        }
      } catch {}
    } catch (err) {
      console.error("EOD OpenAI call failed:", err);
    }

    await ctx.runMutation(
      internal.scheduled.briefingHelpers._internalSaveBriefing,
      {
        userId: args.nurseId,
        date: today,
        type: "end_of_day",
        content: {
          headline,
          priorityQueue,
          kpis: {
            panelSize: kpis.panelSize,
            reachedThisMonth: kpis.reachedThisMonth,
            reachRate: kpis.reachRate,
            avgDocMinutes: kpis.avgDocMinutes,
            serviceElementCoverage: kpis.serviceElementCoverage,
          },
          headsUp,
          recap: "End-of-day wrap generated.",
        },
      },
    );

    return { ok: true };
  },
});
