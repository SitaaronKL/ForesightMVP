"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export function OverviewTab({ patientId }: { patientId: Id<"patients"> }) {
  const overview = useQuery(api.queries.patients.overview, { patientId });
  if (!overview) return null;

  const fmt = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Current care plan summary">
        {overview.currentVersion ? (
          <div className="space-y-2 text-sm text-brand-800">
            <div>
              <strong className="text-brand-600 text-xs uppercase">Treatment goals</strong>
              <ul className="mt-1 list-disc list-inside text-sm">
                {(overview.currentVersion.content.treatmentGoals as string[]).map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong className="text-brand-600 text-xs uppercase">Medications</strong>
              <ul className="mt-1 list-disc list-inside text-sm">
                {(overview.currentVersion.content.medicationManagement as string[]).map(
                  (m, i) => (
                    <li key={i}>{m}</li>
                  ),
                )}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-brand-500 text-sm italic">No care plan yet.</div>
        )}
      </Card>

      <Card title="Recent encounters">
        {overview.recentEncounters.length === 0 ? (
          <div className="text-brand-500 text-sm italic">No encounters yet.</div>
        ) : (
          <ul className="space-y-2">
            {overview.recentEncounters.slice(0, 6).map((e: any) => (
              <li
                key={e._id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-brand-50 last:border-0"
              >
                <div>
                  <div className="font-medium text-brand-900">{fmt(e.startedAt)}</div>
                  <div className="text-xs text-brand-500 capitalize">
                    {e.type.replace("_", " ")} · {Math.round(e.durationSeconds / 60)} min · {e.status}
                  </div>
                </div>
                <span className="text-xs text-brand-600">
                  {(e.topicTags ?? []).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Hospital events (last 90 days)">
        {overview.recentHospitalEvents.length === 0 ? (
          <div className="text-brand-500 text-sm italic">No recent hospital events.</div>
        ) : (
          <ul className="space-y-2">
            {overview.recentHospitalEvents.map((h: any) => (
              <li key={h._id} className="text-sm border-b border-brand-50 last:border-0 py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                      h.eventType === "admission"
                        ? "bg-red-50 text-red-warning"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {h.eventType}
                  </span>
                  <span className="font-medium text-brand-900">{fmt(h.eventDate)}</span>
                  <span className="text-xs text-brand-500">{h.facility}</span>
                </div>
                {h.reason && (
                  <div className="text-xs text-brand-600 mt-0.5 ml-12">{h.reason}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Risk profile">
        <div className="text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-brand-500">Risk score</span>
            <span className="font-mono text-brand-900 font-semibold">
              {Math.round(overview.patient.riskScore)} / 100
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-500">Tier</span>
            <span className="font-medium text-brand-900 capitalize">
              {overview.patient.tier.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-500">Billing program</span>
            <span className="font-medium text-brand-900 uppercase">
              {overview.patient.billingProgram}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-500">Last touch</span>
            <span className="text-brand-900">
              {overview.patient.lastTouchedAt
                ? fmt(overview.patient.lastTouchedAt)
                : "—"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-5">
      <h3 className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
