"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { EncounterDetailModal } from "./EncounterDetailModal";
import { HelpHint } from "../HelpHint";

type EvidenceKind =
  | "encounter"
  | "care_plan_version"
  | "hospital_event"
  | "portal_message"
  | "consent"
  | "practice";

interface EvidenceRow {
  kind: EvidenceKind;
  refId: string;
  label: string;
  sublabel?: string;
  timestamp?: number;
  route?: string;
}

const ELEMENT_TOOLTIPS: Record<number, string> = {
  1: "One-time patient consent to participate in the program. CMS requires it be on file and signed.",
  2: "Initiating face-to-face visit. APCM accepts a visit within the past 3 years; CCM is the past 12 months.",
  3: "Single comprehensive care plan covering problem list, treatment goals, medications, and review schedule.",
  4: "Patient can reach a clinician 24/7 for urgent concerns. Usually a covering on-call line.",
  5: "Patient has a named primary nurse or PCP. APCM audits this as the 'designated care team member.'",
  6: "Ongoing assessment, oversight, and coordination across all of the patient's chronic conditions.",
  7: "Follow-up within 7-14 days of a hospital discharge to prevent readmission.",
  8: "Linking the patient to home health, transportation, meals, social work, or community programs.",
  9: "Asynchronous (portal, SMS) and synchronous (phone, video) communication channels available.",
  10: "Patient is part of the practice's panel-level cohort tracking (risk, gaps, outcomes).",
  11: "Practice reports quality measures (reach rate, TOC closure, readmissions) for accountability.",
};

export function ServiceElementsTab({
  patientId,
}: {
  patientId: Id<"patients">;
}) {
  const els = useQuery(api.queries.patients.serviceElementsWithEvidence, {
    patientId,
  });
  const patient = useQuery(api.queries.patients.get, { patientId });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [encounterId, setEncounterId] = useState<Id<"encounters"> | null>(null);

  if (!els || !patient)
    return <div className="glass p-6 text-brand-500">Loading…</div>;

  if (patient.billingProgram !== "apcm") {
    return (
      <div className="glass p-6 text-brand-500 italic text-sm">
        Service elements apply to APCM patients. This patient is on{" "}
        {patient.billingProgram.toUpperCase()} (time-tracked).
      </div>
    );
  }

  const delivered = els.filter((e) => e.status === "delivered").length;
  const total = 11;
  const pct = Math.round((delivered / total) * 100);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-2xl border border-brand-100 bg-white overflow-hidden">
          {/* Header with progress meter */}
          <header
            className="px-6 pt-5 pb-5"
            style={{
              backgroundImage: "url(/image-mesh-gradient.png)",
              backgroundSize: "200% 200%",
              backgroundPosition: "0% 50%",
            }}
          >
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-brand-950">
                    APCM Service Elements
                  </h3>
                  <HelpHint width={280}>
                    The 11 service capabilities a practice must deliver to bill
                    APCM. Click any row to see the evidence backing it for this
                    month, auto-resolved from encounters, care plans, hospital
                    events, and portal messages.
                  </HelpHint>
                </div>
                <p className="mt-0.5 text-xs text-brand-950/80">
                  {delivered === total
                    ? "All 11 elements delivered for this month. Audit-ready."
                    : `${total - delivered} element${total - delivered === 1 ? "" : "s"} still pending evidence for the current month.`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-semibold text-brand-950 leading-none">
                  {delivered}
                  <span className="text-brand-950/60 text-lg">/{total}</span>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-brand-950/70 mt-1">
                  {pct}% complete
                </div>
              </div>
            </div>
            <div className="h-2 bg-white/40 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-foresight-dark transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </header>

          {/* Element list */}
          <div className="p-2 space-y-0.5">
            {els.map((el) => {
              const isOpen = expanded.has(el._id);
              const evCount = el.inferredEvidence?.length ?? 0;
              const statusText =
                el.status === "delivered"
                  ? "text-green-700"
                  : el.status === "available"
                    ? "text-amber-700"
                    : "text-brand-400";
              const statusLabel =
                el.status === "delivered"
                  ? "Delivered"
                  : el.status === "available"
                    ? "Available"
                    : "Pending";
              return (
                <div key={el._id}>
                  <button
                    onClick={() => toggle(el._id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-foresight/5 transition-colors text-left"
                  >
                    <span className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-xs font-semibold text-foresight flex-shrink-0">
                      {el.elementId}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-brand-950 truncate">
                          {el.elementName}
                        </span>
                        <HelpHint width={260}>
                          {ELEMENT_TOOLTIPS[el.elementId] ??
                            "APCM service element."}
                        </HelpHint>
                      </div>
                      <div className="text-[11px] text-brand-500 mt-0.5">
                        {evCount === 0
                          ? "No evidence yet this month"
                          : `${evCount} evidence item${evCount === 1 ? "" : "s"} on file`}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold ${statusText}`}
                    >
                      {el.status === "delivered" && (
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      )}
                      {el.status === "available" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                      {statusLabel}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-brand-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="pl-12 pr-3 pb-2 pt-1">
                      {evCount === 0 ? (
                        <p className="text-xs text-brand-500 italic py-2">
                          No evidence on file for the current month. Document an
                          encounter, send a portal message, or mark this
                          element delivered manually from the quick actions
                          row.
                        </p>
                      ) : (
                        <div className="space-y-0.5">
                          {el.inferredEvidence.map((ev, i) => (
                            <EvidenceItem
                              key={`${el._id}-${i}`}
                              evidence={ev}
                              onOpenEncounter={(id) =>
                                setEncounterId(id as Id<"encounters">)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EncounterDetailModal
        encounterId={encounterId}
        onClose={() => setEncounterId(null)}
      />
    </>
  );
}

const KIND_LABEL: Record<EvidenceKind, string> = {
  encounter: "Encounter",
  care_plan_version: "Care plan",
  hospital_event: "Hospital",
  portal_message: "Message",
  consent: "Consent",
  practice: "Practice",
};

function EvidenceItem({
  evidence,
  onOpenEncounter,
}: {
  evidence: EvidenceRow;
  onOpenEncounter: (id: string) => void;
}) {
  const clickable = evidence.kind === "encounter";
  const dateLabel = evidence.timestamp
    ? new Date(evidence.timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  if (clickable) {
    return (
      <button
        onClick={() => onOpenEncounter(evidence.refId)}
        className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:shadow-sm text-left"
        style={{
          backgroundImage: "url(/image-mesh-gradient.png)",
          backgroundSize: "200% 200%",
          backgroundPosition: "0% 50%",
        }}
      >
        <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-950 flex-shrink-0 w-20">
          {KIND_LABEL[evidence.kind]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-brand-950 truncate font-medium">
            {evidence.label}
          </div>
          {evidence.sublabel && (
            <div className="text-[11px] text-brand-950/70 truncate mt-0.5">
              {evidence.sublabel}
            </div>
          )}
        </div>
        {dateLabel && (
          <span className="text-[11px] text-brand-950/80 flex-shrink-0">
            {dateLabel}
          </span>
        )}
      </button>
    );
  }
  return (
    <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-foresight/5">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-foresight flex-shrink-0 w-20">
        {KIND_LABEL[evidence.kind]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-brand-950 truncate">{evidence.label}</div>
        {evidence.sublabel && (
          <div className="text-[11px] text-brand-500 truncate mt-0.5">
            {evidence.sublabel}
          </div>
        )}
      </div>
      {dateLabel && (
        <span className="text-[11px] text-brand-500 flex-shrink-0">
          {dateLabel}
        </span>
      )}
    </div>
  );
}
