# Technical Architecture: Foresight Care Operating System

**Author:** Dhruv Lalwani
**Prepared for:** Foresight Health interview (Tienlan Sun)
**Date:** May 14, 2026
**Companion docs:** CCM_Plan.md, APCM_Plan.md, PRD.md, UIUX_Spec.md

---

## 1. Tech stack

### 1.1 Primary stack (what we build)

| Layer | Choice | Reason |
|---|---|---|
| Frontend framework | NextJS 16 with App Router, React 19 | Server components, streaming, server actions, optimal for the liquid glass animations and data-heavy dashboards. React Server Components reduce client bundle size. |
| Hosting | Vercel | Zero-config deployment, edge cached static, native NextJS integration, preview deployments per branch |
| Database | Convex | TypeScript-native schema, reactive subscriptions, scheduled functions, file storage, auth integration, all in one platform |
| File storage | Convex File Storage | Patient audio recordings, medical document uploads, audit packet PDFs |
| Server logic | Convex Actions and Mutations | Server-side TS functions with longer timeouts (Actions for external API calls, up to 10 min), shorter for Mutations |
| Cron / scheduled work | Convex scheduled functions | Morning Briefing at 6am, end-of-day wrap at 6pm, nightly risk score recompute, monthly billing rollup |
| Auth | Convex Auth (`@convex-dev/auth`) | First-party Convex authentication. Email/password and one-time-code support, role-based access via overlay fields on the built-in `users` table, JWT issued and validated by Convex |
| Agent layer | OpenAI Agents SDK (`@openai/agents`) | Sage agent built with `Agent` class, Zod-typed tools, automatic agent loop with `maxTurns` cap, input guardrails, sessions via custom `ConvexSession` adapter, built-in tracing (disabled in production) |
| Transcription | OpenAI SDK (`openai`) Whisper API | Browser audio capture transcribed in a Convex Action. Separate from the Agents SDK; used as a one-shot API call, not an agent run |
| Styling | Tailwind CSS 4 (CSS-first config via `@theme`) | Backdrop-blur utilities, custom gradient stops, brand color palette. No `tailwind.config.ts` file; theme lives in `globals.css` |
| Animation | Motion (`motion`, formerly framer-motion) | Page transitions, modal entries, micro-interactions, animated agent thinking states |
| Charts | Recharts | Risk trend lines, reach rate over time, panel composition charts |
| Diff rendering | diff-match-patch + custom React component | Care plan version diff view |
| Markdown rendering | react-markdown | Agent message rendering, care plan summary in patient portal |
| Forms | react-hook-form + zod | Type-safe form validation throughout |

### 1.2 Alternative stack (shown in Excalidraw diagrams as the "alt" option, not built)

| Layer | Alternative | Notes |
|---|---|---|
| Database | AWS RDS Postgres with Prisma ORM | Traditional relational store, more mature, more ops overhead |
| File storage | AWS S3 | HIPAA-compatible blob storage with server-side encryption |
| Server logic | AWS Lambda with API Gateway | Stateless functions, cold-start overhead, more ops surface |
| Cron | AWS EventBridge with Lambda targets | Schedule-driven function execution |
| Auth | AWS Cognito or Clerk | Federated identity, hosted auth UI, more configuration overhead |
| Hosting | AWS EC2 with Auto Scaling Groups behind ALB | Self-managed, requires DevOps |
| Agent | Claude Agent SDK | Tool calling, multi-step reasoning, longer context |

The dual-track choice is shown in every Excalidraw architecture diagram with the primary choice as the main label and the alternative in parentheses. This communicates to Tienlan that the alternatives were considered, evaluated, and rejected for shipping-speed reasons in the Minimum Viable Product context. For a production system, the trade-offs shift; AWS becomes more compelling for compliance audits, regional residency requirements, and integration with existing healthcare infrastructure.

### 1.3 External services (used in both stacks)

- **OpenAI API** for GPT-4o, GPT-4o-mini, Whisper
- **Twilio** for outbound calling (future state, not Minimum Viable Product)
- **Stripe** for any patient self-pay (future state)
- **PostHog** for product analytics (free tier, optional)
- **Sentry** for error tracking (free tier)

---

## 2. Data model

The full schema in Convex TypeScript-compatible pseudocode. Implementation will translate directly into `convex/schema.ts`.

### 2.1 Tier 1: Minimum Viable Product essential

