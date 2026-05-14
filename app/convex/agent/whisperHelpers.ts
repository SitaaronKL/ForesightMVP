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

/**
 * Bridge query: confirms the caller (by auth user id) has access to the patient
 * AND returns the seeded nurse id (which is what patients.primaryNurseId points to).
 * Used by Node actions that can't call requirePatientAccess directly.
 */
export const _internalCheckPatientAccess = internalQuery({
  args: {
    patientId: v.id("patients"),
    callerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient) return { allowed: false };
    const caller = await ctx.db.get(args.callerId);
    if (!caller) return { allowed: false };
    if (caller.role === "admin") return { allowed: true, nurseId: patient.primaryNurseId };

    // Direct match: caller is the primary nurse
    if (patient.primaryNurseId === args.callerId) {
      return { allowed: true, nurseId: args.callerId };
    }

    // Demo bridge: caller is a freshly-signed-up user whose email matches a seeded nurse row
    if (caller.email) {
      const normalized = caller.email.toLowerCase().trim();
      const seeded = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", normalized))
        .filter((q) => q.neq(q.field("_id"), args.callerId))
        .first();
      if (seeded && patient.primaryNurseId === seeded._id) {
        return { allowed: true, nurseId: seeded._id };
      }
    }
    return { allowed: false };
  },
});
