"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PatientPill } from "../../components/PatientPill";
import { HelpHint } from "../../components/HelpHint";

export default function DashboardPage() {
  const kpis = useQuery(api.queries.panels.kpis, {});
  const queue = useQuery(api.queries.panels.todaysQueue, { limit: 8 });
  const briefing = useQuery(api.queries.agent.todaysBriefing, { type: "morning" });

  return (
    <div className="space-y-6">
      {/* Page title */}
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-brand-950">
          Today&apos;s Queue
        </h1>
        <p className="mt-1 text-sm text-brand-600">
          {queue ? `${queue.length} patients flagged for today.` : "Loading panel…"}
        </p>
      </header>

      {/* Combined stats + queue panel */}
      <section className="glass overflow-hidden">
        {/* Stats strip */}
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-brand-100/70">
          <Kpi
            label="Panel size"
            value={kpis?.panelSize ?? "—"}
            hint="Total active patients enrolled in your panel right now."
          />
          <Kpi
            label="Reached this month"
            value={kpis?.reachedThisMonth ?? "—"}
            hint="Patients you've had at least one billable contact with this calendar month."
          />
          <Kpi
            label="Reach rate"
            value={kpis ? `${Math.round(kpis.reachRate * 100)}%` : "—"}
            tone={
              kpis ? (kpis.reachRate >= 0.8 ? "ok" : kpis.reachRate >= 0.7 ? "warn" : "bad") : "neutral"
            }
            hint="Share of your panel reached this month. Green ≥ 80%, amber 70–79%, red below 70%."
          />
          <Kpi
            label="Avg doc / patient"
            value={kpis ? `${kpis.avgDocMinutes.toFixed(1)} min` : "—"}
            hint="Average documentation time per patient this month, across all encounters."
          />
          <Kpi
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
            hint="Share of APCM patients with all required service elements met for the current month."
          />
        </div>

        {/* Queue */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h2 className="text-xs font-semibold text-brand-700 tracking-wide uppercase">
              Priority queue
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
        </div>
      </section>

      {/* Briefing (kept separate) */}
      {briefing?.content && (
        <section className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand-950 tracking-wide uppercase">
              Today&apos;s briefing
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
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: any;
  tone?: "neutral" | "ok" | "warn" | "bad";
  hint?: string;
}) {
  const toneClass = {
    neutral: "text-brand-950",
    ok: "text-green-700",
    warn: "text-amber-700",
    bad: "text-red-warning",
  }[tone];
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-brand-500 uppercase tracking-wider">
        {label}
        {hint && (
          <>
            {" "}
            <HelpHint>{hint}</HelpHint>
          </>
        )}
      </span>
      <span className={`mt-0.5 text-xl font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}
