"use node";
import { tool } from "@openai/agents";
import { z } from "zod";
import { internal, api } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Agent tool context. Carries the Convex ActionCtx, the calling auth user id,
 * the resolved seeded nurse id, and the active thread for action-card persistence.
 */
export type AgentContext = {
  ctx: ActionCtx;
  userId: Id<"users">;       // auth user id (matches agentThreads.userId)
  nurseId: Id<"users">;      // seeded nurse row id (matches patients.primaryNurseId)
  threadId: Id<"agentThreads">;
  contextPatientId?: Id<"patients">; // set when the rail is open on a patient page
};

// ---------- READ TOOLS ----------

export const listPanel = tool({
  name: "listPanel",
  description:
    "List patients in the calling nurse's panel with filters and a smart-urgency sort.",
  parameters: z.object({
    tier: z.enum(["level_1", "level_2", "level_3"]).nullable().optional(),
    overdue: z.boolean().nullable().optional(),
    search: z.string().nullable().optional(),
    limit: z.number().min(1).max(50).default(25),
  }),
  execute: async (input, runContext) => {
    const { ctx } = runContext!.context as AgentContext;
    const result: any = await ctx.runQuery(api.queries.panels.list, {
      paginationOpts: { numItems: input.limit, cursor: null },
      tierFilter: input.tier ?? undefined,
      overdueOnly: input.overdue ?? undefined,
      search: input.search ?? undefined,
    });
    return result.page.map((p: any) => ({
      id: p._id,
      name: `${p.firstName} ${p.lastName}`,
      tier: p.tier,
      billingProgram: p.billingProgram,
      riskScore: Math.round(p.riskScore),
      lastTouchedAt: p.lastTouchedAt,
      conditions: p.chronicConditions.slice(0, 3),
      urgencyReason: p.urgencyReason,
      overdue: p.overdue,
    }));
  },
});

export const getPatient = tool({
  name: "getPatient",
  description:
    "Fetch full patient context: conditions, demographics, risk, current care plan, recent encounters, hospital events.",
  parameters: z.object({
    patientId: z.string().describe("Convex patient id"),
  }),
  execute: async (input, runContext) => {
    const { ctx } = runContext!.context as AgentContext;
    const result: any = await ctx.runQuery(api.queries.patients.overview, {
      patientId: input.patientId as Id<"patients">,
    });
    return {
      id: result.patient._id,
      name: `${result.patient.firstName} ${result.patient.lastName}`,
      age:
        new Date().getUTCFullYear() -
        new Date(result.patient.dateOfBirth).getUTCFullYear(),
      tier: result.patient.tier,
      billingProgram: result.patient.billingProgram,
      riskScore: Math.round(result.patient.riskScore),
      conditions: result.patient.chronicConditions,
      currentCarePlan: result.currentVersion?.content ?? null,
      recentEncounters: result.recentEncounters.map((e: any) => ({
        id: e._id,
        date: new Date(e.startedAt).toISOString().slice(0, 10),
        type: e.type,
        duration: Math.round(e.durationSeconds / 60),
        status: e.status,
        topics: e.topicTags,
      })),
      recentHospitalEvents: result.recentHospitalEvents.map((h: any) => ({
        date: new Date(h.eventDate).toISOString().slice(0, 10),
        type: h.eventType,
        facility: h.facility,
        reason: h.reason,
      })),
    };
  },
});

export const getOverdue = tool({
  name: "getOverdue",
  description: "Patients on the nurse's panel more than 30 days since last touch.",
  parameters: z.object({}),
  execute: async (_input, runContext) => {
    const { ctx } = runContext!.context as AgentContext;
    const result: any = await ctx.runQuery(api.queries.panels.list, {
      paginationOpts: { numItems: 50, cursor: null },
      overdueOnly: true,
    });
    return result.page.map((p: any) => ({
      id: p._id,
      name: `${p.firstName} ${p.lastName}`,
      tier: p.tier,
      lastTouchedAt: p.lastTouchedAt,
      reason: p.urgencyReason,
    }));
  },
});

export const getDueToday = tool({
  name: "getDueToday",
  description: "Today's priority queue: most urgent patients to call today.",
  parameters: z.object({ limit: z.number().default(10) }),
  execute: async (input, runContext) => {
    const { ctx } = runContext!.context as AgentContext;
    const result: any = await ctx.runQuery(api.queries.panels.todaysQueue, {
      limit: input.limit,
    });
    return result.map((p: any) => ({
      id: p._id,
      name: `${p.firstName} ${p.lastName}`,
      tier: p.tier,
      riskScore: Math.round(p.riskScore),
      reason: p.urgencyReason,
    }));
  },
});

export const getMonthlyKPIs = tool({
  name: "getMonthlyKPIs",
  description: "Dashboard KPIs for the calling nurse for the current month.",
  parameters: z.object({}),
  execute: async (_input, runContext) => {
    const { ctx } = runContext!.context as AgentContext;
    const kpis: any = await ctx.runQuery(api.queries.panels.kpis, {});
    return {
      panelSize: kpis.panelSize,
      reachedThisMonth: kpis.reachedThisMonth,
      reachRate: `${Math.round(kpis.reachRate * 100)}%`,
      avgDocMinutes: kpis.avgDocMinutes.toFixed(1),
      serviceElementCoverage: `${Math.round(kpis.serviceElementCoverage * 100)}%`,
      month: kpis.month,
    };
  },
});

