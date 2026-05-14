import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Application overlay on top of Convex Auth's users table. Convex Auth owns the
  // `users` table; we add fields here that are merged into it.
  users: defineTable({
    // Convex Auth-managed fields (declared so we can reference them):
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    // Application overlay:
    role: v.optional(
      v.union(
        v.literal("nurse"),
        v.literal("physician"),
        v.literal("admin"),
        v.literal("patient"),
      ),
    ),
    practiceId: v.optional(v.id("practices")),
    avatarUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  })
    .index("by_role", ["role"])
    .index("by_practice", ["practiceId"])
    .index("email", ["email"])
    .index("phone", ["phone"]),

  practices: defineTable({
    name: v.string(),
    npi: v.optional(v.string()),
    timezone: v.string(),
  }),

  patients: defineTable({
    medicareId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    gender: v.union(v.literal("M"), v.literal("F"), v.literal("X")),
    addressLine1: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),

    dualEligible: v.boolean(),
    qmbStatus: v.boolean(),
    supplementalInsurance: v.union(
      v.literal("medigap"),
      v.literal("medicare_advantage"),
      v.literal("medicaid_only"),
      v.literal("none"),
    ),

    chronicConditions: v.array(v.string()),
    primaryConditionForPCM: v.optional(v.string()),
    tier: v.union(v.literal("level_1"), v.literal("level_2"), v.literal("level_3")),
    billingProgram: v.union(v.literal("ccm"), v.literal("pcm"), v.literal("apcm")),

    riskScore: v.number(),
    riskScoreUpdatedAt: v.number(),

    primaryNurseId: v.id("users"),
    practiceId: v.optional(v.id("practices")),
    portalUserId: v.optional(v.id("users")),

    enrolledAt: v.number(),
    consentObtainedAt: v.number(),
    consentObtainedBy: v.id("users"),
    consentRevokedAt: v.optional(v.number()),

    lastTouchedAt: v.optional(v.number()),

    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("revoked"),
      v.literal("deceased"),
    ),
    deletedAt: v.optional(v.number()),
  })
    .index("by_primary_nurse", ["primaryNurseId", "status"])
    .index("by_tier", ["tier", "status"])
    .index("by_practice", ["practiceId"])
    .index("by_billing_program", ["billingProgram"])
    .index("by_portal_user", ["portalUserId"]),

  carePlans: defineTable({
    patientId: v.id("patients"),
    currentVersionId: v.optional(v.id("carePlanVersions")),
    createdBy: v.id("users"),
  }).index("by_patient", ["patientId"]),

  carePlanVersions: defineTable({
    carePlanId: v.id("carePlans"),
    patientId: v.id("patients"),
    versionNumber: v.number(),
    content: v.object({
      problemList: v.array(v.string()),
      expectedOutcomes: v.array(v.string()),
      treatmentGoals: v.array(v.string()),
      symptomManagement: v.array(v.string()),
      plannedInterventions: v.array(v.string()),
      medicationManagement: v.array(v.string()),
      communityResources: v.array(v.string()),
      providerCoordination: v.array(v.string()),
      reviewSchedule: v.string(),
    }),
    diffSummary: v.string(),
    rationale: v.string(),
    draftedAt: v.number(),
    draftedBy: v.id("users"),
    draftSource: v.union(
      v.literal("manual"),
      v.literal("ai_suggested"),
      v.literal("protocol_template"),
    ),
    reviewStatus: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),
  })
    .index("by_carePlan", ["carePlanId", "versionNumber"])
    .index("by_patient_recent", ["patientId", "draftedAt"]),

  encounters: defineTable({
    patientId: v.id("patients"),
    nurseId: v.id("users"),
    type: v.union(
      v.literal("phone_call"),
      v.literal("sms"),
      v.literal("portal_message"),
      v.literal("video"),
      v.literal("in_person"),
      v.literal("email"),
      v.literal("inbound_call"),
    ),
    direction: v.union(v.literal("outbound"), v.literal("inbound")),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationSeconds: v.number(),
    status: v.union(
      v.literal("completed"),
      v.literal("voicemail"),
      v.literal("no_answer"),
      v.literal("busy"),
      v.literal("wrong_number"),
      v.literal("declined"),
      v.literal("hung_up"),
    ),
    topicTags: v.array(v.string()),
    jotNotes: v.optional(v.string()),
    transcriptId: v.optional(v.id("transcripts")),
    soapNoteId: v.optional(v.id("soapNotes")),
    serviceElementsTouched: v.array(v.number()),
  })
    .index("by_patient_recent", ["patientId", "startedAt"])
    .index("by_nurse_and_date", ["nurseId", "startedAt"])
    .index("by_status", ["status"]),

  soapNotes: defineTable({
    patientId: v.id("patients"),
    encounterId: v.id("encounters"),
    nurseId: v.id("users"),
    subjective: v.string(),
    objective: v.string(),
    assessment: v.string(),
    plan: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("signed"),
      v.literal("amended"),
    ),
    draftSource: v.union(
      v.literal("manual"),
      v.literal("ai_from_transcript"),
      v.literal("ai_from_notes"),
    ),
    aiConfidenceScore: v.optional(v.number()),
    signedAt: v.optional(v.number()),
    signedBy: v.optional(v.id("users")),
    amendedFromId: v.optional(v.id("soapNotes")),
    draftedAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_encounter", ["encounterId"])
    .index("by_status", ["status"]),

  transcripts: defineTable({
    encounterId: v.optional(v.id("encounters")),
    patientId: v.id("patients"),
    audioStorageId: v.optional(v.id("_storage")),
    audioDurationSeconds: v.number(),
    text: v.string(),
    source: v.union(v.literal("whisper"), v.literal("manual")),
    language: v.string(),
  }).index("by_encounter", ["encounterId"]),

  agentThreads: defineTable({
    userId: v.id("users"),
    title: v.string(),
    contextPatientId: v.optional(v.id("patients")),
    lastMessageAt: v.number(),
  }).index("by_user_recent", ["userId", "lastMessageAt"]),

  agentMessages: defineTable({
    threadId: v.id("agentThreads"),
    userId: v.id("users"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("tool"),
      v.literal("system"),
    ),
    content: v.string(),
    // For tool messages, capture the call data. Bounded by maxTurns=4.
    toolName: v.optional(v.string()),
    toolArgs: v.optional(v.any()),
    toolResult: v.optional(v.any()),
    // For assistant messages, optional action cards.
    actionCards: v.optional(
      v.array(
        v.object({
          kind: v.string(), // "soap_draft" | "care_plan_revision" | "patient_message" | "outreach"
          targetId: v.optional(v.string()),
          summary: v.string(),
          status: v.union(v.literal("pending"), v.literal("applied"), v.literal("dismissed")),
        }),
      ),
    ),
  }).index("by_thread", ["threadId"]),

  agentBriefings: defineTable({
    userId: v.id("users"),
    date: v.string(),
    type: v.union(v.literal("morning"), v.literal("end_of_day")),
    content: v.object({
      headline: v.string(),
      priorityQueue: v.array(
        v.object({
          patientId: v.id("patients"),
          patientName: v.string(),
          tier: v.string(),
          reason: v.string(),
        }),
      ),
      kpis: v.object({
        panelSize: v.number(),
        reachedThisMonth: v.number(),
        reachRate: v.number(),
        avgDocMinutes: v.number(),
        serviceElementCoverage: v.number(),
      }),
      headsUp: v.array(v.string()),
      recap: v.optional(v.string()),
    }),
    viewedAt: v.optional(v.number()),
  }).index("by_user_and_date", ["userId", "date", "type"]),

  notifications: defineTable({
    userId: v.id("users"),
    patientId: v.optional(v.id("patients")),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    actionUrl: v.optional(v.string()),
    read: v.boolean(),
    readAt: v.optional(v.number()),
  })
    .index("by_user_unread", ["userId", "read"])
    .index("by_user_recent", ["userId"]),

  medicalDocuments: defineTable({
    patientId: v.id("patients"),
    type: v.union(
      v.literal("lab"),
      v.literal("imaging"),
      v.literal("discharge_summary"),
      v.literal("referral"),
      v.literal("admission_note"),
      v.literal("other"),
    ),
    title: v.string(),
    fileStorageId: v.optional(v.id("_storage")),
    uploadedBy: v.id("users"),
    sourceFacility: v.optional(v.string()),
    parsedSummary: v.optional(v.string()),
    tags: v.array(v.string()),
  }).index("by_patient", ["patientId"]),

  // Tier 2 important
  timeLogs: defineTable({
    patientId: v.id("patients"),
    nurseId: v.id("users"),
    encounterId: v.optional(v.id("encounters")),
    startTimestamp: v.number(),
    endTimestamp: v.number(),
    durationSeconds: v.number(),
    activityType: v.union(
      v.literal("phone_call"),
      v.literal("chart_review"),
      v.literal("specialist_coord"),
      v.literal("care_plan_update"),
      v.literal("rx_management"),
      v.literal("family_call"),
      v.literal("documentation"),
      v.literal("other"),
    ),
    activityDescription: v.string(),
    billable: v.boolean(),
    month: v.string(),
  })
    .index("by_patient_and_month", ["patientId", "month"])
    .index("by_nurse_and_month", ["nurseId", "month"]),

  billingRecords: defineTable({
    patientId: v.id("patients"),
    primaryNurseId: v.id("users"),
    practiceId: v.optional(v.id("practices")),
    month: v.string(),
    billingProgram: v.union(v.literal("ccm"), v.literal("pcm"), v.literal("apcm")),
    billingCodes: v.array(v.string()),
    timeLoggedMinutes: v.optional(v.number()),
    serviceElementsSatisfied: v.optional(v.array(v.number())),
    reimbursementCents: v.number(),
    patientCostShareCents: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("ready_to_submit"),
      v.literal("submitted"),
      v.literal("paid"),
      v.literal("denied"),
    ),
    submittedAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
  })
    .index("by_patient_and_month", ["patientId", "month"])
    .index("by_status", ["status"]),

  serviceElements: defineTable({
    patientId: v.id("patients"),
    month: v.string(),
    elementId: v.number(),
    elementName: v.string(),
    status: v.union(
      v.literal("not_yet"),
      v.literal("available"),
      v.literal("delivered"),
    ),
    evidence: v.array(
      v.object({
        kind: v.string(),
        refId: v.string(),
        note: v.optional(v.string()),
      }),
    ),
  }).index("by_patient_and_month", ["patientId", "month"]),

  // Tier 3
  portalMessages: defineTable({
    patientId: v.id("patients"),
    senderType: v.union(
      v.literal("nurse"),
      v.literal("patient"),
      v.literal("system"),
    ),
    senderId: v.id("users"),
    content: v.string(),
    readAt: v.optional(v.number()),
  }).index("by_patient_recent", ["patientId"]),

  outreachAttempts: defineTable({
    patientId: v.id("patients"),
    scheduledByUserId: v.optional(v.id("users")),
    scheduledByAgent: v.boolean(),
    method: v.union(
      v.literal("call"),
      v.literal("sms"),
      v.literal("portal"),
      v.literal("email"),
      v.literal("mail"),
    ),
    scheduledFor: v.number(),
    bestWindowSuggestion: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    attemptNumber: v.number(),
    resultEncounterId: v.optional(v.id("encounters")),
  })
    .index("by_patient", ["patientId"])
    .index("by_scheduled", ["scheduledFor"]),

  hospitalEvents: defineTable({
    patientId: v.id("patients"),
    eventType: v.union(
      v.literal("admission"),
      v.literal("discharge"),
      v.literal("transfer"),
    ),
    facility: v.string(),
    eventDate: v.number(),
    reason: v.optional(v.string()),
    notified: v.boolean(),
    notifiedAt: v.optional(v.number()),
    transitionFollowupRequiredBy: v.optional(v.number()),
  }).index("by_patient_recent", ["patientId", "eventDate"]),
});