```ts
// Convex Auth owns the `users` table. We extend its schema (per
// @convex-dev/auth) with application-specific overlay fields. The auth
// component manages identity, sessions, and JWT; we add role and practice
// scoping on top.
users: {
  // Convex Auth fields (managed by the auth component):
  //   email: string, emailVerificationTime?: number, phone?: string,
  //   phoneVerificationTime?: number, image?: string, name?: string,
  //   isAnonymous?: boolean
  // Application overlay fields:
  role: "nurse" | "physician" | "admin" | "patient",
  practiceId: id<"practices">?,
  avatarUrl: string?,                 // we manage this separately from auth's `image`
  status: "active" | "inactive",
  createdAt: number,
}
.index("by_role", ["role"])
.index("by_practice", ["practiceId"])
// Note: auth-managed indexes (by email, by phone) come from Convex Auth's authTables.
// We never accept a userId argument for authorization. Always derive via
// `getAuthUserId(ctx)` from `@convex-dev/auth/server`.

patients: {
  medicareId: string,                 // stored plaintext in Minimum Viable Product, encrypted in production
  firstName: string, lastName: string,
  dateOfBirth: string,                // yyyy-mm-dd
  gender: "M" | "F" | "X",
  addressLine1: string, city: string, state: string, zip: string,
  phone: string, email: string?,

  dualEligible: boolean,
  qmbStatus: boolean,
  supplementalInsurance: "medigap" | "medicare_advantage" | "medicaid_only" | "none",

  chronicConditions: array<string>,   // condition codes (simplified strings in MVP)
  primaryConditionForPCM: string?,    // if billingProgram == "pcm"
  tier: "level_1" | "level_2" | "level_3",
  billingProgram: "ccm" | "pcm" | "apcm",
  riskScore: number,                  // 0-100, computed by LLM
  riskScoreUpdatedAt: number,

  primaryNurseId: id<"users">,
  backupTeamId: id<"careTeams">?,
  portalUserId: id<"users">?,

  enrolledAt: number,
  consentObtainedAt: number,
  consentObtainedBy: id<"users">,
  consentRevokedAt: number?,

  status: "active" | "inactive" | "revoked" | "deceased",
  deletedAt: number?,
  createdAt: number, updatedAt: number,
}
.index("by_primary_nurse", ["primaryNurseId", "status"])
.index("by_tier", ["tier", "status"])
.index("by_practice", ["practiceId"])
.index("by_billing_program", ["billingProgram"])

carePlans: {
  patientId: id<"patients">,
  currentVersionId: id<"carePlanVersions">,
  createdAt: number, createdBy: id<"users">,
}
.index("by_patient", ["patientId"])

carePlanVersions: {
  carePlanId: id<"carePlans">,
  patientId: id<"patients">,           // denormalized for query convenience
  versionNumber: number,               // monotonic per carePlan
  content: object,                     // full snapshot JSON
  diffSummary: string,
  rationale: string,
  draftedAt: number, draftedBy: id<"users">,
  draftSource: "manual" | "ai_suggested" | "protocol_template",
  reviewStatus: "draft" | "pending_review" | "approved" | "rejected",
  approvedAt: number?, approvedBy: id<"users">?,
}
.index("by_carePlan", ["carePlanId", "versionNumber"])
.index("by_patient_recent", ["patientId", "draftedAt"])

encounters: {
  patientId: id<"patients">,
  nurseId: id<"users">,
  type: "phone_call" | "sms" | "portal_message" | "video" | "in_person" | "email" | "inbound_call",
  direction: "outbound" | "inbound",
  startedAt: number, endedAt: number?,
  durationSeconds: number,
  status: "completed" | "voicemail" | "no_answer" | "busy" | "wrong_number" | "declined" | "hung_up",
  topicTags: array<"refill" | "lab_followup" | "transitions_of_care" | "symptom_check" | "social" | "care_plan_review" | "other">,
  jotNotes: string?,
  transcriptId: id<"transcripts">?,
  soapNoteId: id<"soapNotes">?,
  serviceElementsTouched: array<number>,  // 1-11 for APCM
  createdAt: number,
}
.index("by_patient_recent", ["patientId", "startedAt"])
.index("by_nurse_and_date", ["nurseId", "startedAt"])
.index("by_status", ["status"])

soapNotes: {
  patientId: id<"patients">,
  encounterId: id<"encounters">,
  nurseId: id<"users">,
  subjective: string, objective: string, assessment: string, plan: string,
  status: "draft" | "pending_review" | "signed" | "amended",
  draftSource: "manual" | "ai_from_transcript" | "ai_from_notes",
  aiConfidenceScore: number?,        // 0-100, for auto-approve threshold
  signedAt: number?, signedBy: id<"users">?,
  amendedFromId: id<"soapNotes">?,
  draftedAt: number,
}
.index("by_patient", ["patientId"])
.index("by_encounter", ["encounterId"])
.index("by_status", ["status"])

transcripts: {
  encounterId: id<"encounters">,
  patientId: id<"patients">,
  audioStorageId: id<"_storage">,
  audioDurationSeconds: number,
  text: string,
  source: "whisper" | "manual",
  language: string,                   // "en-US"
  createdAt: number,
}
.index("by_encounter", ["encounterId"])

agentThreads: {
  userId: id<"users">,
  title: string,
  contextPatientId: id<"patients">?,
  createdAt: number, lastMessageAt: number,
}
.index("by_user_recent", ["userId", "lastMessageAt"])

agentMessages: {
  threadId: id<"agentThreads">,
  userId: id<"users">,
  role: "user" | "assistant" | "tool",
  content: string,
  toolCalls: array<{name: string, args: object, result: object?}>?,
  createdAt: number,
}
.index("by_thread", ["threadId", "createdAt"])

agentBriefings: {
  userId: id<"users">,
  date: string,                       // yyyy-mm-dd
  type: "morning" | "end_of_day",
  content: object,                    // {priorityQueue, kpis, headsUp, recap}
  generatedAt: number, viewedAt: number?,
}
.index("by_user_and_date", ["userId", "date", "type"])

notifications: {
  userId: id<"users">,
  patientId: id<"patients">?,
  type: "care_plan_pending" | "er_admission" | "overdue_touch" | "patient_revoked" | "consent_expiring" | "audit_flag" | "portal_message" | "drug_interaction" | "lab_trend",
  title: string, body: string,
  actionUrl: string?,
  read: boolean, readAt: number?,
  createdAt: number,
}
.index("by_user_unread", ["userId", "read"])
.index("by_user_recent", ["userId", "createdAt"])

medicalDocuments: {
  patientId: id<"patients">,
  type: "lab" | "imaging" | "discharge_summary" | "referral" | "admission_note" | "other",
  title: string,
  fileStorageId: id<"_storage">,
  uploadedAt: number, uploadedBy: id<"users">,
  sourceFacility: string?,
  parsedSummary: string?,
  tags: array<string>,
}
.index("by_patient", ["patientId"])
```

