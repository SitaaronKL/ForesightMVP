import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Internal mutations that the Sage agent's write tools call to actually
 * persist drafts in the database. Each one also appends an action card
 * to the current agent message so the rail can render an Apply button.
 */

export const _internalCreateSoapDraft = internalMutation({
  args: {
    threadId: v.id("agentThreads"),
    userId: v.id("users"),
    nurseId: v.id("users"),
    patientId: v.id("patients"),
    encounterId: v.id("encounters"),
    subjective: v.string(),
    objective: v.string(),
    assessment: v.string(),
    plan: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const soapNoteId = await ctx.db.insert("soapNotes", {
      patientId: args.patientId,
      encounterId: args.encounterId,
      nurseId: args.nurseId,
      subjective: args.subjective,
      objective: args.objective,
      assessment: args.assessment,
      plan: args.plan,
      status: "draft",
      draftSource: "ai_from_notes",
      aiConfidenceScore: args.confidence,
      draftedAt: Date.now(),
    });
    // Push an action-card message so the right rail can render Apply
    await ctx.db.insert("agentMessages", {
      threadId: args.threadId,
      userId: args.userId,
      role: "assistant",
      content: `Drafted SOAP note for review (confidence ${Math.round(args.confidence)}%).`,
      actionCards: [
        {
          kind: "soap_draft",
          targetId: soapNoteId,
          summary: `${args.assessment.slice(0, 100)}${args.assessment.length > 100 ? "…" : ""}`,
          status: "pending",
        },
      ],
    });
    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() });
    return soapNoteId;
  },
});

export const _internalCreateCarePlanSuggestion = internalMutation({
  args: {
    threadId: v.id("agentThreads"),
    userId: v.id("users"),
    nurseId: v.id("users"),
    patientId: v.id("patients"),
    rationale: v.string(),
    changedSections: v.array(
      v.object({
        section: v.string(),
        change: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Get current version content as base
    const carePlan = await ctx.db
      .query("carePlans")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .first();
    let baseContent: any = {
      problemList: [],
      expectedOutcomes: [],
      treatmentGoals: [],
      symptomManagement: [],
      plannedInterventions: [],
      medicationManagement: [],
      communityResources: [],
      providerCoordination: [],
      reviewSchedule: "Reviewed monthly",
    };
    let lastVersionNumber = 0;
    if (carePlan?.currentVersionId) {
      const current = await ctx.db.get(carePlan.currentVersionId);
      if (current) {
        baseContent = { ...current.content };
        lastVersionNumber = current.versionNumber;
      }
    }
    // Apply suggested changes by appending to the named sections
    const sectionMap: Record<string, string> = {
      "problem list": "problemList",
      "outcomes": "expectedOutcomes",
      "expected outcomes": "expectedOutcomes",
      "goals": "treatmentGoals",
      "treatment goals": "treatmentGoals",
      "symptoms": "symptomManagement",
      "symptom management": "symptomManagement",
      "interventions": "plannedInterventions",
      "planned interventions": "plannedInterventions",
      "medications": "medicationManagement",
      "medication management": "medicationManagement",
      "community": "communityResources",
      "community resources": "communityResources",
      "providers": "providerCoordination",
      "provider coordination": "providerCoordination",
    };
    for (const ch of args.changedSections) {
      const key = sectionMap[ch.section.toLowerCase()] ?? "plannedInterventions";
      baseContent[key] = [...(baseContent[key] ?? []), ch.change];
    }

    const carePlanId =
      carePlan?._id ??
      (await ctx.db.insert("carePlans", {
        patientId: args.patientId,
        createdBy: args.nurseId,
      }));

    const versionId = await ctx.db.insert("carePlanVersions", {
      carePlanId,
      patientId: args.patientId,
      versionNumber: lastVersionNumber + 1,
      content: baseContent,
      diffSummary: args.changedSections.map((c) => `${c.section}: ${c.change}`).join("; "),
      rationale: args.rationale,
      draftedAt: Date.now(),
      draftedBy: args.nurseId,
      draftSource: "ai_suggested",
      reviewStatus: "pending_review",
    });

    await ctx.db.insert("agentMessages", {
      threadId: args.threadId,
      userId: args.userId,
      role: "assistant",
      content: `Drafted care plan revision: ${args.rationale}`,
      actionCards: [
        {
          kind: "care_plan_revision",
          targetId: versionId,
          summary: args.changedSections
            .map((c) => `${c.section}: ${c.change.slice(0, 60)}`)
            .join(" • "),
          status: "pending",
        },
      ],
    });
    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() });
    return versionId;
  },
});

export const _internalCreatePatientMessageDraft = internalMutation({
  args: {
    threadId: v.id("agentThreads"),
    userId: v.id("users"),
    patientId: v.id("patients"),
    intent: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agentMessages", {
      threadId: args.threadId,
      userId: args.userId,
      role: "assistant",
      content: `Drafted portal message (${args.intent}):\n\n${args.body}`,
      actionCards: [
        {
          kind: "patient_message",
          targetId: args.patientId,
          summary: args.body.slice(0, 120),
          status: "pending",
        },
      ],
    });
    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() });
    return { ok: true };
  },
});

export const _internalScheduleOutreach = internalMutation({
  args: {
    threadId: v.id("agentThreads"),
    userId: v.id("users"),
    patientId: v.id("patients"),
    method: v.union(
      v.literal("call"),
      v.literal("sms"),
      v.literal("portal"),
      v.literal("email"),
    ),
    whenIso: v.string(),
  },
  handler: async (ctx, args) => {
    const when = new Date(args.whenIso).getTime();
    const id = await ctx.db.insert("outreachAttempts", {
      patientId: args.patientId,
      scheduledByUserId: args.userId,
      scheduledByAgent: true,
      method: args.method,
      scheduledFor: when,
      status: "scheduled",
      attemptNumber: 1,
    });
    await ctx.db.insert("agentMessages", {
      threadId: args.threadId,
      userId: args.userId,
      role: "assistant",
      content: `Scheduled ${args.method} outreach for ${new Date(when).toLocaleString()}.`,
      actionCards: [
        {
          kind: "outreach",
          targetId: id,
          summary: `${args.method} on ${new Date(when).toLocaleDateString()}`,
          status: "pending",
        },
      ],
    });
    await ctx.db.patch(args.threadId, { lastMessageAt: Date.now() });
    return id;
  },
});
