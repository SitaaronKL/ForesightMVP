"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { PatientPill } from "../../components/PatientPill";
import { HelpHint } from "../../components/HelpHint";
import { Spinner } from "../../components/Spinner";
import { SunIcon, type SunIconHandle } from "../../components/SunIcon";
import { MoonIcon, type MoonIconHandle } from "../../components/MoonIcon";
import { SyringeIcon, type SyringeIconHandle } from "../../components/SyringeIcon";
import { BellIcon, type BellIconHandle } from "../../components/BellIcon";

export default function DashboardPage() {
  const kpis = useQuery(api.queries.panels.kpis, {});
  const queue = useQuery(api.queries.panels.todaysQueue, { limit: 8 });
  const reached = useQuery(api.queries.panels.reachedToday, { limit: 12 });
  const morningBriefing = useQuery(api.queries.agent.todaysBriefing, {
    type: "morning",
  });
  const eodBriefing = useQuery(api.queries.agent.todaysBriefing, {
    type: "end_of_day",
  });

  return (
    <div className="space-y-4">
      {/* Top bento row: stats square (left) + briefing square (right) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <StatsBento kpis={kpis} queue={queue} />
        <BriefingBento morning={morningBriefing} eod={eodBriefing} />
      </section>

      {/* Priority queue — full-width wide rectangle below the bento row */}
      <PriorityQueuePanel queue={queue} />

      {/* Reached today — full-width below, only when there's at least one */}
      {(reached?.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-brand-100 bg-white p-5">
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
        </section>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function StatsBento({
  kpis,
  queue,
}: {
  kpis: any;
  queue: any[] | undefined;
}) {
  const syringeRef = useRef<SyringeIconHandle>(null);
  return (
    <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden flex flex-col">
      <header
        className="px-6 pt-5 pb-4 flex items-center gap-5"
        style={{
          backgroundImage: "url(/image-mesh-gradient.png)",
          backgroundSize: "200% 200%",
          backgroundPosition: "0% 0%",
        }}
        onMouseEnter={() => syringeRef.current?.startAnimation()}
        onMouseLeave={() => syringeRef.current?.stopAnimation()}
      >
        <SyringeIcon
          ref={syringeRef}
          size={44}
          className="flex items-center flex-shrink-0 text-brand-950/85 drop-shadow-sm"
        />
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-brand-950">
            Today&apos;s Queue
          </h2>
          <p className="mt-0.5 text-xs text-brand-950">
            {queue ? `${queue.length} patients flagged for today.` : "Loading…"}
          </p>
        </div>
      </header>

      {/* 2 × 3 stats grid — fills the square evenly */}
      <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-x-6 gap-y-4 p-6">
        <Kpi
          label="Panel size"
          value={kpis?.panelSize ?? "—"}
          hint="Total active patients enrolled in your panel right now."
        />
        <Kpi
          label="Reached"
          value={kpis?.reachedThisMonth ?? "—"}
          hint="Patients you've had at least one billable contact with this calendar month."
        />
        <Kpi
          label="Reach rate"
          value={kpis ? `${Math.round(kpis.reachRate * 100)}%` : "—"}
          tone={
            kpis
              ? kpis.reachRate >= 0.8
                ? "ok"
                : kpis.reachRate >= 0.7
                  ? "warn"
                  : "bad"
              : "neutral"
          }
          hint="Share of your panel reached this month. Green ≥ 80%, amber 70–79%, red below 70%."
        />
        <Kpi
          label="Avg doc"
          value={kpis ? `${kpis.avgDocMinutes.toFixed(1)}m` : "—"}
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
    </div>
  );
}

function PriorityQueuePanel({ queue }: { queue: any[] | undefined }) {
  const bellRef = useRef<BellIconHandle>(null);
  const count = queue?.length ?? 0;
  return (
    <section className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
      <header
        className="px-6 pt-5 pb-4 flex items-center gap-5"
        style={{
          backgroundImage: "url(/image-mesh-gradient.png)",
          backgroundSize: "200% 200%",
          backgroundPosition: "50% 100%",
        }}
        onMouseEnter={() => bellRef.current?.startAnimation()}
        onMouseLeave={() => bellRef.current?.stopAnimation()}
      >
        <BellIcon
          ref={bellRef}
          size={44}
          className="flex items-center flex-shrink-0 text-brand-950/85 drop-shadow-sm"
        />
        <div
          className="min-w-0 flex-1"
          onMouseEnter={() => bellRef.current?.startAnimation()}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-brand-950">
            Priority Queue
          </h2>
          <p className="mt-0.5 text-xs text-brand-950">
            {queue
              ? `${count} ${count === 1 ? "patient" : "patients"} flagged for today.`
              : "Loading…"}
          </p>
        </div>
      </header>
      <div className="p-5 grid gap-2">
        {queue?.map((p) => (
          <PatientPill key={p._id} patient={p} billingIconOnly />
        ))}
        {queue?.length === 0 && (
          <div className="text-xs text-brand-500 py-4 text-center">
            No urgent patients today. Nice work.
          </div>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function BriefingBento({
  morning,
  eod,
}: {
  morning: any;
  eod: any;
}) {
  const hasMorning = !!morning?.content;
  const hasEod = !!eod?.content;
  const [active, setActive] = useState<"morning" | "eod">("morning");
  const triggerMorning = useAction(api.admin.triggerMorningBriefing);
  const triggerEod = useAction(api.admin.triggerEndOfDay);
  const [generating, setGenerating] = useState<null | "morning" | "eod">(null);
  const [genError, setGenError] = useState<string | null>(null);
  const emptySunRef = useRef<SunIconHandle>(null);
  const emptyMoonRef = useRef<MoonIconHandle>(null);

  function handleToggle() {
    const next = active === "morning" ? "eod" : "morning";
    const exists = next === "morning" ? hasMorning : hasEod;
    if (exists) setActive(next);
    else generate(next);
  }

  // Default to whichever briefing exists; prefer morning when both do.
  useEffect(() => {
    if (active === "morning" && !hasMorning && hasEod) setActive("eod");
    if (active === "eod" && !hasEod && hasMorning) setActive("morning");
  }, [active, hasMorning, hasEod]);

  async function generate(kind: "morning" | "eod") {
    setGenError(null);
    setGenerating(kind);
    try {
      if (kind === "morning") await triggerMorning({});
      else await triggerEod({});
      setActive(kind);
    } catch (err: any) {
      setGenError(err?.message ?? "Failed to generate briefing.");
    } finally {
      setGenerating(null);
    }
  }

  const current = active === "morning" ? morning : eod;
  const title = active === "morning" ? "Morning briefing" : "End-of-day wrap";

  // Loading state
  if (morning === undefined || eod === undefined) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-white p-5 flex items-center justify-center">
        <Spinner size={14} label="Loading briefings…" />
      </div>
    );
  }

  // No briefing yet — show the generate affordance
  if (!hasMorning && !hasEod) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-white p-5 flex flex-col">
        <header className="mb-2">
          <h2 className="text-xs font-semibold text-brand-700 tracking-wide uppercase">
            Briefings
          </h2>
          <p className="text-sm text-brand-600 mt-1 leading-relaxed">
            No briefing yet today. Generate one to see your day at a glance.
          </p>
        </header>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => generate("morning")}
            onMouseEnter={() => emptySunRef.current?.startAnimation()}
            onMouseLeave={() => emptySunRef.current?.stopAnimation()}
            disabled={generating !== null}
            className="text-xs px-3 py-1.5 rounded-full bg-foresight hover:bg-foresight-dark text-white transition shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
          >
            <SunIcon ref={emptySunRef} size={14} className="flex items-center" />
            {generating === "morning"
              ? "Generating…"
              : "Generate morning briefing"}
          </button>
          <button
            onClick={() => generate("eod")}
            onMouseEnter={() => emptyMoonRef.current?.startAnimation()}
            onMouseLeave={() => emptyMoonRef.current?.stopAnimation()}
            disabled={generating !== null}
            className="text-xs px-3 py-1.5 rounded-full bg-white border border-brand-100 text-brand-700 hover:text-foresight hover:bg-foresight/5 transition shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
          >
            <MoonIcon ref={emptyMoonRef} size={14} className="flex items-center" />
            {generating === "eod"
              ? "Generating…"
              : "Generate end-of-day wrap"}
          </button>
        </div>
        {genError && (
          <p className="mt-3 text-xs text-red-warning">{genError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden flex flex-col">
      {/* Header with mesh-gradient background + sun/moon toggle */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{
          backgroundImage: "url(/image-mesh-gradient.png)",
          backgroundSize: "200% 200%",
          backgroundPosition: "100% 0%",
        }}
      >
        <div className="flex items-center gap-3 text-brand-950 min-w-0">
          <span className="flex items-center justify-center flex-shrink-0">
            {active === "morning" ? (
              <SunIcon size={32} className="flex items-center" />
            ) : (
              <MoonIcon size={32} className="flex items-center" />
            )}
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <h2 className="text-xs font-semibold tracking-wide uppercase truncate">
              {title}
            </h2>
            {current?.date && (
              <span className="text-[11px] text-brand-950">{current.date}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={generating !== null}
          aria-label={
            active === "morning"
              ? "Switch to end-of-day wrap"
              : "Switch to morning briefing"
          }
          title={
            active === "morning"
              ? hasEod
                ? "Switch to end-of-day wrap"
                : "Generate end-of-day wrap"
              : hasMorning
                ? "Switch to morning briefing"
                : "Generate morning briefing"
          }
          className="flex items-center gap-0.5 bg-white/60 backdrop-blur-sm rounded-full p-0.5 transition hover:bg-white/80 disabled:opacity-50 cursor-pointer"
        >
          <span
            className={`h-6 w-6 rounded-full flex items-center justify-center transition ${
              active === "morning"
                ? "bg-white text-brand-950 shadow-sm"
                : "text-brand-700"
            }`}
          >
            <SunIcon size={12} className="flex items-center" />
          </span>
          <span
            className={`h-6 w-6 rounded-full flex items-center justify-center transition ${
              active === "eod"
                ? "bg-white text-brand-950 shadow-sm"
                : "text-brand-700"
            }`}
          >
            <MoonIcon size={12} className="flex items-center" />
          </span>
        </button>
      </div>

      <div className="px-5 py-4 flex-1 min-h-0 overflow-y-auto">
        {generating === active ? (
          <Spinner size={14} label="Generating…" />
        ) : current?.content ? (
          <>
            {current.content.headline && (
              <p className="text-brand-950 leading-relaxed text-sm">
                {current.content.headline}
              </p>
            )}
            {(current.content.headsUp?.length ?? 0) > 0 && (
              <ul className="mt-3 text-xs text-brand-700 space-y-1.5">
                {current.content.headsUp.slice(0, 4).map((h: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-foresight">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          // The active type doesn't have a briefing yet — offer to generate.
          <div className="text-sm text-brand-600 leading-relaxed">
            No {active === "morning" ? "morning briefing" : "end-of-day wrap"}{" "}
            yet today.{" "}
            <button
              type="button"
              onClick={() => generate(active)}
              disabled={generating !== null}
              className="underline text-foresight hover:text-foresight-dark"
            >
              Generate it now
            </button>
            .
          </div>
        )}
        {genError && (
          <p className="mt-3 text-xs text-red-warning">{genError}</p>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

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
    <div className="flex flex-col justify-center">
      <span className="text-[10px] text-brand-500 uppercase tracking-wider flex items-center gap-1">
        {label}
        {hint && <HelpHint>{hint}</HelpHint>}
      </span>
      <span className={`mt-1 text-2xl font-semibold leading-none ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}
