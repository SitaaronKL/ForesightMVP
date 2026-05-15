"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, X, Check, Sparkles } from "lucide-react";
import { PlusIcon, type PlusIconHandle } from "../PlusIcon";
import { HistoryIcon, type HistoryIconHandle } from "../HistoryIcon";
import {
  FilePenLineIcon,
  type FilePenLineIconHandle,
} from "../FilePenLineIcon";
import { HelpHint } from "../HelpHint";

const SECTIONS = [
  ["problemList", "Problem list", "Active diagnoses and conditions the team is managing."],
  ["expectedOutcomes", "Expected outcomes", "Concrete clinical targets (e.g., HbA1c <7.5, BP <140/90)."],
  ["treatmentGoals", "Treatment goals", "Functional and quality-of-life goals the patient and team agreed on."],
  ["symptomManagement", "Symptom management", "How acute symptoms are recognized and addressed at home."],
  ["plannedInterventions", "Planned interventions", "Specific actions and treatments scheduled this period."],
  ["medicationManagement", "Medication management", "Active meds, reconciliation cadence, refill responsibility."],
  ["communityResources", "Community + social services", "Home health, transport, meals, social work, support groups."],
  ["providerCoordination", "Provider coordination", "Specialists involved and who is responsible for what."],
] as const;

type SectionKey = (typeof SECTIONS)[number][0];

type CarePlanContent = {
  problemList: string[];
  expectedOutcomes: string[];
  treatmentGoals: string[];
  symptomManagement: string[];
  plannedInterventions: string[];
  medicationManagement: string[];
  communityResources: string[];
  providerCoordination: string[];
  reviewSchedule: string;
};

