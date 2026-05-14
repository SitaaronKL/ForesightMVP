"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export function ServiceElementsTab({ patientId }: { patientId: Id<"patients"> }) {
  const els = useQuery(api.queries.patients.serviceElementsForMonth, { patientId });
  const patient = useQuery(api.queries.patients.get, { patientId });

  if (!els || !patient) return <div className="glass p-6 text-brand-500">Loading…</div>;

  if (patient.billingProgram !== "apcm") {
    return (
      <div className="glass p-6 text-brand-500 italic text-sm">
        Service elements apply to APCM patients. This patient is on {patient.billingProgram.toUpperCase()} (time-tracked).
      </div>
    );
  }

  const delivered = els.filter((e) => e.status === "delivered").length;
  const total = 11;
  const pct = Math.round((delivered / total) * 100);

  return (
    <div className="space-y-4">
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-brand-950 uppercase tracking-wide">
            APCM service elements
          </h3>
          <span className="text-sm font-mono text-brand-950">
            {delivered} / {total} ({pct}%)
          </span>
        </div>
        <div className="h-2 bg-brand-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-5 space-y-2">
          {els
            .sort((a, b) => a.elementId - b.elementId)
            .map((el) => (
              <div
                key={el._id}
                className="flex items-center justify-between py-2 border-b border-brand-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                      el.status === "delivered"
                        ? "bg-green-ok text-white"
                        : el.status === "available"
                          ? "bg-amber-warning text-white"
                          : "bg-brand-100 text-brand-500"
                    }`}
                  >
                    {el.elementId}
                  </span>
                  <span className="text-sm text-brand-950">{el.elementName}</span>
                </div>
                <span
                  className={`text-xs uppercase tracking-wider ${
                    el.status === "delivered"
                      ? "text-green-700"
                      : el.status === "available"
                        ? "text-amber-700"
                        : "text-brand-400"
                  }`}
                >
                  {el.status.replace("_", " ")}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
