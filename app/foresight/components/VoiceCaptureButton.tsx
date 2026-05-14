"use client";

import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { SoapReviewModal } from "./SoapReviewModal";
import { Square, Loader2 } from "lucide-react";
import { MicIcon, type MicIconHandle } from "./MicIcon";
import { PhoneCallIcon, type PhoneCallIconHandle } from "./PhoneCallIcon";
import { useAgentRail } from "./AgentRailContext";

export function VoiceCaptureButton({ patientId }: { patientId: Id<"patients"> }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soapNoteId, setSoapNoteId] = useState<Id<"soapNotes"> | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const micRef = useRef<MicIconHandle>(null);
  const phoneRef = useRef<PhoneCallIconHandle>(null);

  const { collapsed: railCollapsed } = useAgentRail();

  const generateUploadUrl = useMutation(api.agent.upload.generateUploadUrl);
  const createEncounter = useMutation(api.agent.createEncounterForCall.createForCall);
  const transcribeAudio = useAction(api.agent.whisper.transcribeAudio);
  const draftSoap = useAction(api.agent.whisper.draftSoapFromTranscript);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 1000);
    } catch {
      alert("Microphone access denied or unavailable.");
    }
  }

  async function stopAndProcess() {
    if (!mediaRecorderRef.current) return;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    await new Promise<void>((resolve) => {
      const r = mediaRecorderRef.current!;
      r.onstop = () => resolve();
      r.stop();
    });

    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    const durationSeconds = Math.max(
      1,
      Math.floor((Date.now() - startedAtRef.current) / 1000),
    );

    setProcessing(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: audioBlob,
      });
      const { storageId } = await uploadRes.json();
      const encounterId = await createEncounter({ patientId, durationSeconds });
      const { transcriptId } = await transcribeAudio({
        storageId,
        patientId,
        encounterId,
        audioDurationSeconds: durationSeconds,
      });
      const { soapNoteId } = await draftSoap({
        transcriptId,
        patientId,
        encounterId,
      });
      setSoapNoteId(soapNoteId);
    } catch (err: any) {
      console.error(err);
      alert(`Failed: ${err?.message ?? "unknown error"}`);
    } finally {
      setProcessing(false);
      setElapsed(0);
    }
  }

  function handleCall() {
    alert(
      "Outbound calling is wired for a future release (Twilio).\n\n" +
        "For now use Record call to capture an existing nurse-patient call and have Sage draft the SOAP.",
    );
  }

  // When the rail is open the patient header is cramped, stack the buttons.
  // When the rail is collapsed there's room, lay them out side-by-side.
  const orientation: "row" | "col" = "row";
  void railCollapsed;

  return (
    <>
      <div
        className={`flex gap-2 ${
          orientation === "row" ? "flex-row" : "flex-col"
        }`}
      >
        {!recording && !processing && (
          <button
            onClick={handleCall}
            onMouseEnter={() => phoneRef.current?.startAnimation()}
            onMouseLeave={() => phoneRef.current?.stopAnimation()}
            className="inline-flex items-center gap-2 rounded-[100px] bg-white/70 backdrop-blur-md border border-brand-200 text-brand-950 px-5 py-2 text-sm font-medium hover:bg-white transition shadow-sm"
          >
            <PhoneCallIcon ref={phoneRef} size={16} className="flex items-center" />
            Call
          </button>
        )}

        {!recording && !processing && (
          <button
            onClick={startRecording}
            onMouseEnter={() => micRef.current?.startAnimation()}
            onMouseLeave={() => micRef.current?.stopAnimation()}
            className="inline-flex items-center gap-2 rounded-[100px] bg-brand-900 text-white px-5 py-2 text-sm font-medium hover:bg-brand-800 transition shadow-sm"
          >
            <MicIcon ref={micRef} size={16} className="flex items-center" />
            Record call
          </button>
        )}

        {recording && (
          <button
            onClick={stopAndProcess}
            className="inline-flex items-center gap-2 rounded-[100px] bg-red-warning text-white px-5 py-2 text-sm font-medium hover:bg-red-700 transition shadow-sm"
          >
            <Square className="w-3 h-3 fill-current" /> Stop ({elapsed}s)
          </button>
        )}

        {processing && (
          <div className="inline-flex items-center gap-2 rounded-[100px] bg-brand-100 text-brand-700 px-5 py-2 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcribing…
          </div>
        )}
      </div>

      {soapNoteId && (
        <SoapReviewModal
          soapNoteId={soapNoteId}
          patientId={patientId}
          onClose={() => setSoapNoteId(null)}
        />
      )}
    </>
  );
}
