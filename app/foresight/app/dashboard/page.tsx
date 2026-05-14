"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { PatientPill } from "../../components/PatientPill";
import { HelpHint } from "../../components/HelpHint";
import { Spinner } from "../../components/Spinner";

export default function DashboardPage() {
  const kpis = useQuery(api.queries.panels.kpis, {});
  const queue = useQuery(api.queries.panels.todaysQueue, { limit: 8 });
  const reached = useQuery(api.queries.panels.reachedToday, { limit: 12 });
  const morningBriefing = useQuery(api.queries.agent.todaysBriefing, { type: "morning" });
  const eodBriefing = useQuery(api.queries.agent.todaysBriefing, { type: "end_of_day" });
  const triggerMorning = useAction(api.admin.triggerMorningBriefing);
  const triggerEod = useAction(api.admin.triggerEndOfDay);
  const [generating, setGenerating] = useState<null | "morning" | "eod">(null);
  const [genError, setGenError] = useState<string | null>(null);

  async function generate(kind: "morning" | "eod") {
    setGenError(null);
    setGenerating(kind);
    try {
      if (kind === "morning") await triggerMorning({});
      else await triggerEod({});
    } catch (err: any) {
      setGenError(err?.message ?? "Failed to generate briefing.");
    } finally {
      setGenerating(null);
    }
  }

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
        <div className="px-5 py-4 flex flex-wrap items-start gap-x-10 gap-y-3 border-b border-brand-100/70">
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

        {/* Priority queue */}
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
              <PatientPill key={p._id} patient={p} billingIconOnly />
            ))}
            {queue?.length === 0 && (
              <div className="text-xs text-brand-500 py-4 text-center">
                No urgent patients today. Nice work.
              </div>
            )}
          </div>
        </div>

        {/* Reached today — only shown when there's at least one. */}
        {(reached?.length ?? 0) > 0 && (
          <div className="px-5 py-4 border-t border-brand-100/70">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="text-xs font-semibold text-brand-700 tracking-wide uppercase">
                Reached today
              </h2>
              <span className="text-xs text-brand-500 flex-shrink-0">
                {reached?.length ?? 0}{" "}
                {(reached?.length ?? 0) === 1 ? "patient" : "patients"}
              </span>
            </div>
            <div className="grid gap-2">
              {reached?.map((p) => (
                <PatientPill key={p._id} patient={p} billingIconOnly />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Briefings — morning + end-of-day, shown when generated. */}
      {(morningBriefing?.content || eodBriefing?.content) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {morningBriefing?.content && (
            <BriefingCard
              title="Morning briefing"
              accent="from-foresight to-foresight-light"
              date={morningBriefing.date}
              content={morningBriefing.content as any}
            />
          )}
          {eodBriefing?.content && (
            <BriefingCard
              title="End-of-day wrap"
              accent="from-foresight-dark to-foresight"
              date={eodBriefing.date}
              content={eodBriefing.content as any}
            />
          )}
        </section>
      )}

      {/* Empty / loading state — let the nurse generate her own briefings right here. */}
      {!morningBriefing?.content && !eodBriefing?.content && (
        <section className="glass p-5">
          <h2 className="text-xs font-semibold text-brand-700 tracking-wide uppercase mb-1">
            Briefings
          </h2>
          {morningBriefing === undefined || eodBriefing === undefined ? (
            <Spinner size={14} label="Loading today’s briefings…" />
          ) : (
            <>
              <p className="text-sm text-brand-600 leading-relaxed">
                No briefing generated yet today. Generate them for yourself:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => generate("morning")}
                  disabled={generating !== null}
                  className="text-xs px-3 py-1.5 rounded-full bg-foresight hover:bg-foresight-dark text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {generating === "morning" && <Spinner size={12} />}
                  {generating === "morning"
                    ? "Generating…"
                    : "Generate morning briefing"}
                </button>
                <button
                  onClick={() => generate("eod")}
                  disabled={generating !== null}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-brand-100 text-brand-700 hover:text-foresight hover:bg-foresight/5 transition shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {generating === "eod" && <Spinner size={12} />}
                  {generating === "eod"
                    ? "Generating…"
                    : "Generate end-of-day wrap"}
                </button>
              </div>
              {genError && (
                <p className="mt-3 text-xs text-red-warning">{genError}</p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function BriefingCard({
  title,
  date,
  content,
  accent,
}: {
  title: string;
  date?: string;
  content: { headline?: string; headsUp?: string[] };
  accent: string;
}) {
  return (
    <div className="glass overflow-hidden">
      <div
        className={`bg-gradient-to-r ${accent} px-5 py-3 flex items-center justify-between`}
      >
        <h2 className="text-xs font-semibold tracking-wide uppercase text-white">
          {title}
        </h2>
        {date && <span className="text-[11px] text-white/80">{date}</span>}
      </div>
      <div className="px-5 py-4">
        {content.headline && (
          <p className="text-brand-950 leading-relaxed text-sm">
            {content.headline}
          </p>
        )}
        {(content.headsUp?.length ?? 0) > 0 && (
          <ul className="mt-3 text-xs text-brand-700 space-y-1.5">
            {content.headsUp!.slice(0, 4).map((h, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-foresight">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
