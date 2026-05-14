import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { requireNurse } from "../lib/auth";
import {
  urgencyScore,
  isOverdue,
  isDueThisWeek,
  isDueToday,
  reasonFor,
} from "../lib/urgency";

/**
 * Paginated panel list for the dashboard, sorted by urgency.
 * Never accepts a nurseId argument; always uses the calling user.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    tierFilter: v.optional(v.string()),
    statusFilter: v.optional(v.string()),
    overdueOnly: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);

    const hasFilter =
      !!args.tierFilter ||
      args.overdueOnly === true ||
      (args.search && args.search.trim().length > 0);

    // When any filter is on, we collect the whole panel and slice in-memory.
    // This gives a stable urgency sort across all results and avoids empty pages.
    // Panel sizes are bounded (typical nurse panel: 100-500), so .collect() is fine.
    if (hasFilter) {
      const all = await ctx.db
        .query("patients")
        .withIndex("by_primary_nurse", (q) =>
          q.eq("primaryNurseId", nurse._id).eq("status", "active"),
        )
        .collect();
      const searchLower = (args.search ?? "").toLowerCase().trim();
      const filtered = all.filter((p) => {
        if (args.tierFilter && p.tier !== args.tierFilter) return false;
        if (args.overdueOnly && !isOverdue(p)) return false;
        if (
          searchLower &&
          !`${p.firstName} ${p.lastName}`.toLowerCase().includes(searchLower)
        )
          return false;
        return true;
      });
      const decorated = filtered
        .map((p) => ({
          ...p,
          urgencyScore: urgencyScore(p),
          urgencyReason: reasonFor(p),
          overdue: isOverdue(p),
          dueThisWeek: isDueThisWeek(p),
          dueToday: isDueToday(p),
        }))
        .sort((a, b) => b.urgencyScore - a.urgencyScore);
      // Synthesize a single-page pagination result
      return {
        page: decorated,
        isDone: true,
        continueCursor: null as any,
      };
    }

    // No filter: native Convex pagination
    const result = await ctx.db
      .query("patients")
      .withIndex("by_primary_nurse", (q) =>
        q.eq("primaryNurseId", nurse._id).eq("status", "active"),
      )
      .paginate(args.paginationOpts);

    const decorated = result.page
      .map((p) => ({
        ...p,
        urgencyScore: urgencyScore(p),
        urgencyReason: reasonFor(p),
        overdue: isOverdue(p),
        dueThisWeek: isDueThisWeek(p),
        dueToday: isDueToday(p),
      }))
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    return { ...result, page: decorated };
  },
});

/**
 * Today's priority queue: top N most urgent patients across the panel.
 * Used by the dashboard "Today's queue" section and the morning briefing.
 */
export const todaysQueue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    const all = await ctx.db
      .query("patients")
      .withIndex("by_primary_nurse", (q) =>
        q.eq("primaryNurseId", nurse._id).eq("status", "active"),
      )
      .collect();
    const decorated = all
      .map((p) => ({
        ...p,
        urgencyScore: urgencyScore(p),
        urgencyReason: reasonFor(p),
      }))
      .filter((p) => isDueToday(p) || p.riskScore > 70)
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, args.limit ?? 12);
    return decorated;
  },
});

async function computeKpisForNurse(
  ctx: any,
  nurseId: any,
  monthArg?: string,
) {
  const now = new Date();
  const month =
    monthArg ??
    `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const panel = await ctx.db
    .query("patients")
    .withIndex("by_primary_nurse", (q: any) =>
      q.eq("primaryNurseId", nurseId).eq("status", "active"),
    )
    .collect();
  const panelSize = panel.length;

  const encounters = await ctx.db
    .query("encounters")
    .withIndex("by_nurse_and_date", (q: any) => q.eq("nurseId", nurseId))
    .collect();
  const monthStart = new Date(`${month}-01T00:00:00Z`).getTime();
  const monthEnd =
    new Date(
      new Date(monthStart).getUTCFullYear(),
      new Date(monthStart).getUTCMonth() + 1,
      1,
    ).getTime();
  const monthEncounters = encounters.filter(
    (e: any) =>
      e.startedAt >= monthStart &&
      e.startedAt < monthEnd &&
      e.status === "completed",
  );
  const reachedSet = new Set(monthEncounters.map((e: any) => e.patientId));
  const reachRate = panelSize === 0 ? 0 : reachedSet.size / panelSize;

  const timeLogs = await ctx.db
    .query("timeLogs")
    .withIndex("by_nurse_and_month", (q: any) =>
      q.eq("nurseId", nurseId).eq("month", month),
    )
    .collect();
  const totalDocSeconds = timeLogs
    .filter((t: any) => t.activityType === "documentation")
    .reduce((sum: number, t: any) => sum + t.durationSeconds, 0);
  const avgDocMinutes = panelSize === 0 ? 0 : totalDocSeconds / 60 / panelSize;

  const apcmPatients = panel.filter((p: any) => p.billingProgram === "apcm");
  const totalElements = apcmPatients.length * 11;
  let deliveredElements = 0;
  for (const p of apcmPatients) {
    const els = await ctx.db
      .query("serviceElements")
      .withIndex("by_patient_and_month", (q: any) =>
        q.eq("patientId", p._id).eq("month", month),
      )
      .collect();
    deliveredElements += els.filter((e: any) => e.status === "delivered").length;
  }
  const serviceElementCoverage =
    totalElements === 0 ? 0 : deliveredElements / totalElements;

  return {
    panelSize,
    reachedThisMonth: reachedSet.size,
    reachRate,
    avgDocMinutes,
    serviceElementCoverage,
    month,
  };
}

async function computeTodaysQueueForNurse(ctx: any, nurseId: any, limit: number) {
  const all = await ctx.db
    .query("patients")
    .withIndex("by_primary_nurse", (q: any) =>
      q.eq("primaryNurseId", nurseId).eq("status", "active"),
    )
    .collect();
  return all
    .map((p: any) => ({
      ...p,
      urgencyScore: urgencyScore(p),
      urgencyReason: reasonFor(p),
    }))
    .filter((p: any) => isDueToday(p) || p.riskScore > 70)
    .sort((a: any, b: any) => b.urgencyScore - a.urgencyScore)
    .slice(0, limit);
}

/**
 * KPI strip data: panel size, reach rate, average doc minutes, service-element coverage.
 */
export const kpis = query({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    return await computeKpisForNurse(ctx, nurse._id, args.month);
  },
});

// Internal version (no auth) for server-side use by scheduled briefings / actions.
export const _internalKpisForNurse = internalQuery({
  args: { nurseId: v.id("users"), month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await computeKpisForNurse(ctx, args.nurseId, args.month);
  },
});

export const _internalTodaysQueueForNurse = internalQuery({
  args: { nurseId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await computeTodaysQueueForNurse(ctx, args.nurseId, args.limit ?? 12);
  },
});
