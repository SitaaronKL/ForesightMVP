"use client";

import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { SoapReviewModal } from "./SoapReviewModal";

export function VoiceCaptureButton({ patientId }: { patientId: Id<"patients"> }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soapNoteId, setSoapNoteId] = useState<Id<"soapNotes"> | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    } catch (err) {
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
      // 1. Get upload URL
      const uploadUrl = await generateUploadUrl({});
      // 2. Upload
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: audioBlob,
      });
      const { storageId } = await uploadRes.json();

      // 3. Create encounter
      const encounterId = await createEncounter({ patientId, durationSeconds });

      // 4. Transcribe
      const { transcriptId } = await transcribeAudio({
        storageId,
        patientId,
        encounterId,
        audioDurationSeconds: durationSeconds,
      });

      // 5. Draft SOAP
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

  return (
    <>
      {!recording && !processing && (
        <button
          onClick={startRecording}
          className="px-4 py-2 rounded-lg bg-brand-900 text-white text-sm font-medium hover:bg-brand-800 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-red-warning" /> Record call
        </button>
      )}
      {recording && (
        <button
          onClick={stopAndProcess}
          className="px-4 py-2 rounded-lg bg-red-warning text-white text-sm font-medium hover:bg-red-700 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-white pulse-dot" /> Stop ({elapsed}s)
        </button>
      )}
      {processing && (
        <div className="px-4 py-2 rounded-lg bg-brand-100 text-brand-700 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 pulse-dot" /> Transcribing + drafting…
        </div>
      )}
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
