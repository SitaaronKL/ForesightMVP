"use client";

import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { SoapReviewModal } from "./SoapReviewModal";
import { Square } from "lucide-react";
import { PhoneCallIcon, type PhoneCallIconHandle } from "./PhoneCallIcon";
import { MicIcon, type MicIconHandle } from "./MicIcon";
import { MicOffIcon, type MicOffIconHandle } from "./MicOffIcon";
import { GlassTooltip } from "./GlassTooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgentRail } from "./AgentRailContext";
import { Spinner } from "./Spinner";

export function VoiceCaptureButton({ patientId }: { patientId: Id<"patients"> }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [soapNoteId, setSoapNoteId] = useState<Id<"soapNotes"> | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const phoneRef = useRef<PhoneCallIconHandle>(null);
  const micItemRef = useRef<MicIconHandle>(null);
  const micOffItemRef = useRef<MicOffIconHandle>(null);

  function handleCallWithoutRecording() {
    alert(
      "Outbound calling without recording is wired for a future release (Twilio).\n\n" +
        "For now use 'Record' to capture an existing nurse-patient call and have Sage draft the SOAP.",
    );
  }

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

  void railCollapsed;

  return (
    <>
      {!recording && !processing && (
        <DropdownMenu>
          <GlassTooltip
            width={260}
            content="Start a call. Pick 'Record' to capture audio so Sage can transcribe via Whisper and draft a SOAP note when you finish."
          >
            <DropdownMenuTrigger asChild>
              <button
                onMouseEnter={() => phoneRef.current?.startAnimation()}
                onMouseLeave={() => phoneRef.current?.stopAnimation()}
                className="inline-flex items-center gap-2 rounded-[100px] bg-foresight text-white px-5 py-2 text-sm font-medium hover:bg-foresight-dark transition shadow-sm flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-foresight/40"
              >
                <PhoneCallIcon
                  ref={phoneRef}
                  size={16}
                  className="flex items-center"
                />
                Call
              </button>
            </DropdownMenuTrigger>
          </GlassTooltip>
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="min-w-[300px] bg-transparent border-0 shadow-none p-0 flex flex-col gap-1.5"
          >
            <DropdownMenuItem
              onSelect={() => startRecording()}
              onMouseEnter={() => micItemRef.current?.startAnimation()}
              onMouseLeave={() => micItemRef.current?.stopAnimation()}
              className="rounded-full py-2.5 px-4 cursor-pointer bg-white border border-brand-100 transition outline-none focus:bg-white data-[highlighted]:bg-white"
            >
              <MicIcon
                ref={micItemRef}
                size={18}
                className="flex items-center text-foresight"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-brand-950">
                  Record
                </span>
                <span className="text-[11px] text-brand-500 leading-snug">
                  Capture the call for Sage to transcribe + draft SOAP.
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleCallWithoutRecording}
              onMouseEnter={() => micOffItemRef.current?.startAnimation()}
              onMouseLeave={() => micOffItemRef.current?.stopAnimation()}
              className="rounded-full py-2.5 px-4 cursor-pointer bg-white border border-brand-100 transition outline-none focus:bg-white data-[highlighted]:bg-white"
            >
              <MicOffIcon
                ref={micOffItemRef}
                size={18}
                className="flex items-center text-brand-600"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-brand-950">
                  No record
                </span>
                <span className="text-[11px] text-brand-500 leading-snug">
                  Outbound dial only. Twilio coming in a future release.
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {recording && (
        <button
          onClick={stopAndProcess}
          className="inline-flex items-center gap-2 rounded-[100px] bg-red-warning text-white px-5 py-2 text-sm font-medium hover:bg-red-700 transition shadow-sm flex-shrink-0"
        >
          <Square className="w-3 h-3 fill-current" /> Stop ({elapsed}s)
        </button>
      )}

      {processing && (
        <div className="inline-flex items-center rounded-[100px] bg-brand-100 text-brand-700 px-5 py-2 text-sm flex-shrink-0">
          <Spinner size={14} label="Transcribing…" />
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