### 2.2 Tier 2: Minimum Viable Product important

```ts
timeLogs: {
  patientId: id<"patients">,
  nurseId: id<"users">,
  encounterId: id<"encounters">?,
  startTimestamp: number, endTimestamp: number,
  durationSeconds: number,
  activityType: "phone_call" | "chart_review" | "specialist_coord" | "care_plan_update" | "rx_management" | "family_call" | "documentation" | "other",
  activityDescription: string,
  billable: boolean,
  month: string,                      // yyyy-mm, denormalized
  loggedAt: number,                   // contemporaneous timestamp
}
.index("by_patient_and_month", ["patientId", "month"])
.index("by_nurse_and_month", ["nurseId", "month"])

billingRecords: {
  patientId: id<"patients">,
  primaryNurseId: id<"users">,
  practiceId: id<"practices">,
  month: string,                      // yyyy-mm
  billingProgram: "ccm" | "pcm" | "apcm",
  billingCodes: array<string>,        // ["99490"] or ["99490","99439"] or ["G0557"]
  timeLoggedMinutes: number?,         // CCM/PCM
  serviceElementsSatisfied: array<number>?,  // APCM (1-11)
  reimbursementCents: number,
  patientCostShareCents: number,
  status: "draft" | "ready_to_submit" | "submitted" | "paid" | "denied",
  submittedAt: number?, paidAt: number?,
  auditFlags: array<string>?,
}
.index("by_patient_and_month", ["patientId", "month"])
.index("by_status", ["status"])

serviceElements: {
  patientId: id<"patients">,
  month: string,                      // yyyy-mm
  elementId: number,                  // 1-11
  elementName: string,
  status: "not_yet" | "available" | "delivered",
  evidence: array<{type: "encounter" | "document" | "message" | "care_plan_update", id: string}>,
  lastUpdatedAt: number,
}
.index("by_patient_and_month", ["patientId", "month"])
```

### 2.3 Tier 3: Minimum Viable Product nice-to-have

```ts
portalMessages: {
  patientId: id<"patients">,
  senderType: "nurse" | "patient" | "system",
  senderId: id<"users">,
  content: string,
  sentAt: number, readAt: number?,
}
.index("by_patient_recent", ["patientId", "sentAt"])

outreachAttempts: {
  patientId: id<"patients">,
  scheduledByUserId: id<"users">?,
  scheduledByAgent: boolean,
  method: "call" | "sms" | "portal" | "email" | "mail",
  scheduledFor: number,
  bestWindowSuggestion: number?,
  status: "scheduled" | "in_progress" | "completed" | "failed",
  attemptNumber: number,
  resultEncounterId: id<"encounters">?,
}
.index("by_patient", ["patientId"])
.index("by_scheduled", ["scheduledFor"])

hospitalEvents: {
  patientId: id<"patients">,
  eventType: "admission" | "discharge" | "transfer",
  facility: string,
  eventDate: number,
  reason: string?,
  notified: boolean,
  notifiedAt: number?,
  transitionFollowupRequiredBy: number?,
}
.index("by_patient_recent", ["patientId", "eventDate"])
```

### 2.4 Tier 4: Future (drawn in Excalidraw, not Minimum Viable Product)

```ts
careTeams: {
  name: string,
  memberIds: array<id<"users">>,
  practiceId: id<"practices">,
}

practices: {
  name: string,
  npi: string,
  billingAddress: object,
  acoParticipation: "MSSP" | "REACH" | "MCP" | "PCF" | null,
}
```

### 2.5 Key design decisions

**Billing program as discriminator, not table split.** One `billingRecords` table with `billingProgram` field, not three parallel tables. Makes "show me all enrolled patients" trivial. Makes the transition from Chronic Care Management to Advanced Primary Care Management a single field update, not a data migration. Fields specific to one program (`timeLoggedMinutes` for Chronic Care Management/Principal Care Management, `serviceElementsSatisfied` for Advanced Primary Care Management) are nullable.

**Care plan versioning via full snapshots, not deltas.** Every revision stores the complete plan JSON. Diffs computed at read time. Care plans are small (under 10 kilobytes), audit history is trivial to render, no delta-replay complexity.

**Time logs decoupled from encounters.** A nurse spends 8 minutes reviewing a lab result without a patient call; that is billable time without an encounter. `timeLogs.encounterId` is nullable so off-call activities count toward the monthly minute total.

**Service elements as separate table.** One row per patient per month per element. Lets the dashboard query "patients with under 8 of 11 elements covered" in O(rows). If it were a JSON blob on the patient, this query would be slow.

