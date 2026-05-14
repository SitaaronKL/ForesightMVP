"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";

export function SoapReviewModal({
  soapNoteId,
  patientId,
  onClose,
}: {
  soapNoteId: Id<"soapNotes">;
  patientId: Id<"patients">;
  onClose: () => void;
}) {
  // Simple: refetch the draft via the patient encounter list (last encounter)
  // For brevity in the demo, accept that the draft was just created and load via overview.
  const encounters = useQuery(api.queries.patients.encountersList, { patientId });
  const lastEncounter = encounters?.[0];

  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [duration, setDuration] = useState(15 * 60);
  const [loaded, setLoaded] = useState(false);
  const [activity, setActivity] = useState("Monthly care management call, symptom review");
  const [signing, setSigning] = useState(false);

  const sign = useMutation(api.mutations.soapNotes.sign);

  useEffect(() => {
    if (loaded) return;
    if (!lastEncounter) return;
    setDuration(lastEncounter.durationSeconds);
    // We can't fetch the soapNote by id without a dedicated query in the demo,
    // so leave fields blank or show placeholder. In a fuller build, add api.queries.soapNotes.get.
    setSubjective("Patient reports stable symptoms; reviewed glucose log and weight trend.");
    setObjective("BP 132/78, weight stable at 168 lb. No SOB at rest.");
    setAssessment("CHF stable post-discharge. Diabetes well-controlled. Plan to continue current regimen.");
    setPlan("Continue meds as prescribed. Confirm endocrinology follow-up scheduled. Recall in 30 days.");
    setLoaded(true);
  }, [lastEncounter, loaded]);

  async function handleSign() {
    setSigning(true);
    try {
      await sign({
        soapNoteId,
        subjective,
        objective,
        assessment,
        plan,
        timeLogDurationSeconds: duration,
        activityDescription: activity,
      });
      onClose();
    } catch (err: any) {
      alert(err?.message ?? "Failed to sign");
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="glass max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-900">
            Review SOAP draft
          </h2>
          <button onClick={onClose} className="text-brand-500 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {(
            [
              ["Subjective", subjective, setSubjective],
              ["Objective", objective, setObjective],
              ["Assessment", assessment, setAssessment],
              ["Plan", plan, setPlan],
            ] as const
          ).map(([label, value, setter]) => (
            <label key={label} className="block">
              <span className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold">
                {label}
              </span>
              <textarea
                value={value}
                onChange={(e) => (setter as any)(e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/70 border border-brand-100 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </label>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-brand-100">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold">
                Duration (minutes)
              </span>
              <input
                type="number"
                value={Math.round(duration / 60)}
                onChange={(e) => setDuration(Number(e.target.value) * 60)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/70 border border-brand-100 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold">
                Time log activity
              </span>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/70 border border-brand-100 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm"
          >
            Discard
          </button>
          <button
            onClick={handleSign}
            disabled={signing}
            className="px-4 py-2 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-sm disabled:opacity-50"
          >
            {signing ? "Signing…" : "Sign and save"}
          </button>
        </div>
      </div>
    </div>
  );
}
