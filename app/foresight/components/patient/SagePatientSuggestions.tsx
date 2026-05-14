"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useRef, useState } from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useSageSend } from "../SageRuntime";
import { useAgentRail } from "../AgentRailContext";
import { AmbulanceIcon, type AmbulanceIconHandle } from "../AmbulanceIcon";
import { HelpHint } from "../HelpHint";

type Suggestion = {
  key: string;
  label: string;
  prompt: string;
  rationale: string;
};

export function SagePatientSuggestions({
  patientId,
  patientName,
}: {
  patientId: Id<"patients">;
  patientName: string;
}) {
  const overview = useQuery(api.queries.patients.overview, { patientId });
  const discharge = useQuery(api.queries.patients.recentDischarge, {
    patientId,
  });
  const sendToSage = useSageSend();
  const rail = useAgentRail();
  const ambulanceRef = useRef<AmbulanceIconHandle>(null);
  const [sending, setSending] = useState<string | null>(null);

  if (!overview) return null;

  const firstName = patientName.split(" ")[0];
  const recent = overview.recentEncounters ?? [];
  const conditionList = overview.patient.chronicConditions.join(", ");

  const suggestions: Suggestion[] = [];

  if (discharge) {
    suggestions.push({
      key: "toc",
      label: "Draft TOC follow-up plan",
      prompt: `Draft a transition-of-care follow-up plan for ${patientName}. They were discharged from ${discharge.facility} on ${new Date(discharge.eventDate).toLocaleDateString()}${discharge.reason ? " for " + discharge.reason : ""}. Include the assessment, red-flag symptoms to monitor, medication reconciliation cadence, and a suggested 7-day follow-up call agenda.`,
      rationale: "Closes the 7-day TOC window and feeds service element #7.",
    });
  }

  suggestions.push({
    key: "refill",
    label: "Draft refill message",
    prompt: `Draft a portal message I can send to ${patientName} asking which prescriptions they need refilled this month. Keep it warm but specific. List the chronic conditions on file so I can reference them: ${conditionList}.`,
    rationale: "Pre-empts the next refill batch and saves a chart-review pass.",
  });

  if (recent.length >= 2) {
    suggestions.push({
      key: "summarize",
      label: `Summarize last ${Math.min(recent.length, 3)} touches`,
      prompt: `Summarize the last ${Math.min(recent.length, 3)} encounters with ${patientName}. Pull out what changed, what's open, and what I should ask about on the next call.`,
      rationale: "Cuts pre-call chart review down to one paragraph.",
    });
  }

  suggestions.push({
    key: "careplan",
    label: "Suggest care plan revision",
    prompt: `Review the current care plan for ${patientName} against the recent encounters and any hospital events. Propose a care plan revision as a diff (sections to add, modify, remove) with rationale. Do not apply changes, just draft.`,
    rationale: "Drops a pending v(N+1) you can review and approve in one click.",
  });

  if (
    overview.patient.chronicConditions.some((c: string) =>
      /diabetes|hba1c/i.test(c),
    )
  ) {
    suggestions.push({
      key: "a1c",
      label: "A1c lab follow-up",
      prompt: `Draft an A1c lab follow-up plan for ${patientName} including: target value, what to do if the result is above/below target, talking points for the next call, and a 10-day check-in cadence.`,
      rationale: "Locks in the diabetes management loop for the month.",
    });
  }

  async function fire(s: Suggestion) {
    if (!sendToSage || sending) return;
    setSending(s.key);
    try {
      rail.setCollapsed(false);
      await sendToSage(s.prompt);
    } finally {
      setSending(null);
    }
  }

  return (
    <div
      className="rounded-2xl border border-foresight/15 bg-gradient-to-br from-foresight/4 to-white px-5 py-4"
      onMouseEnter={() => ambulanceRef.current?.startAnimation()}
      onMouseLeave={() => ambulanceRef.current?.stopAnimation()}
    >
      <div className="flex items-center gap-2 mb-3">
        <AmbulanceIcon
          ref={ambulanceRef}
          size={16}
          className="flex items-center text-foresight"
        />
        <h3 className="text-xs uppercase tracking-wider font-semibold text-foresight">
          Sage suggests for {firstName}
        </h3>
        <HelpHint width={300}>
          Context-aware drafts Sage can prepare for this patient. Click to
          send the prompt into the agent rail; Sage will return an action
          card you can review and apply with one click.
        </HelpHint>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((s) => (
          <button
            key={s.key}
            onClick={() => fire(s)}
            disabled={sending !== null}
            className="group text-left rounded-xl border border-brand-100 bg-white hover:border-foresight/40 hover:shadow-sm px-3 py-2.5 transition disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-foresight flex-shrink-0" />
              <span className="text-sm font-medium text-brand-950 truncate">
                {s.label}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-brand-400 ml-auto group-hover:text-foresight transition flex-shrink-0" />
            </div>
            <p className="text-[11px] text-brand-500 mt-1 line-clamp-2">
              {s.rationale}
            </p>
            {sending === s.key && (
              <div className="text-[10px] uppercase tracking-wider text-foresight mt-1">
                Sending to Sage…
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