**SOAP notes have AI confidence score.** Lets the system auto-approve high-confidence drafts (above 85%) and surface lower-confidence ones to the nurse for review. This is what makes documentation auto-draft save time at scale rather than just shifting work.

**Agent has memory.** `agentThreads` and `agentMessages` enable conversation continuity. `agentBriefings` is the persisted output of scheduled briefing generation. These are first-class entities, not bolt-ons.

**Soft delete everywhere.** Every table has `deletedAt: number?`. Healthcare data is regulated; hard deletes are forbidden under Health Insurance Portability and Accountability Act retention rules. Queries filter `deletedAt IS NULL` by default.

**Index by query pattern.** Every index corresponds to a real query the application runs. Indexes on `(nurseId, status)` for dashboard panel filtering, on `(patientId, month)` for billing rollups, on `(userId, read)` for notification inboxes.

---

## 3. Agent architecture

### 3.1 Pattern

The agent layer uses the OpenAI Agents SDK (`@openai/agents`). Sage is an `Agent` instance configured with instructions, Zod-typed tools, input guardrails, and a `ConvexSession` for memory. The SDK runs the tool-calling loop automatically; the application catches `MaxTurnsExceededError` to surface the Continue button. The loop executes inside a Convex Action (`runAgentTurn`), not a Vercel function. This matters: Convex Actions have 10-minute timeouts vs Vercel's 60s (Hobby) or 300s (Fluid Compute on Pro), so the loop never approaches a platform limit.

### 3.2 Run loop

```ts
// convex/actions/runAgentTurn.ts
"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { run, MaxTurnsExceededError } from "@openai/agents";
import { sage } from "./agent/sage";
import { ConvexSession } from "./agent/session";

export const runAgentTurn = action({
  args: { threadId: v.id("agentThreads"), userInput: v.string() },
  handler: async (ctx, { threadId, userInput }) => {
    const session = new ConvexSession(ctx, threadId);
    try {
      const result = await run(sage, userInput, { session, maxTurns: 4 });
      return { kind: "final", text: result.finalOutput };
    } catch (err) {
      if (err instanceof MaxTurnsExceededError) {
        // Persist run state for resumption; client renders "Continue" button.
        await ctx.runMutation(/* save pending state */);
        return { kind: "needs_continue" };
      }
      throw err;
    }
  },
});
```

Tool calls and assistant messages stream into `agentMessages` via the `ConvexSession` adapter as the loop progresses, so the right rail UI subscribed via `useQuery` re-renders incrementally without separate streaming infrastructure. No AI SDK UI streaming helpers needed; Convex reactivity is the streaming layer.

### 3.3 ConvexSession adapter

The Agents SDK exposes a `Session` interface for conversation memory. We implement it against `agentThreads` / `agentMessages` so history is queryable from Convex (audit story, dashboard filters, reactive UI) instead of living on OpenAI's servers via the Conversations API.

```ts
// convex/actions/agent/session.ts
import type { Session, RunItem } from "@openai/agents";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

export class ConvexSession implements Session {
  constructor(private ctx: ActionCtx, private threadId: Id<"agentThreads">) {}

  async getItems(): Promise<RunItem[]> {
    return await this.ctx.runQuery(internal.agent.messages.list, {
      threadId: this.threadId,
    });
  }

  async addItems(items: RunItem[]): Promise<void> {
    await this.ctx.runMutation(internal.agent.messages.append, {
      threadId: this.threadId,
      items,
    });
  }

  async clear(): Promise<void> {
    await this.ctx.runMutation(internal.agent.messages.clear, {
      threadId: this.threadId,
    });
  }
}
```

This satisfies the Convex performance guideline (one row per message, no unbounded arrays on a single document) and keeps the demo's tool-call visualization trivial: each tool call lands as its own `agentMessages` row with `role: "tool"`, the subscription pushes it to the client, the UI renders it inline.

### 3.4 Agent definition

```ts
// convex/actions/agent/sage.ts
import { Agent } from "@openai/agents";
import * as tools from "./tools";
import { noDirectPatientContact } from "./guardrails";

export const sage = new Agent({
  name: "Sage",
  model: "gpt-4o",
  instructions: ({ context }) => `
You are Sage, the operational assistant for the Chronic Care Management
nurse ${context.nurseName}. Surface the right patient at the right second,
draft documentation, and answer questions about their panel.

You are scoped to ${context.nurseName}'s assigned panel only. Output is
concise and operational. The nurse is mid-workday.

Today: ${context.date}. Panel size: ${context.panelSize}.
Today's priorities (from morning briefing): ${context.priorities}.
  `.trim(),
  tools: [
    tools.listPanel,
    tools.getPatient,
    tools.getPatientHistory,
    tools.getCarePlanHistory,
    tools.getOverdue,
    tools.getDueToday,
    tools.getMonthlyKPIs,
    tools.getServiceElementCoverage,
    tools.getRecentTranscripts,
    tools.draftSoapNote,
    tools.suggestCarePlanRevision,
    tools.draftPatientMessage,
    tools.scheduleOutreachAttempt,
  ],
  inputGuardrails: [noDirectPatientContact],
});
```

