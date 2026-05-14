"use node";
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import OpenAI from "openai";

/**
 * Transcribe an audio blob already uploaded to Convex File Storage.
 * Returns a transcript row id.
 */
export const transcribeAudio = action({
  args: {
    storageId: v.id("_storage"),
    patientId: v.id("patients"),
    encounterId: v.optional(v.id("encounters")),
    audioDurationSeconds: v.number(),
  },
  handler: async (ctx, args): Promise<{ transcriptId: Id<"transcripts">; text: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Fetch audio bytes from Convex storage
    const audioBlob = await ctx.storage.get(args.storageId);
    if (!audioBlob) throw new Error("Audio not found in storage");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
    });

    const transcriptId: Id<"transcripts"> = await ctx.runMutation(
      internal.agent.whisperHelpers._internalSaveTranscript,
      {
        encounterId: args.encounterId,
        patientId: args.patientId,
        audioStorageId: args.storageId,
        audioDurationSeconds: args.audioDurationSeconds,
        text: transcription.text,
      },
    );
    return { transcriptId, text: transcription.text };
  },
});

/**
 * Draft a SOAP note from a transcript using GPT-4o (regular OpenAI SDK, not Agents).
 * Returns the draft soapNote id.
 */
export const draftSoapFromTranscript = action({
  args: {
    transcriptId: v.id("transcripts"),
    patientId: v.id("patients"),
    encounterId: v.id("encounters"),
  },
  handler: async (ctx, args): Promise<{ soapNoteId: Id<"soapNotes"> }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transcript: any = await ctx.runQuery(internal.agent.whisperHelpers._internalGetTranscript, {
      transcriptId: args.transcriptId,
    });
    if (!transcript) throw new Error("Transcript not found");

    const patient: any = await ctx.runQuery(internal.seed._internalGetPatient, {
      patientId: args.patientId,
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a clinical documentation assistant. Given a transcript of a nurse-patient phone call, produce a structured SOAP note (Subjective, Objective, Assessment, Plan). Use clinical shorthand. Be specific. Return JSON with keys: subjective, objective, assessment, plan, confidence (0-100).`,
        },
        {
          role: "user",
          content: `Patient: ${patient?.firstName} ${patient?.lastName}, ${patient?.tier}, conditions: ${(patient?.chronicConditions ?? []).join(", ")}.

Transcript:
${transcript.text}

Produce the SOAP note now as JSON.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        subjective: "Could not parse model output.",
        objective: "",
        assessment: "",
        plan: "",
        confidence: 30,
      };
    }

    const soapNoteId: Id<"soapNotes"> = await ctx.runMutation(
      internal.mutations.soapNotes._internalCreateDraft,
      {
        patientId: args.patientId,
        encounterId: args.encounterId,
        nurseId: userId,
        subjective: parsed.subjective ?? "",
        objective: parsed.objective ?? "",
        assessment: parsed.assessment ?? "",
        plan: parsed.plan ?? "",
        draftSource: "ai_from_transcript",
        aiConfidenceScore: parsed.confidence ?? 75,
      },
    );

    return { soapNoteId };
  },
});
