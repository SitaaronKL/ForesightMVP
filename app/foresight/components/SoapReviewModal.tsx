"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass border-white/60">
        <DialogHeader>
          <DialogTitle className="text-brand-950">Review SOAP draft</DialogTitle>
          <DialogDescription className="text-brand-500">
            {draft?.draftSource === "ai_from_transcript"
              ? "Drafted from call transcript"
              : "Drafted from notes"}
            {typeof confidence === "number" && (
              <>
                {" · Confidence "}
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
          </DialogDescription>
        </DialogHeader>

        {!draft && (
          <div className="text-sm text-brand-500 italic py-8 text-center">
            Loading draft…
          </div>
        )}

        {draft && (
          <>
            {transcript && (
              <div className="border border-brand-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTranscript((v) => !v)}
                  className="w-full px-3 py-2 bg-brand-50/60 text-left text-xs font-medium text-brand-700 flex items-center justify-between hover:bg-brand-50"
                >
                  <span>Call transcript ({Math.round(transcript.audioDurationSeconds)}s)</span>
                  {showTranscript ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
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
                <div key={label}>
                  <Label className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold">
                    {label}
                  </Label>
                  <textarea
                    value={value}
                    onChange={(e) => (setter as any)(e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-white/70 border border-brand-100 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  />
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-brand-100">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold">
                    Duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    value={Math.round(duration / 60)}
                    onChange={(e) => setDuration(Number(e.target.value) * 60)}
                    className="mt-1 bg-white/70"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-brand-500 font-semibold">
                    Time log activity
                  </Label>
                  <Input
                    type="text"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="mt-1 bg-white/70"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-warning bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                Discard
              </Button>
              <Button onClick={handleSign} disabled={signing}>
                {signing ? "Signing…" : "Sign and save"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
