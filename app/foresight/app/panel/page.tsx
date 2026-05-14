"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRef, useState } from "react";
import { PatientPill } from "../../components/PatientPill";
import { PatientCard } from "../../components/PatientCard";
import {
  LayoutPanelTopIcon,
  type LayoutPanelTopIconHandle,
} from "../../components/LayoutPanelTopIcon";
import {
  SquareStackIcon,
  type SquareStackIconHandle,
} from "../../components/SquareStackIcon";

type View = "list" | "grid";

export default function FullPanelPage() {
  const [tierFilter, setTierFilter] = useState<string | undefined>();
  const [programFilter, setProgramFilter] = useState<string | undefined>();
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("list");

  const listIconRef = useRef<SquareStackIconHandle>(null);
  const gridIconRef = useRef<LayoutPanelTopIconHandle>(null);

  const panel = usePaginatedQuery(
    api.queries.panels.list,
    {
      tierFilter,
      programFilter,
      overdueOnly: overdueOnly || undefined,
      search: search || undefined,
    },
    { initialNumItems: 25 },
  );

  const total = panel.results?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Page title — matches Today's Queue */}
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-brand-950">
          Full panel
        </h1>
        <p className="mt-1 text-sm text-brand-600">
          {panel.status === "LoadingFirstPage"
            ? "Loading panel…"
            : `${total} patients shown.`}
        </p>
      </header>

      {/* Panel body */}
      <section className="glass p-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
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
            <select
              value={programFilter ?? ""}
              onChange={(e) => setProgramFilter(e.target.value || undefined)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/60 border border-brand-100"
            >
              <option value="">All programs</option>
              <option value="ccm">CCM</option>
              <option value="pcm">PCM</option>
              <option value="apcm">APCM</option>
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

          {/* List / Grid view toggle */}
          <div className="inline-flex items-center rounded-full bg-white/60 border border-brand-100 p-0.5">
            <button
              onClick={() => setView("list")}
              onMouseEnter={() => listIconRef.current?.startAnimation()}
              onMouseLeave={() => listIconRef.current?.stopAnimation()}
              aria-label="List view"
              aria-pressed={view === "list"}
              title="List view"
              className={`inline-flex items-center justify-center w-8 h-7 rounded-full transition ${
                view === "list"
                  ? "bg-foresight text-white"
                  : "text-brand-700 hover:text-foresight"
              }`}
            >
              <SquareStackIcon
                ref={listIconRef}
                size={14}
                className="flex items-center"
              />
            </button>
            <button
              onClick={() => setView("grid")}
              onMouseEnter={() => gridIconRef.current?.startAnimation()}
              onMouseLeave={() => gridIconRef.current?.stopAnimation()}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              title="Grid view"
              className={`inline-flex items-center justify-center w-8 h-7 rounded-full transition ${
                view === "grid"
                  ? "bg-foresight text-white"
                  : "text-brand-700 hover:text-foresight"
              }`}
            >
              <LayoutPanelTopIcon
                ref={gridIconRef}
                size={14}
                className="flex items-center"
              />
            </button>
          </div>
        </div>

        {view === "list" ? (
          <div className="grid gap-2">
            {panel.results?.map((p: any) => (
              <PatientPill key={p._id} patient={p} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {panel.results?.map((p: any) => (
              <PatientCard key={p._id} patient={p} />
            ))}
          </div>
        )}

        {panel.status === "CanLoadMore" && (
          <div className="mt-4 text-center">
            <button
              onClick={() => panel.loadMore(25)}
              className="text-xs px-4 py-1.5 rounded-full bg-foresight hover:bg-foresight-dark text-white transition shadow-sm"
            >
              Load more
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
