"use client";

import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Link from "next/link";
import { RiskBadge, TierBadge, BillingBadge } from "../../components/RiskBadge";
import { useState } from "react";

export default function DashboardPage() {
  const kpis = useQuery(api.queries.panels.kpis, {});
  const queue = useQuery(api.queries.panels.todaysQueue, { limit: 8 });
  const briefing = useQuery(api.queries.agent.todaysBriefing, { type: "morning" });

  const [tierFilter, setTierFilter] = useState<string | undefined>();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState("");

  const panel = usePaginatedQuery(
    api.queries.panels.list,
    { tierFilter, overdueOnly: overdueOnly || undefined, search: search || undefined },
    { initialNumItems: 25 },
  );

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Panel size" value={kpis?.panelSize ?? "—"} />
        <Kpi label="Reached this month" value={kpis?.reachedThisMonth ?? "—"} />
        <Kpi
          label="Reach rate"
          value={kpis ? `${Math.round(kpis.reachRate * 100)}%` : "—"}
          tone={kpis ? (kpis.reachRate >= 0.8 ? "ok" : kpis.reachRate >= 0.7 ? "warn" : "bad") : "neutral"}
        />
        <Kpi
          label="Avg doc / patient"
          value={kpis ? `${kpis.avgDocMinutes.toFixed(1)} min` : "—"}
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
        />
      </section>

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

      {/* Full panel */}
      <section className="glass p-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
          <h2 className="text-sm font-semibold text-brand-900 tracking-wide uppercase">
            Full panel
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/60 border border-brand-100 w-40"
            />
            <select
              value={tierFilter ?? ""}
              onChange={(e) => setTierFilter(e.target.value || undefined)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/60 border border-brand-100"
            >
              <option value="">All tiers</option>
              <option value="level_3">Level 3</option>
              <option value="level_2">Level 2</option>
              <option value="level_1">Level 1</option>
            </select>
            <button
              onClick={() => setOverdueOnly((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                overdueOnly
                  ? "bg-brand-900 text-white border-brand-900"
                  : "bg-white/60 text-brand-700 border-brand-100"
              }`}
            >
              Overdue
            </button>
          </div>
        </div>
        <div className="grid gap-2">
          {panel.results?.map((p: any) => (
            <PatientPill key={p._id} patient={p} />
          ))}
        </div>
        {panel.status === "CanLoadMore" && (
          <div className="mt-3 text-center">
            <button
              onClick={() => panel.loadMore(25)}
              className="text-xs px-4 py-1.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700"
            >
              Load more
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function PatientPill({ patient: p }: { patient: any }) {
  return (
    <Link
      href={`/patient/${p._id}`}
      className="flex items-center justify-between gap-3 pl-2 pr-4 py-2 rounded-full bg-white/60 hover:bg-white/90 transition border border-brand-100 min-w-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <RiskBadge score={p.riskScore} />
        <TierBadge tier={p.tier} />
        <BillingBadge program={p.billingProgram} />
        <span className="font-medium text-brand-900 truncate">
          {p.firstName} {p.lastName}
        </span>
      </div>
      <span className="text-xs text-brand-600 truncate flex-shrink min-w-0 max-w-[45%] text-right">
        {p.urgencyReason}
      </span>
    </Link>
  );
}

function Kpi({
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
    <div className="glass p-4">
      <div className="text-xs text-brand-500 uppercase tracking-wider">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
