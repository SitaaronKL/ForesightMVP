import { v } from "convex/values";
import { query } from "../_generated/server";
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

    // Build the index query for primary panel scope.
    let q = ctx.db
      .query("patients")
      .withIndex("by_primary_nurse", (q) =>
        q.eq("primaryNurseId", nurse._id).eq("status", "active"),
      );

    const result = await q.paginate(args.paginationOpts);

    let page = result.page;
    if (args.tierFilter) {
      page = page.filter((p) => p.tier === args.tierFilter);
    }
    if (args.overdueOnly) {
      page = page.filter((p) => isOverdue(p));
    }
    if (args.search && args.search.trim().length > 0) {
      const s = args.search.toLowerCase();
      page = page.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(s),
      );
    }

    // Decorate with urgency reason for the row.
    const decorated = page
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

/**
 * KPI strip data: panel size, reach rate, average doc minutes, service-element coverage.
 */
export const kpis = query({
  args: { month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const nurse = await requireNurse(ctx);
    const now = new Date();
    const month =
      args.month ??
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const panel = await ctx.db
      .query("patients")
      .withIndex("by_primary_nurse", (q) =>
        q.eq("primaryNurseId", nurse._id).eq("status", "active"),
      )
      .collect();
    const panelSize = panel.length;

    // Encounters this month
    const encounters = await ctx.db
      .query("encounters")
      .withIndex("by_nurse_and_date", (q) => q.eq("nurseId", nurse._id))
      .collect();
    const monthStart = new Date(`${month}-01T00:00:00Z`).getTime();
    const monthEnd =
      new Date(
        new Date(monthStart).getUTCFullYear(),
        new Date(monthStart).getUTCMonth() + 1,
        1,
      ).getTime();
    const monthEncounters = encounters.filter(
      (e) =>
        e.startedAt >= monthStart &&
        e.startedAt < monthEnd &&
        e.status === "completed",
    );
    const reachedSet = new Set(monthEncounters.map((e) => e.patientId));
    const reachRate = panelSize === 0 ? 0 : reachedSet.size / panelSize;

    // Avg doc minutes (use time logs)
    const timeLogs = await ctx.db
      .query("timeLogs")
      .withIndex("by_nurse_and_month", (q) =>
        q.eq("nurseId", nurse._id).eq("month", month),
      )
      .collect();
    const totalDocSeconds = timeLogs
      .filter((t) => t.activityType === "documentation")
      .reduce((sum, t) => sum + t.durationSeconds, 0);
    const avgDocMinutes =
      panelSize === 0 ? 0 : totalDocSeconds / 60 / panelSize;

    // Service element coverage (APCM patients only)
    const apcmPatients = panel.filter((p) => p.billingProgram === "apcm");
    let totalElements = apcmPatients.length * 11;
    let deliveredElements = 0;
    for (const p of apcmPatients) {
      const els = await ctx.db
        .query("serviceElements")
        .withIndex("by_patient_and_month", (q) =>
          q.eq("patientId", p._id).eq("month", month),
        )
        .collect();
      deliveredElements += els.filter((e) => e.status === "delivered").length;
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
  },
});
