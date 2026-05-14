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

/**
 * Service elements + auto-inferred evidence trail for each element.
 *
 * The seed data stores empty evidence arrays, but the *real* evidence lives
 * scattered across encounters, carePlanVersions, portalMessages, and
 * hospitalEvents. This query stitches them together so the audit trail
 * "auto-resolves" from the patient's actual activity.
 *
 * Returns one row per APCM element with a hydrated evidence list:
 *   { kind, refId, label, sublabel, timestamp, route }
 *
 * `route` is a relative URL the UI can link to (encounter modal, care plan
 * version, etc.).
 */
export const serviceElementsWithEvidence = query({
  args: { patientId: v.id("patients"), month: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { patient } = await requirePatientAccess(ctx, args.patientId);
    const now = new Date();
    const month =
      args.month ??
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const [year, m] = month.split("-").map(Number);
    const monthStart = Date.UTC(year, m - 1, 1);
    const monthEnd = Date.UTC(year, m, 1);

    const stored = await ctx.db
      .query("serviceElements")
      .withIndex("by_patient_and_month", (q) =>
        q.eq("patientId", args.patientId).eq("month", month),
      )
      .collect();

    if (stored.length === 0) return [];

    // Pull every entity once.
    const encounters = await ctx.db
      .query("encounters")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(200);
    const carePlan = await ctx.db
      .query("carePlans")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .first();
    const versions = carePlan
      ? await ctx.db
          .query("carePlanVersions")
          .withIndex("by_carePlan", (q) => q.eq("carePlanId", carePlan._id))
          .order("desc")
          .collect()
      : [];
    const hospitalEvents = await ctx.db
      .query("hospitalEvents")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(20);
    const portalMessages = await ctx.db
      .query("portalMessages")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(50);
    const nurse = await ctx.db.get(patient.primaryNurseId);

    const inMonth = <T extends { _creationTime?: number }>(
      e: T,
      ts: number | undefined,
    ) => {
      const t = ts ?? e._creationTime ?? 0;
      return t >= monthStart && t < monthEnd;
    };
    const monthEncounters = encounters.filter((e) => inMonth(e, e.startedAt));
    const monthHospEvents = hospitalEvents.filter((h) =>
      inMonth(h, h.eventDate),
    );
    const monthMessages = portalMessages.filter((p) =>
      inMonth(p, p._creationTime),
    );

    type Evidence = {
      kind:
        | "encounter"
        | "care_plan_version"
        | "hospital_event"
        | "portal_message"
        | "consent"
        | "practice";
      refId: string;
      label: string;
      sublabel?: string;
      timestamp?: number;
      route?: string;
    };

    function evidenceForElement(elementId: number): Evidence[] {
      switch (elementId) {
        case 1: // Patient consent
          return patient.consentObtainedAt
            ? [
                {
                  kind: "consent",
                  refId: patient._id,
                  label: "Consent on file",
                  sublabel: nurse
                    ? `Obtained ${new Date(patient.consentObtainedAt).toLocaleDateString()} by ${nurse.name}`
                    : `Obtained ${new Date(patient.consentObtainedAt).toLocaleDateString()}`,
                  timestamp: patient.consentObtainedAt,
                },
              ]
            : [];
        case 2: // Initiating visit
          {
            const first = encounters[encounters.length - 1];
            if (!first) return [];
            return [
              {
                kind: "encounter",
                refId: first._id,
                label: "Initiating visit on record",
                sublabel: `${first.type.replace("_", " ")} on ${new Date(first.startedAt).toLocaleDateString()}`,
                timestamp: first.startedAt,
                route: `?encounter=${first._id}`,
              },
            ];
          }
        case 3: // Comprehensive care plan
          return versions.slice(0, 2).map((v) => ({
            kind: "care_plan_version" as const,
            refId: v._id,
            label: `Care plan v${v.versionNumber}`,
            sublabel: `${v.diffSummary} · ${new Date(v.draftedAt).toLocaleDateString()}`,
            timestamp: v.draftedAt,
            route: `?carePlanVersion=${v._id}`,
          }));
        case 4: // 24/7 access
          return [
            {
              kind: "practice",
              refId: patient.practiceId ?? "practice",
              label: "Practice 24/7 nurse triage line",
              sublabel: "Patient receives on-call routing to a covering clinician outside business hours",
            },
          ];
        case 5: // Continuity with designated team member
          {
            const own = monthEncounters.filter(
              (e) => e.nurseId === patient.primaryNurseId,
            );
            if (own.length === 0) return [];
            return [
              {
                kind: "encounter" as const,
                refId: own[0]._id,
                label: nurse
                  ? `${own.length} touch${own.length === 1 ? "" : "es"} this month by ${nurse.name}`
                  : `${own.length} touches this month by primary nurse`,
                sublabel: `Most recent ${new Date(own[0].startedAt).toLocaleDateString()}`,
                timestamp: own[0].startedAt,
                route: `?encounter=${own[0]._id}`,
              },
            ];
          }
        case 6: // Comprehensive care management
          return monthEncounters.slice(0, 3).map((e) => ({
            kind: "encounter" as const,
            refId: e._id,
            label: `${e.type.replace("_", " ")} · ${Math.round((e.durationSeconds ?? 0) / 60)} min`,
            sublabel: `${new Date(e.startedAt).toLocaleDateString()}${
              e.topicTags.length ? " · " + e.topicTags.join(", ") : ""
            }`,
            timestamp: e.startedAt,
            route: `?encounter=${e._id}`,
          }));
        case 7: // Transitional care management
          {
            const recentHosp = hospitalEvents.filter(
              (h) => h.eventDate >= monthStart - 60 * 24 * 60 * 60 * 1000,
            );
            return recentHosp.slice(0, 3).map((h) => ({
              kind: "hospital_event" as const,
              refId: h._id,
              label: `${h.eventType[0].toUpperCase() + h.eventType.slice(1)} · ${h.facility}`,
              sublabel: `${new Date(h.eventDate).toLocaleDateString()}${
                h.reason ? " · " + h.reason : ""
              }`,
              timestamp: h.eventDate,
            }));
          }
        case 8: // Coordination of home + community services
          {
            const latestPlan = versions[0];
            const resources = latestPlan?.content?.communityResources ?? [];
            if (resources.length === 0) return [];
            return [
              {
                kind: "care_plan_version" as const,
                refId: latestPlan!._id,
                label: `${resources.length} community service${
                  resources.length === 1 ? "" : "s"
                } documented`,
                sublabel: resources.slice(0, 2).join(" · "),
                timestamp: latestPlan!.draftedAt,
                route: `?carePlanVersion=${latestPlan!._id}`,
              },
            ];
          }
        case 9: // Enhanced communication
          {
            const evs: Evidence[] = [];
            if (monthMessages.length > 0) {
              evs.push({
                kind: "portal_message",
                refId: monthMessages[0]._id,
                label: `${monthMessages.length} portal message${
                  monthMessages.length === 1 ? "" : "s"
                } exchanged`,
                sublabel: `Most recent ${new Date(monthMessages[0]._creationTime).toLocaleDateString()}`,
                timestamp: monthMessages[0]._creationTime,
              });
            }
            const calls = monthEncounters.filter((e) =>
              ["phone_call", "video"].includes(e.type),
            );
            if (calls.length > 0) {
              evs.push({
                kind: "encounter",
                refId: calls[0]._id,
                label: `${calls.length} synchronous touch${
                  calls.length === 1 ? "" : "es"
                }`,
                sublabel: `Most recent ${new Date(calls[0].startedAt).toLocaleDateString()}`,
                timestamp: calls[0].startedAt,
                route: `?encounter=${calls[0]._id}`,
              });
            }
            return evs;
          }
        case 10: // Patient population-level management
          return [
            {
              kind: "practice",
              refId: patient.practiceId ?? "practice",
              label: "Patient enrolled in panel-level reporting",
              sublabel: `Tier ${patient.tier.replace("level_", "")} cohort · risk score ${patient.riskScore ?? "—"}`,
            },
          ];
        case 11: // Performance measurement
          return [
            {
              kind: "practice",
              refId: patient.practiceId ?? "practice",
              label: "Quality measures captured",
              sublabel: "Reach rate, time-to-touch, transition-of-care closure tracked by the practice",
            },
          ];
        default:
          return [];
      }
    }

    return stored
      .sort((a, b) => a.elementId - b.elementId)
      .map((el) => ({
        ...el,
        inferredEvidence: evidenceForElement(el.elementId),
      }));
  },
});

