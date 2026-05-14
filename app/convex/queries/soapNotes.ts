import { v } from "convex/values";
import { query } from "../_generated/server";
import { requirePatientAccess } from "../lib/auth";

export const get = query({
  args: { soapNoteId: v.id("soapNotes") },
  handler: async (ctx, { soapNoteId }) => {
    const note = await ctx.db.get(soapNoteId);
    if (!note) return null;
    await requirePatientAccess(ctx, note.patientId);
    return note;
  },
});

export const getTranscriptForNote = query({
  args: { soapNoteId: v.id("soapNotes") },
  handler: async (ctx, { soapNoteId }) => {
    const note = await ctx.db.get(soapNoteId);
    if (!note) return null;
    await requirePatientAccess(ctx, note.patientId);
    const transcript = await ctx.db
      .query("transcripts")
      .withIndex("by_encounter", (q) => q.eq("encounterId", note.encounterId))
      .first();
    return transcript;
  },
});
