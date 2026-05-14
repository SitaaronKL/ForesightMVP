"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useState } from "react";

const SECTIONS = [
  ["problemList", "Problem list"],
  ["expectedOutcomes", "Expected outcomes"],
  ["treatmentGoals", "Treatment goals"],
  ["symptomManagement", "Symptom management"],
  ["plannedInterventions", "Planned interventions"],
  ["medicationManagement", "Medication management"],
  ["communityResources", "Community + social services"],
  ["providerCoordination", "Provider coordination"],
] as const;

export function CarePlanTab({ patientId }: { patientId: Id<"patients"> }) {
  const data = useQuery(api.queries.carePlans.current, { patientId });
  const versions = useQuery(api.queries.carePlans.versions, { patientId });
  const [showHistory, setShowHistory] = useState(false);

  if (!data) return <div className="glass p-6 text-brand-500">Loading…</div>;
  if (!data.currentVersion) {
    return (
      <div className="glass p-6 text-brand-500 text-sm italic">
        No care plan exists yet for this patient.
      </div>
    );
  }

  const v = data.currentVersion;

  return (
    <div className="space-y-4">
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-brand-900 tracking-wide uppercase">
              Care plan (v{v.versionNumber})
            </h3>
            <p className="text-xs text-brand-500 mt-0.5">
              Last updated {new Date(v.draftedAt).toLocaleDateString()} · {v.diffSummary}
            </p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs px-3 py-1.5 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700"
          >
            History ({versions?.length ?? 0})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {SECTIONS.map(([key, label]) => (
            <div key={key}>
              <h4 className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider mb-1">
                {label}
              </h4>
              <ul className="text-sm text-brand-800 space-y-0.5">
                {((v.content as any)[key] as string[]).map((item, i) => (
                  <li key={i}>· {item}</li>
                ))}
              </ul>
            </div>
          ))}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider mb-1">
              Review schedule
            </h4>
            <p className="text-sm text-brand-800">{v.content.reviewSchedule}</p>
          </div>
        </div>
      </div>

      {showHistory && versions && (
        <HistoryModal versions={versions} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}

function HistoryModal({
  versions,
  onClose,
}: {
  versions: any[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<any>(versions[0]);
  const prev = versions.find(
    (x: any) => x.versionNumber === selected.versionNumber - 1,
  );

  return (
    <div className="fixed inset-0 z-40 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="glass max-w-5xl w-full max-h-[85vh] flex overflow-hidden">
        {/* Timeline */}
        <div className="w-[280px] border-r border-brand-100 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-900">Version history</h3>
            <button onClick={onClose} className="text-brand-500 hover:text-brand-900">
              ×
            </button>
          </div>
          <div className="space-y-1">
            {versions.map((v) => (
              <button
                key={v._id}
                onClick={() => setSelected(v)}
                className={`w-full text-left p-2 rounded-md transition ${
                  selected._id === v._id
                    ? "bg-brand-900 text-white"
                    : "hover:bg-brand-50"
                }`}
              >
                <div className="text-xs font-semibold">
                  v{v.versionNumber}
                  <span
                    className={`ml-2 text-[9px] uppercase px-1.5 py-0.5 rounded ${
                      selected._id === v._id
                        ? "bg-white/20"
                        : "bg-teal-500/10 text-teal-700"
                    }`}
                  >
                    {v.draftSource}
                  </span>
                </div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    selected._id === v._id ? "text-white/80" : "text-brand-500"
                  }`}
                >
                  {new Date(v.draftedAt).toLocaleDateString()}
                </div>
                <div
                  className={`text-xs mt-1 truncate ${
                    selected._id === v._id ? "text-white/90" : "text-brand-700"
                  }`}
                >
                  {v.diffSummary}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Diff body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-brand-900">
              v{selected.versionNumber} · {new Date(selected.draftedAt).toLocaleDateString()}
            </h3>
            <p className="text-xs text-brand-500 mt-1">
              {selected.rationale}
            </p>
            <p className="text-xs text-brand-600 mt-1">
              Drafted by {selected.drafter?.name ?? "—"}
              {selected.approver && `, approved by ${selected.approver.name}`}
            </p>
          </div>

          <div className="space-y-4">
            {SECTIONS.map(([key, label]) => {
              const cur = ((selected.content as any)[key] as string[]) ?? [];
              const old = prev ? ((prev.content as any)[key] as string[]) ?? [] : [];
              const added = cur.filter((c: string) => !old.includes(c));
              const removed = old.filter((c: string) => !cur.includes(c));
              const unchanged = cur.filter((c: string) => old.includes(c));
              return (
                <div key={key}>
                  <h4 className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider mb-1">
                    {label}
                  </h4>
                  <ul className="text-sm space-y-0.5">
                    {unchanged.map((u: string, i: number) => (
                      <li key={`u${i}`} className="text-brand-800">· {u}</li>
                    ))}
                    {added.map((a: string, i: number) => (
                      <li key={`a${i}`}>
                        <span className="diff-add">+ {a}</span>
                      </li>
                    ))}
                    {removed.map((r: string, i: number) => (
                      <li key={`r${i}`}>
                        <span className="diff-remove">- {r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