export function CarePlanTab({ patientId }: { patientId: Id<"patients"> }) {
  const data = useQuery(api.queries.carePlans.current, { patientId });
  const versions = useQuery(api.queries.carePlans.versions, { patientId });
  const createVersion = useMutation(api.mutations.carePlans.createManualVersion);
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CarePlanContent | null>(null);
  const [saving, setSaving] = useState(false);
  const historyRef = useRef<HistoryIconHandle>(null);
  const editRef = useRef<FilePenLineIconHandle>(null);

  const current = data?.currentVersion;

  // Seed the draft when entering edit mode.
  useEffect(() => {
    if (editing && current && !draft) {
      setDraft(JSON.parse(JSON.stringify(current.content)));
    }
    if (!editing) setDraft(null);
  }, [editing, current, draft]);

  if (!data) return <div className="glass p-6 text-brand-500">Loading…</div>;
  if (!current) {
    return (
      <div className="glass p-6 text-brand-500 text-sm italic">
        No care plan exists yet for this patient.
      </div>
    );
  }

  const v = current;
  const view: CarePlanContent = (editing && draft ? draft : v.content) as CarePlanContent;

  function update<K extends keyof CarePlanContent>(
    key: K,
    value: CarePlanContent[K],
  ) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function save() {
    if (!draft) return;
    const diff = computeDiffSummary(v.content as CarePlanContent, draft);
    if (!diff) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await createVersion({
        patientId,
        content: draft,
        rationale: "Nurse-initiated revision via inline editor",
        diffSummary: diff,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
        <header
          className="px-6 pt-5 pb-4"
          style={{
            backgroundImage: "url(/image-mesh-gradient.png)",
            backgroundSize: "200% 200%",
            backgroundPosition: "0% 100%",
          }}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-brand-950">
                  Care plan
                </h3>
                <span className="text-xs font-mono text-brand-950/70 bg-white/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                  v{v.versionNumber}
                </span>
                {editing && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                    Editing
                  </span>
                )}
                <HelpHint width={300}>
                  The patient's living plan. Every edit you save creates a new
                  immutable version (v{v.versionNumber + 1}, v
                  {v.versionNumber + 2}, …) with a diff trail, so audits can
                  see exactly when and why anything changed.
                </HelpHint>
              </div>
              <p className="text-xs text-brand-950/80 mt-0.5">
                Last updated {new Date(v.draftedAt).toLocaleDateString()} ·{" "}
                {v.diffSummary}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!editing && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    onMouseEnter={() => editRef.current?.startAnimation()}
                    onMouseLeave={() => editRef.current?.stopAnimation()}
                    className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 bg-foresight hover:bg-foresight-dark text-white transition shadow-sm"
                    title="Edit any section. Saving creates a new version."
                  >
                    <FilePenLineIcon
                      ref={editRef}
                      size={14}
                      className="flex items-center"
                    />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowHistory(true)}
                    onMouseEnter={() => historyRef.current?.startAnimation()}
                    onMouseLeave={() => historyRef.current?.stopAnimation()}
                    className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 bg-white/85 hover:bg-white text-brand-950 transition shadow-sm border border-brand-100"
                    aria-label="View care plan history"
                    title="Open version timeline with diffs"
                  >
                    <HistoryIcon ref={historyRef} size={14} className="flex items-center" />
                    History ({versions?.length ?? 0})
                  </button>
                </>
              )}
              {editing && (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 bg-white/85 hover:bg-white text-brand-700 transition border border-brand-100 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 bg-foresight hover:bg-foresight-dark text-white transition shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : `Save as v${v.versionNumber + 1}`}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {SECTIONS.map(([key, label, hint]) => (
            <Section
              key={key}
              label={label}
              hint={hint}
              items={(view[key as SectionKey] as string[]) ?? []}
              editing={editing}
              onChange={(items) => update(key as SectionKey, items)}
            />
          ))}
          <div className="md:col-span-2">
            <SectionHeader label="Review schedule" hint="How often the plan is revisited (e.g., monthly, quarterly)." />
            {editing ? (
              <input
                value={view.reviewSchedule ?? ""}
                onChange={(e) => update("reviewSchedule", e.target.value)}
                className="w-full text-sm rounded-lg border border-brand-100 px-3 py-1.5 focus:outline-none focus:border-foresight"
              />
            ) : (
              <p className="text-sm text-brand-800">{view.reviewSchedule}</p>
            )}
          </div>
        </div>
      </div>

      {showHistory && versions && (
        <HistoryModal versions={versions} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}

function SectionHeader({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <h4 className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider">
        {label}
      </h4>
      <HelpHint width={240}>{hint}</HelpHint>
    </div>
  );
}

function Section({
  label,
  hint,
  items,
  editing,
  onChange,
}: {
  label: string;
  hint: string;
  items: string[];
  editing: boolean;
  onChange: (items: string[]) => void;
}) {
  const addRef = useRef<PlusIconHandle>(null);
  return (
    <div>
      <SectionHeader label={label} hint={hint} />
      {editing ? (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-foresight">·</span>
              <input
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                className="flex-1 text-sm rounded-lg border border-brand-100 px-2.5 py-1 focus:outline-none focus:border-foresight"
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-brand-400 hover:text-red-warning transition flex-shrink-0"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([...items, ""])}
            onMouseEnter={() => addRef.current?.startAnimation()}
            onMouseLeave={() => addRef.current?.stopAnimation()}
            className="inline-flex items-center gap-1 text-[11px] text-foresight hover:text-foresight-dark mt-1"
          >
            <PlusIcon ref={addRef} size={12} className="flex items-center" /> Add item
          </button>
        </div>
      ) : (
        <ul className="text-sm text-brand-800 space-y-0.5">
          {items.length === 0 && (
            <li className="text-brand-400 italic text-xs">No items</li>
          )}
          {items.map((item, i) => (
            <li key={i}>· {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function computeDiffSummary(
  prev: CarePlanContent,
  next: CarePlanContent,
): string | null {
  const changes: string[] = [];
  for (const [key, label] of SECTIONS) {
    const a = (prev[key as SectionKey] as string[]) ?? [];
    const b = (next[key as SectionKey] as string[]).filter((x) => x.trim());
    const added = b.filter((x) => !a.includes(x));
    const removed = a.filter((x) => !b.includes(x));
    if (added.length || removed.length) {
      const parts: string[] = [];
      if (added.length)
        parts.push(`+${added.length} ${label.toLowerCase()}`);
      if (removed.length)
        parts.push(`-${removed.length} ${label.toLowerCase()}`);
      changes.push(parts.join(" / "));
    }
  }
  if (prev.reviewSchedule !== next.reviewSchedule) {
    changes.push("review schedule updated");
  }
  // Strip empties before saving — the caller will overwrite the draft.
  for (const [key] of SECTIONS) {
    (next as any)[key] = (next[key as SectionKey] as string[]).filter((x) =>
      x.trim(),
    );
  }
  if (changes.length === 0) return null;
  return changes.slice(0, 4).join("; ");
}

/* ──────────────────── History modal ──────────────────── */

function HistoryModal({
  versions,
  onClose,
}: {
  versions: any[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<any>(versions[0]);
  const prev = useMemo(
    () =>
      versions.find(
        (x: any) => x.versionNumber === selected.versionNumber - 1,
      ),
    [versions, selected],
  );

  return (
    <div className="fixed inset-0 z-40 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex overflow-hidden">
        <div className="w-[280px] border-r border-brand-100 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-950">
              Version history
            </h3>
            <button
              onClick={onClose}
              className="text-brand-500 hover:text-brand-950 text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="space-y-1">
            {versions.map((v) => (
              <button
                key={v._id}
                onClick={() => setSelected(v)}
                className={`w-full text-left p-2 rounded-lg transition ${
                  selected._id === v._id
                    ? "bg-foresight text-white"
                    : "hover:bg-brand-50"
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  v{v.versionNumber}
                  {v.draftSource === "ai_suggested" && (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span
                    className={`ml-auto text-[9px] uppercase px-1.5 py-0.5 rounded-full ${
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-brand-950">
              v{selected.versionNumber} ·{" "}
              {new Date(selected.draftedAt).toLocaleDateString()}
            </h3>
            <p className="text-xs text-brand-500 mt-1">{selected.rationale}</p>
            <p className="text-xs text-brand-600 mt-1">
              Drafted by {selected.drafter?.name ?? "—"}
              {selected.approver && `, approved by ${selected.approver.name}`}
            </p>
            {prev ? (
              <p className="text-[10px] text-brand-500 mt-2 italic">
                Diff shows changes from v{prev.versionNumber} (
                {new Date(prev.draftedAt).toLocaleDateString()}) → v
                {selected.versionNumber}
              </p>
            ) : (
              <p className="text-[10px] text-brand-500 mt-2 italic">
                Initial version. All items shown as additions.
              </p>
            )}
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
                      <li key={`u${i}`} className="text-brand-800">
                        · {u}
                      </li>
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
