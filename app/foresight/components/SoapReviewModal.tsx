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
  const draft = useQuery(api.queries.soapNotes.get, { soapNoteId });
  const transcript = useQuery(api.queries.soapNotes.getTranscriptForNote, { soapNoteId });

  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [duration, setDuration] = useState(15 * 60);
  const [activity, setActivity] = useState("Monthly care management call");
  const [showTranscript, setShowTranscript] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sign = useMutation(api.mutations.soapNotes.sign);

  // Seed inputs from the real draft when it arrives
  useEffect(() => {
    if (!draft || loaded) return;
    setSubjective(draft.subjective ?? "");
    setObjective(draft.objective ?? "");
    setAssessment(draft.assessment ?? "");
    setPlan(draft.plan ?? "");
    setLoaded(true);
  }, [draft, loaded]);

  async function handleSign() {
    setError(null);
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
      setError(err?.message ?? "Failed to sign");
    } finally {
      setSigning(false);
    }
  }

  const confidence = draft?.aiConfidenceScore;

  return (
    <div className="fixed inset-0 z-40 bg-brand-950/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="glass max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Review SOAP draft</h2>
            <p className="text-xs text-brand-500 mt-0.5">
              {draft?.draftSource === "ai_from_transcript" ? "Drafted from call transcript" : "Drafted from notes"}
              {typeof confidence === "number" && (
                <>
                  {" "}· Confidence{" "}
                  <span
                    className={`font-mono ${
                      confidence >= 85
                        ? "text-green-700"
                        : confidence >= 70
                          ? "text-amber-700"
                          : "text-red-warning"
                    }`}
                  >
                    {Math.round(confidence)}%
                  </span>
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-brand-500 text-2xl leading-none hover:text-brand-900">
            ×
          </button>
        </div>

        {!draft && (
          <div className="text-sm text-brand-500 italic py-8 text-center">
            Loading draft…
          </div>
        )}

        {draft && (
          <>
            {transcript && (
              <div className="mb-4 mt-3 border border-brand-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowTranscript((v) => !v)}
                  className="w-full px-3 py-2 bg-brand-50/60 text-left text-xs font-medium text-brand-700 flex items-center justify-between hover:bg-brand-50"
                >
                  <span>Call transcript ({Math.round(transcript.audioDurationSeconds)}s)</span>
                  <span>{showTranscript ? "−" : "+"}</span>
                </button>
                {showTranscript && (
                  <div className="px-3 py-2 text-xs text-brand-700 bg-white/50 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {transcript.text}
                  </div>
                )}
              </div>
            )}

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

            {error && (
              <div className="mt-4 text-xs text-red-warning bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

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
          </>
        )}
      </div>
    </div>
  );
}