/**
 * Recent hospital events for the banner: returns the most recent discharge
 * within the last 14 days (if any) so the UI can render a TOC alert.
 */
export const recentDischarge = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    await requirePatientAccess(ctx, patientId);
    const events = await ctx.db
      .query("hospitalEvents")
      .withIndex("by_patient_recent", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(10);
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return (
      events.find((e) => e.eventType === "discharge" && e.eventDate >= cutoff) ??
      null
    );
  },
});

/**
 * Aggregate activity feed for the patient (encounters + hospital events +
 * portal messages + care plan versions), returned in reverse-chronological
 * order. Used by the Activity tab.
 */
export const activityFeed = query({
  args: { patientId: v.id("patients"), limit: v.optional(v.number()) },
  handler: async (ctx, { patientId, limit }) => {
    await requirePatientAccess(ctx, patientId);
    const cap = limit ?? 30;

    const [encounters, hosp, messages, carePlan] = await Promise.all([
      ctx.db
        .query("encounters")
        .withIndex("by_patient_recent", (q) => q.eq("patientId", patientId))
        .order("desc")
        .take(40),
      ctx.db
        .query("hospitalEvents")
        .withIndex("by_patient_recent", (q) => q.eq("patientId", patientId))
        .order("desc")
        .take(10),
      ctx.db
        .query("portalMessages")
        .withIndex("by_patient_recent", (q) => q.eq("patientId", patientId))
        .order("desc")
        .take(20),
      ctx.db
        .query("carePlans")
        .withIndex("by_patient", (q) => q.eq("patientId", patientId))
        .first(),
    ]);
    const versions = carePlan
      ? await ctx.db
          .query("carePlanVersions")
          .withIndex("by_carePlan", (q) => q.eq("carePlanId", carePlan._id))
          .order("desc")
          .take(10)
      : [];

    type Item = {
      kind:
        | "encounter"
        | "hospital_event"
        | "portal_message"
        | "care_plan_version";
      refId: string;
      timestamp: number;
      title: string;
      body?: string;
      meta?: string;
      status?: string;
    };

    const items: Item[] = [];
    for (const e of encounters) {
      items.push({
        kind: "encounter",
        refId: e._id,
        timestamp: e.startedAt,
        title: `${e.type.replace("_", " ")} · ${Math.round((e.durationSeconds ?? 0) / 60)} min`,
        body: e.jotNotes || undefined,
        meta: e.topicTags.join(", "),
        status: e.status,
      });
    }
    for (const h of hosp) {
      items.push({
        kind: "hospital_event",
        refId: h._id,
        timestamp: h.eventDate,
        title: `${h.eventType[0].toUpperCase() + h.eventType.slice(1)} · ${h.facility}`,
        body: h.reason ?? undefined,
      });
    }
    for (const p of messages) {
      items.push({
        kind: "portal_message",
        refId: p._id,
        timestamp: p._creationTime,
        title: `${p.senderType === "patient" ? "Patient message" : p.senderType === "nurse" ? "Nurse message" : "System message"}`,
        body: p.content,
      });
    }
    for (const v of versions) {
      items.push({
        kind: "care_plan_version",
        refId: v._id,
        timestamp: v.draftedAt,
        title: `Care plan v${v.versionNumber}`,
        body: v.diffSummary,
        status: v.reviewStatus,
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, cap);
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
