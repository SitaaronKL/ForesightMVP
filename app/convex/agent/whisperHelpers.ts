import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const _internalSaveTranscript = internalMutation({
  args: {
    encounterId: v.optional(v.id("encounters")),
    patientId: v.id("patients"),
    audioStorageId: v.id("_storage"),
    audioDurationSeconds: v.number(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transcripts", {
      ...args,
      source: "whisper",
      language: "en-US",
    });
  },
});

export const _internalGetTranscript = internalQuery({
  args: { transcriptId: v.id("transcripts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transcriptId);
  },
});