export const getServiceElementCoverage = tool({
  name: "getServiceElementCoverage",
  description:
    "APCM service-element coverage matrix for a specific patient in the current month.",
  parameters: z.object({ patientId: z.string() }),
  execute: async (input, runContext) => {
    const { ctx } = runContext!.context as AgentContext;
    const elements: any = await ctx.runQuery(
      api.queries.patients.serviceElementsForMonth,
      { patientId: input.patientId as Id<"patients"> },
    );
    return elements.map((e: any) => ({
      id: e.elementId,
      name: e.elementName,
      status: e.status,
    }));
  },
});

// ---------- WRITE TOOLS ----------
// Each write tool creates a real DB draft AND an action card on the agent
// message, so the right rail can render an Apply button.

export const draftSoapNote = tool({
  name: "draftSoapNote",
  description:
    "Draft a SOAP note for a recent encounter and surface an Apply card to the nurse. " +
    "Use the patient's most recent completed encounter id if the nurse does not specify one.",
  parameters: z.object({
    patientId: z.string(),
    encounterId: z.string(),
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    plan: z.string(),
    confidence: z.number().min(0).max(100).default(75),
  }),
  execute: async (input, runContext) => {
    const { ctx, userId, nurseId, threadId } =
      runContext!.context as AgentContext;
    const soapNoteId = await ctx.runMutation(
      internal.mutations.agentDrafts._internalCreateSoapDraft,
      {
        threadId,
        userId,
        nurseId,
        patientId: input.patientId as Id<"patients">,
        encounterId: input.encounterId as Id<"encounters">,
        subjective: input.subjective,
        objective: input.objective,
        assessment: input.assessment,
        plan: input.plan,
        confidence: input.confidence,
      },
    );
    return {
      draftCreated: true,
      soapNoteId,
      note: "Draft created. The nurse can review and sign via the Apply button in the right rail.",
    };
  },
});

export const suggestCarePlanRevision = tool({
  name: "suggestCarePlanRevision",
  description:
    "Suggest a care plan revision: appends one or more changes to the named sections and creates a pending-review version with an Apply card.",
  parameters: z.object({
    patientId: z.string(),
    rationale: z.string(),
    changedSections: z.array(
      z.object({
        section: z
          .string()
          .describe(
            "One of: problem list, expected outcomes, treatment goals, symptom management, planned interventions, medication management, community resources, provider coordination",
          ),
        change: z.string().describe("The new line to add to that section"),
      }),
    ),
  }),
  execute: async (input, runContext) => {
    const { ctx, userId, nurseId, threadId } =
      runContext!.context as AgentContext;
    const versionId = await ctx.runMutation(
      internal.mutations.agentDrafts._internalCreateCarePlanSuggestion,
      {
        threadId,
        userId,
        nurseId,
        patientId: input.patientId as Id<"patients">,
        rationale: input.rationale,
        changedSections: input.changedSections,
      },
    );
    return {
      versionCreated: true,
      versionId,
      note: "Pending-review version drafted. Nurse approves via Apply card.",
    };
  },
});

export const draftPatientMessage = tool({
  name: "draftPatientMessage",
  description:
    "Draft a portal message for the nurse to review and send. Body must be plain English at 8th-grade reading level. Never sends directly.",
  parameters: z.object({
    patientId: z.string(),
    intent: z.string(),
    body: z.string(),
  }),
  execute: async (input, runContext) => {
    const { ctx, userId, threadId } = runContext!.context as AgentContext;
    await ctx.runMutation(
      internal.mutations.agentDrafts._internalCreatePatientMessageDraft,
      {
        threadId,
        userId,
        patientId: input.patientId as Id<"patients">,
        intent: input.intent,
        body: input.body,
      },
    );
    return { drafted: true, note: "Message staged for nurse approval." };
  },
});

export const scheduleOutreachAttempt = tool({
  name: "scheduleOutreachAttempt",
  description:
    "Schedule a future outreach attempt (call, SMS, portal, email) for the nurse to make.",
  parameters: z.object({
    patientId: z.string(),
    method: z.enum(["call", "sms", "portal", "email"]),
    whenIso: z.string().describe("ISO 8601 timestamp"),
  }),
  execute: async (input, runContext) => {
    const { ctx, userId, threadId } = runContext!.context as AgentContext;
    const id = await ctx.runMutation(
      internal.mutations.agentDrafts._internalScheduleOutreach,
      {
        threadId,
        userId,
        patientId: input.patientId as Id<"patients">,
        method: input.method,
        whenIso: input.whenIso,
      },
    );
    return { scheduled: true, outreachId: id };
  },
});

export const allTools = [
  listPanel,
  getPatient,
  getOverdue,
  getDueToday,
  getMonthlyKPIs,
  getServiceElementCoverage,
  draftSoapNote,
  suggestCarePlanRevision,
  draftPatientMessage,
  scheduleOutreachAttempt,
];

export const readOnlyTools = [
  listPanel,
  getPatient,
  getOverdue,
  getDueToday,
  getMonthlyKPIs,
  getServiceElementCoverage,
];