Hard constraints from PRD Flow 2 are now enforced two ways:
- **Scope (agent only sees the calling nurse's panel)**: every read tool resolves the calling user via `getAuthUserId(ctx)` inside its `execute` function, then filters by `primaryNurseId == userId`. The agent has no way to bypass this; there is no `nurseId` argument exposed.
- **No patient-directed actions**: enforced as a Zod-validated input guardrail (§3.6) that runs in parallel with the model and short-circuits the run if the nurse asks the agent to message a patient directly. More robust than prompt adherence.
- **Nurse approval for every write**: write tools return drafts (e.g., `draftSoapNote` returns a `soapNote` row with status `"draft"`). The Apply button on the inline action card triggers a separate `applyX` mutation that flips status to `"signed"`. The agent never calls `applyX` directly.

### 3.5 Tool definitions (Zod)

Tools are defined with the SDK's `tool()` helper and Zod schemas. The SDK generates the JSON Schema for the model automatically. Sample:

```ts
// convex/actions/agent/tools.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { api } from "../../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listPanel = tool({
  name: "listPanel",
  description: "List patients in the calling nurse's panel, with filters.",
  parameters: z.object({
    tier: z.enum(["level_1", "level_2", "level_3"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    overdue: z.boolean().optional(),
    dueWithin: z.enum(["today", "this_week", "this_month"]).optional(),
    sortBy: z.enum(["urgency", "name", "last_touched"]).default("urgency"),
    limit: z.number().default(25),
  }),
  execute: async (input, runContext) => {
    const ctx = runContext.context.convexCtx;
    const nurseId = await getAuthUserId(ctx);
    if (!nurseId) throw new Error("Not authenticated");
    return await ctx.runQuery(api.queries.panels.list, { nurseId, ...input });
  },
});
```

The full tool registry (read, write, action categories matching PRD Flow 2) lives in `convex/actions/agent/tools.ts`. Write tools (`draftSoapNote`, `suggestCarePlanRevision`, `draftPatientMessage`, `scheduleOutreachAttempt`) call internal mutations that create draft rows; the corresponding `applyX` mutations are not tools, they are app-level mutations triggered by the Apply button.

### 3.6 Input guardrails

```ts
// convex/actions/agent/guardrails.ts
import { defineInputGuardrail } from "@openai/agents";
import { z } from "zod";

export const noDirectPatientContact = defineInputGuardrail({
  name: "no_direct_patient_contact",
  description: "Block any request that asks the agent to message a patient without nurse review.",
  execute: async ({ input }) => {
    const lower = input.toLowerCase();
    const tripwires = [
      /\b(text|message|email|call)\s+(the\s+)?patient\b/,
      /\bsend\s+(this\s+)?to\s+(the\s+)?patient\b/,
      /\bnotify\s+(the\s+)?patient\b/,
    ];
    if (tripwires.some((r) => r.test(lower))) {
      return {
        tripwireTriggered: true,
        outputInfo: { reason: "Agent cannot contact patients directly. Use draftPatientMessage and review before sending." },
      };
    }
    return { tripwireTriggered: false };
  },
});
```

Guardrails run in parallel with the model and fail fast. A tripped guardrail short-circuits the run and the action returns `{ kind: "guardrail_blocked", reason }` to the client, which renders the reason inline in the right rail.

### 3.7 Tracing

The Agents SDK has built-in tracing that uploads run traces to OpenAI's dashboard. Useful in development for debugging tool calls and reasoning. **Disabled in production for HIPAA**: set `OPENAI_AGENTS_DISABLE_TRACING=1` in the production Convex environment. Dev deployment keeps it on.

### 3.8 Scheduled briefing generation

The Morning Briefing is a Convex scheduled function that runs at 6:00 AM in the practice's local timezone for each active nurse. It uses the same `runAgentTurn` machinery but with a dedicated `briefingAgent` (separate `Agent` instance with a briefing-focused system prompt and a narrower tool set: only the read tools).

```ts
// convex/scheduled/morningBriefing.ts
import { internalAction } from "../_generated/server";
import { run } from "@openai/agents";
import { briefingAgent } from "../actions/agent/briefing";

export const generateForNurse = internalAction({
  args: { nurseId: v.id("users"), date: v.string() },
  handler: async (ctx, { nurseId, date }) => {
    // Briefing runs without a session (no prior conversation context needed).
    const result = await run(
      briefingAgent,
      `Generate today's morning briefing for nurse ${nurseId} on ${date}.`,
      { maxTurns: 8, context: { ctx, nurseId, date } }
    );
    await ctx.runMutation(internal.briefings.save, {
      userId: nurseId, date, type: "morning", content: result.finalOutput,
    });
  },
});
```

End-of-Day Wrap is the same shape, triggered on logout or at 6:00 PM.

### 3.9 Future state (drawn in Excalidraw, not built)

- **Multi-agent handoffs**: split Sage into a triage agent that hands off to specialists (panel-query, SOAP-drafting, care-plan-revision, billing-audit) via the Agents SDK `handoffs` mechanism. Improves answer quality and reduces tool-bloat per agent.
- **RealtimeAgent for live nurse-coach**: replace the post-call MediaRecorder → Whisper → GPT path (Flow 4) with `RealtimeSession` for live in-call coaching, surfacing relevant patient history and suggested questions in real time. Bigger build, separate workstream.
- **MCP server in front of Convex**: expose a subset of Convex queries as a Streamable HTTP MCP server (`MCPServerStreamableHttp`) so external agents (Claude Desktop, Cursor, etc.) can reason over the panel during clinical review.

---

## 4. System architecture

### 4.1 Diagram (logical, drawn in Excalidraw)

```
[Patient browser]                  [Nurse browser]
       |                                  |
       v                                  v
   Vercel (NextJS App Router)
       |                |
       v                v
  Convex Cloud      Convex Cloud
  (queries)         (mutations + actions)
       |                |
       v                v
  Convex DB         Convex Actions
  Convex File       (longer timeouts)
  Storage                |
                         v
                  OpenAI API (GPT-4o, Whisper)
                  Twilio (future)
                  ADT feed (future)
