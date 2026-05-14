"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { use, useState } from "react";
import { Mars, Venus, CircleUser } from "lucide-react";
import { BillingBadge } from "../../../components/RiskBadge";
import { RiskTierBadge } from "../../../components/RiskTierBadge";
import { Spinner } from "../../../components/Spinner";
import { BackToPanelButton } from "../../../components/BackToPanelButton";
import { OverviewTab } from "../../../components/patient/OverviewTab";
import { CarePlanTab } from "../../../components/patient/CarePlanTab";
import { EncountersTab } from "../../../components/patient/EncountersTab";
import { ServiceElementsTab } from "../../../components/patient/ServiceElementsTab";
import { MessagesTab } from "../../../components/patient/MessagesTab";
import { VoiceCaptureButton } from "../../../components/VoiceCaptureButton";
import { PatientTabs, type PatientTabKey } from "../../../components/patient/PatientTabs";

export default function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const patientId = id as Id<"patients">;
  const [tab, setTab] = useState<PatientTabKey>("overview");

  const overview = useQuery(api.queries.patients.overview, { patientId });

  if (!overview) {
    return (
      <div className="glass p-8 text-center text-brand-500 flex items-center justify-center">
        <Spinner size={20} label="Loading patient…" />
      </div>
    );
  }

  const { patient } = overview;
  const age =
    new Date().getUTCFullYear() -
    parseInt(patient.dateOfBirth.slice(0, 4));

  return (
    <div className="space-y-5">
      {/* Back to panel */}
      <div>
        <BackToPanelButton />
      </div>

      {/* Patient header */}
      <div className="glass p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-brand-950">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-brand-600">
              <span>{age} years old</span>
              <span>·</span>
              <GenderLabel value={patient.gender} />
              <span>·</span>
              <span>{patient.city}, {patient.state}</span>
              <span>·</span>
              <RiskTierBadge score={patient.riskScore} tier={patient.tier} />
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceCaptureButton patientId={patientId} />
          </div>
        </div>
      </div>

      {/* Big-pill segmented control with draggable mini-pill indicator */}
      <PatientTabs value={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === "overview" && <OverviewTab patientId={patientId} />}
        {tab === "carePlan" && <CarePlanTab patientId={patientId} />}
        {tab === "encounters" && <EncountersTab patientId={patientId} />}
        {tab === "serviceElements" && <ServiceElementsTab patientId={patientId} />}
        {tab === "messages" && <MessagesTab patientId={patientId} />}
      </div>
    </div>
  );
}

function GenderLabel({ value }: { value: string | undefined | null }) {
  const v = (value ?? "").trim().toLowerCase();
  const isMale = v === "m" || v === "male";
  const isFemale = v === "f" || v === "female";
  const Icon = isMale ? Mars : isFemale ? Venus : CircleUser;
  const label = isMale ? "Male" : isFemale ? "Female" : value ?? "Unknown";
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="w-3.5 h-3.5" aria-hidden />
      {label}
    </span>
  );
}
