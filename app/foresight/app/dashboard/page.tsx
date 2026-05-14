"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { LiquidGlass } from "../../components/LiquidGlass";
import { PatientPill } from "../../components/PatientPill";

export default function DashboardPage() {
  const kpis = useQuery(api.queries.panels.kpis, {});
  const queue = useQuery(api.queries.panels.todaysQueue, { limit: 8 });
  const briefing = useQuery(api.queries.agent.todaysBriefing, { type: "morning" });

  return (
    <div className="space-y-6">
      {/* KPI bento (WebGL liquid glass) */}
      <div className="w-[280px]">
        <LiquidGlass borderRadius={20} tintOpacity={0.08}>
          <div className="flex flex-col gap-2 p-5 w-[280px] h-[280px] justify-center">
            <KpiRow label="Panel size" value={kpis?.panelSize ?? "—"} />
            <KpiRow label="Reached this month" value={kpis?.reachedThisMonth ?? "—"} />
            <KpiRow
              label="Reach rate"
              value={kpis ? `${Math.round(kpis.reachRate * 100)}%` : "—"}
              tone={kpis ? (kpis.reachRate >= 0.8 ? "ok" : kpis.reachRate >= 0.7 ? "warn" : "bad") : "neutral"}
            />
            <KpiRow
              label="Avg doc / patient"
              value={kpis ? `${kpis.avgDocMinutes.toFixed(1)} min` : "—"}
            />
            <KpiRow
              label="APCM coverage"
              value={kpis ? `${Math.round(kpis.serviceElementCoverage * 100)}%` : "—"}
              tone={
                kpis
                  ? kpis.serviceElementCoverage >= 0.7
                    ? "ok"
                    : kpis.serviceElementCoverage >= 0.5
                      ? "warn"
                      : "bad"
                  : "neutral"
              }
            />
          </div>
        </LiquidGlass>
      </div>

      {/* Briefing */}
      {briefing?.content && (
        <section className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand-900 tracking-wide uppercase">
              Today's briefing
            </h2>
            <span className="text-xs text-brand-500">{briefing.date}</span>
          </div>
          <p className="text-brand-800 leading-relaxed text-sm">
            {(briefing.content as any).headline}
          </p>
          {((briefing.content as any).headsUp?.length ?? 0) > 0 && (
            <ul className="mt-3 text-xs text-brand-600 space-y-1">
              {((briefing.content as any).headsUp as string[]).slice(0, 3).map((h, i) => (
                <li key={i}>• {h}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Today's queue */}
      <section className="glass p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-sm font-semibold text-brand-900 tracking-wide uppercase">
            Today's queue
          </h2>
          <span className="text-xs text-brand-500 flex-shrink-0">
            {queue?.length ?? 0} patients flagged
          </span>
        </div>
        <div className="grid gap-2">
          {queue?.map((p) => (
            <PatientPill key={p._id} patient={p} />
          ))}
          {queue?.length === 0 && (
            <div className="text-xs text-brand-500 py-4 text-center">
              No urgent patients today. Nice work.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: any;
  tone?: "neutral" | "ok" | "warn" | "bad";
}) {
  const toneClass = {
    neutral: "text-brand-900",
    ok: "text-green-700",
    warn: "text-amber-700",
    bad: "text-red-warning",
  }[tone];
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-brand-600">{label}</span>
      <span className={`text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}
