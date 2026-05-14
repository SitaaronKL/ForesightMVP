"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RiskBadge, TierBadge, BillingBadge } from "../../../components/RiskBadge";
import { OverviewTab } from "../../../components/patient/OverviewTab";
import { CarePlanTab } from "../../../components/patient/CarePlanTab";
import { EncountersTab } from "../../../components/patient/EncountersTab";
import { ServiceElementsTab } from "../../../components/patient/ServiceElementsTab";
import { MessagesTab } from "../../../components/patient/MessagesTab";
import { VoiceCaptureButton } from "../../../components/VoiceCaptureButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const patientId = id as Id<"patients">;

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
      {/* Back to dashboard */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to panel
        </Link>
      </div>

      {/* Patient header */}
      <div className="glass p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <VoiceCaptureButton patientId={patientId} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/60 border border-brand-100 p-1 h-auto">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-brand-900 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="carePlan" className="text-xs data-[state=active]:bg-brand-900 data-[state=active]:text-white">
            Care Plan
          </TabsTrigger>
          <TabsTrigger value="encounters" className="text-xs data-[state=active]:bg-brand-900 data-[state=active]:text-white">
            Encounters
          </TabsTrigger>
          <TabsTrigger value="serviceElements" className="text-xs data-[state=active]:bg-brand-900 data-[state=active]:text-white">
            Service Elements
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs data-[state=active]:bg-brand-900 data-[state=active]:text-white">
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab patientId={patientId} />
        </TabsContent>
        <TabsContent value="carePlan" className="mt-4">
          <CarePlanTab patientId={patientId} />
        </TabsContent>
        <TabsContent value="encounters" className="mt-4">
          <EncountersTab patientId={patientId} />
        </TabsContent>
        <TabsContent value="serviceElements" className="mt-4">
          <ServiceElementsTab patientId={patientId} />
        </TabsContent>
        <TabsContent value="messages" className="mt-4">
          <MessagesTab patientId={patientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
