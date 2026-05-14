"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { AlertCircle } from "lucide-react";
import { HelpHint } from "../HelpHint";

const TOC_WINDOW_DAYS = 7;

export function HospitalEventBanner({
  patientId,
  onCompleteTOC,
}: {
  patientId: Id<"patients">;
  onCompleteTOC?: () => void;
}) {
  const discharge = useQuery(api.queries.patients.recentDischarge, {
    patientId,
  });
  if (!discharge) return null;

  const dischargeDate = new Date(discharge.eventDate);
  const deadline = discharge.eventDate + TOC_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = deadline - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  const overdue = msLeft <= 0;

  const tone = overdue
    ? {
        wrap: "from-red-warning/15 to-red-warning/5 border-red-warning/40",
        icon: "text-red-warning",
        chip: "bg-red-warning text-white",
        chipText: "Overdue",
      }
    : daysLeft <= 2
      ? {
          wrap: "from-amber-warning/15 to-amber-warning/5 border-amber-warning/40",
          icon: "text-amber-700",
          chip: "bg-amber-warning text-white",
          chipText: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
        }
      : {
          wrap: "from-foresight/12 to-foresight/3 border-foresight/30",
          icon: "text-foresight",
          chip: "bg-foresight text-white",
          chipText: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
        };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-r ${tone.wrap} px-5 py-4 flex items-start gap-4`}
    >
      <AlertCircle className={`w-5 h-5 ${tone.icon} flex-shrink-0 mt-0.5`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-brand-950">
            Recent hospital discharge
          </h3>
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${tone.chip}`}
          >
            TOC · {tone.chipText}
          </span>
          <HelpHint width={280}>
            <span>
              Transition-of-care follow-up. APCM and CCM both require a
              clinician touch within {TOC_WINDOW_DAYS} days of discharge to
              prevent readmission and satisfy service element #7.
            </span>
          </HelpHint>
        </div>
        <p className="text-sm text-brand-800 mt-1 leading-relaxed">
          Discharged {dischargeDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}{" "}
          from{" "}
          <span className="font-medium">{discharge.facility}</span>
          {discharge.reason && (
            <span className="text-brand-600"> · {discharge.reason}</span>
          )}
          .
        </p>
        <p className="text-xs text-brand-600 mt-1">
          {overdue
            ? "TOC follow-up window closed. Document the touch immediately to preserve the claim."
            : `Window closes ${new Date(deadline).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}.`}
        </p>
      </div>
      {onCompleteTOC && (
        <button
          onClick={onCompleteTOC}
          className="flex-shrink-0 text-xs font-medium rounded-full px-3 py-1.5 bg-foresight hover:bg-foresight-dark text-white transition shadow-sm"
        >
          Complete TOC follow-up
        </button>
      )}
    </div>
  );
}
