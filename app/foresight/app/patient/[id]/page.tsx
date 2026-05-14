"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { use, useState } from "react";
import { RiskBadge, TierBadge, BillingBadge } from "../../../components/RiskBadge";
import { OverviewTab } from "../../../components/patient/OverviewTab";
import { CarePlanTab } from "../../../components/patient/CarePlanTab";
import { EncountersTab } from "../../../components/patient/EncountersTab";
import { ServiceElementsTab } from "../../../components/patient/ServiceElementsTab";
import { MessagesTab } from "../../../components/patient/MessagesTab";
import { VoiceCaptureButton } from "../../../components/VoiceCaptureButton";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "carePlan", label: "Care Plan" },
  { key: "encounters", label: "Encounters" },
  { key: "serviceElements", label: "Service Elements" },
  { key: "messages", label: "Messages" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const patientId = id as Id<"patients">;
  const [tab, setTab] = useState<TabKey>("overview");

  const overview = useQuery(api.queries.patients.overview, { patientId });

  if (!overview) {
    return (
      <div className="glass p-8 text-center text-brand-500">Loading patient…</div>
    );
  }

  const { patient } = overview;
  const age =
    new Date().getUTCFullYear() -
    parseInt(patient.dateOfBirth.slice(0, 4));

  return (
    <div className="space-y-5">
      {/* Patient header */}
      <div className="glass p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-brand-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-brand-600">
              <span>{age} years old</span>
              <span>·</span>
              <span>{patient.gender}</span>
              <span>·</span>
              <span>{patient.city}, {patient.state}</span>
              <span>·</span>
              <RiskBadge score={patient.riskScore} />
              <TierBadge tier={patient.tier} />
              <BillingBadge program={patient.billingProgram} />
              {patient.dualEligible && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Dual eligible
                </span>
              )}
            </div>
            <p className="text-xs text-brand-500 mt-2">
              Conditions: {patient.chronicConditions.join(", ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <VoiceCaptureButton patientId={patientId} />
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 border-b border-brand-100">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.key
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-brand-500 hover:text-brand-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "overview" && <OverviewTab patientId={patientId} />}
        {tab === "carePlan" && <CarePlanTab patientId={patientId} />}
        {tab === "encounters" && <EncountersTab patientId={patientId} />}
        {tab === "serviceElements" && <ServiceElementsTab patientId={patientId} />}
        {tab === "messages" && <MessagesTab patientId={patientId} />}
      </div>
    </div>
  );
}