```

Primary stack labels above. Alternative-stack annotations on each node (Vercel can be AWS EC2 + ALB, Convex DB can be AWS RDS, Convex File Storage can be AWS S3, Convex Actions can be AWS Lambda).

### 4.2 Request flow examples

**Nurse loads the dashboard:**

1. Browser requests `/dashboard`
2. NextJS server component on Vercel renders shell
3. Client mounts, calls `usePaginatedQuery(api.queries.panels.list, { nurseId: derivedServerSide }, { initialNumItems: 50 })`
4. Convex returns the first page of 50 patients via `paginationOptsValidator` + `.paginate(args.paginationOpts)`
5. UI renders with skeleton then fills; "Load more" appends pages
6. Real-time subscription stays open; if any patient row in the current page updates server-side, UI re-renders. Score-only updates for Maria (demo patient) are visible immediately on the relevant row

**Nurse asks the agent a question:**

1. Nurse types in right rail, submits
2. Client appends user message to `agentMessages` via mutation, then calls `useAction(api.actions.runAgentTurn, { threadId, userInput })`
3. Convex Action constructs `ConvexSession(ctx, threadId)`, calls `run(sage, userInput, { session, maxTurns: 4 })`
4. SDK runs the agent loop. Tool calls go through `tool.execute(...)`, which run Convex queries via `ctx.runQuery`. Each tool call and its result are written to `agentMessages` by the `ConvexSession.addItems` adapter as the loop progresses
5. Client subscription on `agentMessages` re-renders the right rail incrementally as new rows arrive (tool name → arguments → result count → final assistant message)
6. If the loop hits `maxTurns: 4`, Action catches `MaxTurnsExceededError`, persists pending state, returns `{ kind: "needs_continue" }`. Right rail renders a Continue button. Click resumes the run with the persisted state
7. If an input guardrail trips, Action returns `{ kind: "guardrail_blocked", reason }`, rendered inline

**Nurse records a call:**

1. Nurse clicks microphone on patient detail page
2. Browser MediaRecorder captures audio chunks
3. Nurse clicks stop
4. Audio uploads to Convex File Storage, returns storageId
5. Client calls `useAction(transcribeAudio, { storageId })`
6. Action calls Whisper API with the audio file
7. Whisper returns transcript text
8. Action saves to `transcripts`
9. Client calls `useAction(draftSoapNote, { transcriptId })`
10. Action calls GPT-4o with transcript + patient context, returns structured SOAP
11. Action saves to `soapNotes` with status "draft"
12. Modal renders, nurse reviews, edits, clicks "Sign and save"
13. Mutation transactionally writes: encounter, timeLog, soapNote (signed), carePlanVersion if deltas approved

### 4.3 Authentication

Convex Auth (`@convex-dev/auth`). The auth component owns the `users` table and issues JWTs validated on every Convex function call. Sign-in supports email + one-time code (the primary flow for the nurse and patient portals) and password (fallback). The auth component is configured in `convex/auth.config.ts`; provider wiring lives in `convex/auth.ts`.

Client wiring uses `<ConvexAuthNextjsProvider>` (Next.js adapter) which combines Convex's `ConvexProviderWithAuth` with the auth component's session management. The provider exposes `useAuthActions()` (signIn/signOut) and Convex's standard `useQuery`/`useMutation`/`useAction` hooks pick up the JWT automatically.

**Critical rule, enforced everywhere:** functions never accept a `userId` argument for authorization. The calling identity is always derived server-side:

```ts
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.query("patients")
      .withIndex("by_primary_nurse", q => q.eq("primaryNurseId", userId).eq("status", "active"))
      .paginate(args.paginationOpts);
  },
});
```

Roles enforced at the query layer (every function reads the role overlay from the calling user's row):
- Nurse role can read patients where `primaryNurseId == userId`
- Patient role can read their own patient record only (via `patients.portalUserId == userId`)
- Admin role can read all patients (admin functions check `user.role === "admin"` explicitly)

For any auth-linked database lookup that crosses the auth boundary (e.g., webhooks, service-to-service), prefer `identity.tokenIdentifier` over `identity.subject` per the Convex auth guideline. `getAuthUserId(ctx)` returns the `Id<"users">` directly, which is what every internal function should use.

### 4.4 Real-time updates

Convex's reactive queries push updates to subscribed clients automatically. When a mutation writes to a table that a query depends on, the query re-runs and the client UI re-renders. This is how the dashboard updates in real time when a new encounter is logged, when a risk score changes, when a notification arrives.

### 4.5 File storage flow

1. Client uploads file (audio recording, medical document scan) via Convex File Storage upload URL
2. Convex returns a storage ID
3. Application code stores the storage ID in the relevant table (`transcripts.audioStorageId`, `medicalDocuments.fileStorageId`)
4. Reads use `ctx.storage.getUrl(storageId)` to get a signed URL valid for short duration

### 4.6 Performance budget

- Dashboard cold load: under 500ms (NextJS RSC + Convex pre-fetch)
- Patient detail cold load: under 800ms
- Convex query response: under 100ms for indexed queries, under 300ms for complex aggregates
- OpenAI GPT-4o response: 2-8 seconds depending on prompt size
- Whisper transcription: 1 second per 10 seconds of audio
- Mutation latency: under 200ms

---

## 5. Security and compliance

### 5.1 Minimum Viable Product baseline

- Auth: Convex Auth handles password, email + one-time code, JWT issuance and validation. No external auth provider; one less third party in the trust chain
- Network: HTTPS everywhere (Vercel default), Convex client-server TLS
- Data at rest: Convex encrypts by default
- Data in transit: TLS
- Role-based access at query layer, enforced via `getAuthUserId(ctx)` in every function. No `userId` accepted as a function argument
- Audit-trail attributable writes (every mutation derives the calling user server-side)
- Agent input guardrails (Zod-validated, run in parallel with the model) block patient-directed actions before they reach the model

### 5.2 Production additions (not in Minimum Viable Product, mentioned for completeness)

- Application-level encryption of `medicareId` field (defense in depth)
- Business Associate Agreement signed with Convex and OpenAI
- Audit log of every read access to a patient record (separate `accessLog` table)
- Detailed role definitions: nurse, physician, admin, patient, billing_admin, auditor (read-only)
- Multi-factor authentication required for staff roles (Convex Auth supports TOTP and WebAuthn)
- `OPENAI_AGENTS_DISABLE_TRACING=1` set in production Convex environment (no agent traces uploaded to OpenAI dashboard)
- Session timeout after 15 minutes of inactivity
- Practice-level data isolation (multi-tenancy) enforced at query layer
- Penetration testing prior to first patient-facing deployment
- Health Insurance Portability and Accountability Act compliance documentation
- State-by-state medical record retention rules honored (typically 7 years post-deceased)

### 5.3 Health Insurance Portability and Accountability Act considerations

- Protected Health Information at rest is encrypted (Convex default)
- Access is logged and attributable
- Retention rules: soft-delete only, never hard-delete patient records
- Patient right of access (HIPAA): patient portal exposes their own records
- Patient right of amendment: portal-based amendment requests routed to nurse for review
- Breach notification: Sentry + manual review process documented separately

### 5.4 Centers for Medicare and Medicaid Services compliance hooks

- Consent record per patient, immutable, signed timestamp
- Billing program designation, immutable history (audit-readable)
- Time logs contemporaneously recorded (loggedAt timestamp is server-side, not client)
- Care plan version history immutable (new versions create rows, never edit existing)
- Service-element row table provides audit-ready attestation for Advanced Primary Care Management

---

## 6. Deployment topology

### 6.1 Minimum Viable Product

- **Vercel project**: connected to GitHub repo, automatic deploys on push to main
- **Vercel preview deployments**: per pull request
- **Convex deployment**: linked to Vercel via environment variables. `npx convex dev` writes `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_SITE_URL`, and `NEXT_PUBLIC_CONVEX_URL` automatically. Production deploy uses `CONVEX_DEPLOY_KEY`
- **Convex dev deployment**: `dev:earnest-manatee-639` for local development
- **Convex production deployment**: linked to Vercel production environment
- **OpenAI API key**: lives in the Convex environment (`npx convex env set OPENAI_API_KEY ...`), accessed by Convex Actions via `process.env.OPENAI_API_KEY`. Never exposed to the Next.js client or Vercel function runtime
- **Convex Auth secrets**: `JWT_PRIVATE_KEY` and `JWKS` set in Convex environment per `@convex-dev/auth` setup
- **Agent loop placement**: runs entirely in Convex Actions. Vercel functions never invoke OpenAI. This sidesteps the Vercel function timeout (60s Hobby, 300s Pro with Fluid Compute) since Convex Actions allow 10 minutes

### 6.2 Environments

- Local dev: `npx convex dev` + `next dev`
- Preview: PR-triggered Vercel + Convex preview deployment
- Production: main branch → Vercel production + Convex production

### 6.3 Monitoring

- **Vercel Analytics**: traffic, performance
- **Convex logs**: query/mutation/action execution, errors
- **Convex insights**: `npx convex insights --details` for read amplification, OCC conflicts, subscription cost, function budget. Run periodically during the build; this is how we verify the performance budgets in §4.6 are actually met
- **Convex dashboard**: real-time function metrics, deployment health
- **Sentry**: client and server error tracking
- **OpenAI Agents tracing**: enabled in dev, disabled in production (HIPAA)
- **PostHog** (optional): product analytics, feature usage

---

## 7. Code organization

Sibling layout: Convex backend and Next.js app live as separate packages under `app/`. This is the Convex-recommended monorepo-style layout.

```
app/                                  # repo root
├── .env.local                        # CONVEX_DEPLOYMENT, CONVEX_URL, NEXT_PUBLIC_CONVEX_URL
├── convex/                           # Convex backend
│   ├── schema.ts                     # tables + indexes (Convex Auth's authTables + overlay)
│   ├── auth.config.ts                # Convex Auth provider config
│   ├── auth.ts                       # Convex Auth wiring (signIn/signOut, providers)
│   ├── http.ts                       # httpRouter + httpAction for any webhooks
│   ├── queries/                      # query functions per domain
│   │   ├── panels.ts
│   │   ├── patients.ts
│   │   ├── carePlans.ts
│   │   └── ...
│   ├── mutations/                    # mutation functions
│   ├── actions/                      # actions (OpenAI calls, file ops)
│   │   ├── runAgentTurn.ts           # top-level agent action
│   │   ├── transcribeAudio.ts        # Whisper one-shot
│   │   └── agent/
│   │       ├── sage.ts               # Agent definition
│   │       ├── briefing.ts           # briefingAgent
│   │       ├── tools.ts              # Zod-typed tool registry
│   │       ├── guardrails.ts         # input guardrails
│   │       └── session.ts            # ConvexSession adapter
│   ├── scheduled/                    # cron functions
│   │   ├── morningBriefing.ts
│   │   ├── endOfDayWrap.ts
│   │   └── riskRecompute.ts
│   └── _generated/                   # Convex codegen, do not edit
├── foresight/                        # Next.js 16 app (separate package)
│   ├── app/                          # App Router
│   │   ├── layout.tsx                # ConvexAuthNextjsProvider, ConvexClientProvider
│   │   ├── globals.css               # Tailwind 4 @theme block (brand colors, animations)
│   │   ├── (nurse)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── patient/[id]/page.tsx
│   │   │   └── layout.tsx            # nurse-scoped layout with right rail
│   │   ├── (patient)/
│   │   │   └── portal/page.tsx
│   │   ├── admin/page.tsx
│   │   └── login/page.tsx
│   ├── components/
│   │   ├── ui/                       # primitives (button, input, card)
│   │   ├── glass/                    # liquid glass primitives
│   │   ├── agent/                    # right rail components
│   │   ├── dashboard/                # dashboard widgets
│   │   ├── patient/                  # patient detail components
│   │   └── carePlan/                 # care plan editor + diff viewer
│   ├── lib/
│   │   ├── audio/                    # MediaRecorder helpers (browser-side)
│   │   └── utils/
│   ├── next.config.mjs
│   ├── package.json                  # next 16, react 19, tailwind 4
│   └── public/
├── docs/                             # offline reference docs (not shipped)
│   ├── vercel-full.md
│   └── openai-agents-js-full.md
└── .agents/skills/                   # Convex agent skills (build-time guidance)
```

Note: Tailwind 4 is CSS-first. There is no `tailwind.config.ts`. The theme (brand colors, blur values, animation keyframes) lives in `foresight/app/globals.css` inside an `@theme { ... }` block.

Note: any webhooks (Stripe future-state, ADT feeds) register inside `convex/http.ts` via `httpRouter` + `httpAction`, not as Next.js API routes. There are no `app/api/*` routes in the MVP because Convex Auth handles sign-in flows directly.

---

## 8. Open production notes

- Multi-tenant practice isolation
- Comprehensive role-based access control beyond the 3 roles in Minimum Viable Product
- Real claims submission via clearinghouse
- Hospital event feed (Admission, Discharge, Transfer) ingestion via Health Level Seven International or Fast Healthcare Interoperability Resources
- Electronic medical record bidirectional sync (Epic, eClinicalWorks, Athena) via Fast Healthcare Interoperability Resources R4 endpoints
- Quality measure reporting submission to Centers for Medicare and Medicaid Services
- Audit log of all read access
- Application-level encryption of medicareId and other sensitive personal health information fields
- Penetration testing and Health Insurance Portability and Accountability Act compliance audit
- State-level retention policy automation
- Patient consent re-collection workflow when billing physician changes
- Concurrent-code conflict resolution (preventing Advanced Primary Care Management + Chronic Care Management/Principal Care Management/Transitional Care Management in same month)
- Schema migrations via `@convex-dev/migrations` component using the widen-migrate-narrow pattern. Required for any breaking change to `patients`, `carePlans`, or `billingRecords` post-launch
- Extract `patients.riskScore` and `riskScoreUpdatedAt` into a dedicated `patientRiskScores` table once panel size or write rate justifies it. The MVP keeps these fields on `patients` for simplicity (50-100 demo patients, near-zero contention); at scale, frequently-updated score writes invalidate every reactive subscription reading the patient row, so isolating them becomes important
- Splitting Sage into a triage agent + specialists via Agents SDK handoffs (panel-query, SOAP-drafting, care-plan-revision, billing-audit)
- RealtimeAgent for in-call nurse coaching (replaces Flow 4's post-call path)
- MCP server in front of Convex queries to expose the panel to external agents

---

## Companion docs

- **CCM_Plan.md**: operational plan for Chronic Care Management
- **APCM_Plan.md**: operational plan for Advanced Primary Care Management transition
- **PRD.md**: product requirements for the 6 Minimum Viable Product flows
- **UIUX_Spec.md**: visual design specifications
- **design/Excalidraw_Specs.md**: diagram text specifications
