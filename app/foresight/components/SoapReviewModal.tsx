"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Spinner } from "./Spinner";

const SECTIONS = [
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
] as const;

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
  const transcript = useQuery(api.queries.soapNotes.getTranscriptForNote, {
    soapNoteId,
  });

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
  const values: Record<string, [string, (s: string) => void]> = {
    subjective: [subjective, setSubjective],
    objective: [objective, setObjective],
    assessment: [assessment, setAssessment],
    plan: [plan, setPlan],
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-white shadow-2xl rounded-2xl"
      >
        {/* Solid foresight header strip */}
        <div className="bg-foresight px-6 py-5 rounded-t-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              Review SOAP draft
            </DialogTitle>
            <DialogDescription className="text-white/85 text-xs">
              {draft?.draftSource === "ai_from_transcript"
                ? "Drafted from call transcript"
                : "Drafted from notes"}
              {typeof confidence === "number" && (
                <>
                  {" · Confidence "}
                  <span
                    className={`font-mono font-semibold ${
                      confidence >= 85
                        ? "text-green-200"
                        : confidence >= 70
                          ? "text-amber-200"
                          : "text-red-200"
                    }`}
                  >
                    {Math.round(confidence)}%
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!draft && (
            <div className="text-sm text-brand-500 py-8 flex items-center justify-center">
              <Spinner size={18} label="Loading draft…" />
            </div>
          )}

          {draft && (
            <>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setShowTranscript((v) => !v)}
                  className="w-full text-left rounded-xl border border-brand-100 bg-brand-50/40 hover:bg-brand-50 transition overflow-hidden"
                >
                  <div className="px-3.5 py-2.5 flex items-center justify-between text-xs font-medium text-brand-800">
                    <span>
                      Call transcript ·{" "}
                      <span className="text-brand-500">
                        {Math.round(transcript.audioDurationSeconds)}s
                      </span>
                    </span>
                    {showTranscript ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  {showTranscript && (
                    <div className="px-3.5 py-3 text-xs text-brand-700 bg-white max-h-32 overflow-y-auto whitespace-pre-wrap border-t border-brand-100">
                      {transcript.text}
                    </div>
                  )}
                </button>
              )}

              <div className="space-y-4">
                {SECTIONS.map(({ key, label }) => {
                  const [value, setter] = values[key];
                  return (
                    <div key={key}>
                      <Label className="text-[10px] uppercase tracking-wider text-foresight font-semibold">
                        {label}
                      </Label>
                      <textarea
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        rows={3}
                        className="mt-1 w-full px-3 py-2 rounded-xl bg-brand-50/40 border border-brand-100 text-sm text-brand-950 leading-relaxed focus:outline-none focus:bg-white focus:border-foresight transition"
                      />
                    </div>
                  );
                })}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand-100">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-foresight font-semibold">
                      Duration (minutes)
                    </Label>
                    <Input
                      type="number"
                      value={Math.round(duration / 60)}
                      onChange={(e) => setDuration(Number(e.target.value) * 60)}
                      className="mt-1 bg-brand-50/40 border-brand-100 focus:bg-white focus:border-foresight"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-foresight font-semibold">
                      Time log activity
                    </Label>
                    <Input
                      type="text"
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                      className="mt-1 bg-brand-50/40 border-brand-100 focus:bg-white focus:border-foresight"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-warning bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-full text-brand-700 hover:bg-brand-50"
                >
                  Discard
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={signing}
                  className="rounded-full bg-foresight hover:bg-foresight-dark text-white px-5"
                >
                  {signing ? "Signing…" : "Sign and save"}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
