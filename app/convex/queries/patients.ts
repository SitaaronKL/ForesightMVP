import { v } from "convex/values";
import { query } from "../_generated/server";
import { requirePatientAccess } from "../lib/auth";

export const get = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    const { patient } = await requirePatientAccess(ctx, patientId);
    return patient;
  },
});

export const overview = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    const { patient } = await requirePatientAccess(ctx, patientId);

    const carePlan = await ctx.db
      .query("carePlans")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .first();
    let currentVersion = null;
    if (carePlan?.currentVersionId) {
      currentVersion = await ctx.db.get(carePlan.currentVersionId);
    }

    const recentEncounters = await ctx.db
      .query("encounters")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(10);

    const recentHospitalEvents = await ctx.db
      .query("hospitalEvents")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(5);

    const nurse = await ctx.db.get(patient.primaryNurseId);

    return {
      patient,
      nurse: nurse ? { _id: nurse._id, name: nurse.name } : null,
      carePlan,
      currentVersion,
      recentEncounters,
      recentHospitalEvents,
    };
  },
});

export const encountersList = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    await requirePatientAccess(ctx, patientId);
    return await ctx.db
      .query("encounters")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(50);
  },
});

/**
 * Full detail for a single encounter: the encounter, its SOAP note (if any),
 * and the transcript (if any). Used by the click-into-encounter modal.
 */
export const encounterDetail = query({
  args: { encounterId: v.id("encounters") },
  handler: async (ctx, { encounterId }) => {
    const encounter = await ctx.db.get(encounterId);
    if (!encounter) return null;
    await requirePatientAccess(ctx, encounter.patientId);

    const soapNote = await ctx.db
      .query("soapNotes")
      .withIndex("by_encounter", (q) => q.eq("encounterId", encounterId))
      .first();

    const transcript = await ctx.db
      .query("transcripts")
      .withIndex("by_encounter", (q) => q.eq("encounterId", encounterId))
      .first();

    return { encounter, soapNote, transcript };
  },
});

export const documents = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    await requirePatientAccess(ctx, patientId);
    return await ctx.db
      .query("medicalDocuments")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(50);
  },
});

export const serviceElementsForMonth = query({
  args: { patientId: v.id("patients"), month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requirePatientAccess(ctx, args.patientId);
    const now = new Date();
    const month =
      args.month ??
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    return await ctx.db
      .query("serviceElements")
      .withIndex("by_patient_and_month", (q) =>
        q.eq("patientId", args.patientId).eq("month", month),
      )
      .collect();
  },
});

export const monthlyBilling = query({
  args: { patientId: v.id("patients"), month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requirePatientAccess(ctx, args.patientId);
    const now = new Date();
    const month =
      args.month ??
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    return await ctx.db
      .query("billingRecords")
      .withIndex("by_patient_and_month", (q) =>
        q.eq("patientId", args.patientId).eq("month", month),
      )
      .first();
  },
});

export const allBilling = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await requirePatientAccess(ctx, args.patientId);
    return await ctx.db
      .query("billingRecords")
      .withIndex("by_patient_and_month", (q) =>
        q.eq("patientId", args.patientId),
      )
      .order("desc")
      .take(12);
  },
});

export const portalMessages = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await requirePatientAccess(ctx, args.patientId);
    return await ctx.db
      .query("portalMessages")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(100);
  },
});
