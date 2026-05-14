"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";
import { PatientPill } from "../../components/PatientPill";

export default function FullPanelPage() {
  const [tierFilter, setTierFilter] = useState<string | undefined>();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState("");

  const panel = usePaginatedQuery(
    api.queries.panels.list,
    { tierFilter, overdueOnly: overdueOnly || undefined, search: search || undefined },
    { initialNumItems: 25 },
  );

  return (
    <section className="glass p-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <h1 className="text-sm font-semibold text-brand-950 tracking-wide uppercase">
          Full panel
        </h1>
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
  );
}
