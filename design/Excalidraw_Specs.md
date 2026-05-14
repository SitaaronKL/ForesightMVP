# Excalidraw Diagram Specifications

**Author:** Dhruv Lalwani
**Prepared for:** Foresight Health interview (Tienlan Sun)
**Date:** May 14, 2026
**Purpose:** Text specifications for all ten diagrams in the interview deck. Designed so Dhruv can draw them fluently in Excalidraw.

---

## General drawing conventions

**Color palette (use Excalidraw's color picker):**
- Navy primary: `#0B3B5C` (boxes for system layer, main process nodes)
- Teal accent: `#34D1BF` (success paths, AI-driven nodes)
- Coral: `#D8504C` (failure paths, friction points, risks)
- Amber: `#E5A03C` (warnings, transitions, conditional flows)
- Gray: `#647084` (neutral nodes, infrastructure)
- White/light fill: `#F8FBFD` (default node background)

**Text rules:**
- Node labels: short, 2-5 words
- Annotations: italic, smaller, gray
- Use bold inside boxes for important nouns
- Dual-track convention: `Primary (alt: Alternative)` in parentheses on every system architecture node

**Arrow rules:**
- Solid arrows: synchronous, blocking flow
- Dashed arrows: asynchronous, non-blocking flow
- Bold thick arrows: primary critical path
- Thin arrows: secondary or optional path

**Layout rules:**
- Left-to-right for time-ordered flows
- Top-to-bottom for hierarchy/architecture
- Group related nodes inside a translucent rectangle with a section title at the top
- Leave generous whitespace (avoid Excalidraw's cramped default)

---

## Diagram 1: Patient Journey, Chronic Care Management and Principal Care Management Today (the "before")

**Purpose:** Anchor the problem space at the start of the interview. Show the four-stage flow with operational friction visible at each stage.

**Layout:** Horizontal left-to-right, single swimlane.

**Nodes (in order):**

1. **Stage 1: Eligibility** (navy box)
   - Sub-nodes inside: "2+ chronic conditions verified," "Initiating visit within 12 months," "Medicare enrolled"
   - Friction annotation (coral): "Often: incomplete conditions list, stale visit, manual check"

2. **Stage 2: Consent** (navy box)
   - Sub-nodes: "Verbal or written," "Disclosures: right to revoke + coinsurance + single practitioner," "Documented in chart"
   - Friction annotation (coral): "Often: undocumented, generic, missing disclosures, lost when billing physician changes"

3. **Stage 3: Care** (navy box, LARGEST, with emphasis)
   - Sub-nodes: "Monthly nurse call (~20 min)," "Documentation," "Specialist coordination," "Care plan updates," "Refill management," "Family calls"
   - Stopwatch icon next to "Monthly nurse call (~20 min)" with annotation: "Stopwatch contemporaneous to-the-minute"
   - Friction annotations (coral):
     - "30% unreachable, voicemail loops"
     - "Documentation drag: 10-15 min per encounter"
     - "Care plan goes stale between annual reviews"
     - "Audit risk on round-number minutes"

4. **Stage 4: Billing** (navy box)
   - Sub-nodes: "Submit claim (99490 ± 99439s, or 99491, or 99487 complex)," "Patient owes 20% Part B coinsurance ($13/mo)"
   - Friction annotation (coral): "Coinsurance attrition: ~half of patients without supplemental insurance revoke after first bill"

**Top annotation banner (above the swim lane):**
"Practical ceiling: 300 patients per nurse. Math breaks at hour 200 of monthly effort. Constraint is structural, not nurse capability."

**Bottom annotation banner:**
"Source: CMS 2026 Physician Fee Schedule, AAFP, MGMA, Glassdoor reviews of CCM vendors, JGIM 2019 qualitative study, AHRQ documentation burden brief."

---

## Diagram 2: Patient Journey, Advanced Primary Care Management Tomorrow (the "after")

**Purpose:** Show the regulatory unlock. Same four-stage flow but with the operational friction systematically removed.

**Layout:** Same horizontal swim lane as Diagram 1, mirrored format so they can be shown side by side.

**Nodes (in order):**

1. **Stage 1: Eligibility** (navy box)
   - Sub-nodes: "Tier assignment automatic (Level 1, 2, 3)," "Established primary care relationship," "Initiating visit within 3 years (more permissive)," "QMB status checked for Level 3 routing"
   - Improvement annotation (teal): "Eligibility computed continuously from chart, not manually checked"

2. **Stage 2: Consent** (navy box)
   - Sub-nodes: "One-time consent (not monthly)," "Cost calculator personalized to supplemental coverage," "Electronic signature audit-ready"
   - Improvement annotation (teal): "Cost-share clarity at consent suppresses post-bill revocation"

3. **Stage 3: Care** (navy box, LARGEST, emphasis on AI compounding)
   - Sub-nodes for the eleven service elements:
     - "24/7 access"
     - "Continuity with designated team member"
     - "Comprehensive care management"
     - "Patient-centered care plan"
     - "Care transitions management"
     - "Practitioner, home, community coordination"
     - "Enhanced async communication (portal, SMS, IVR)"
     - "Population-level management"
     - "Performance measurement"
   - NO stopwatch icon. Replace with: "Service-element capability attestation"
   - Tier-stratified delivery annotations (teal):
     - "Level 1: light-touch automation"
     - "Level 2: standard 20-min monthly call"
     - "Level 3: extended hands-on (QMB exempt from cost-share)"
   - AI multiplier annotations (teal, smaller, inside the box):
     - "Agent drafts documentation"
     - "Agent assembles morning briefing"
     - "Agent surfaces population gaps"

4. **Stage 4: Billing** (navy box)
   - Sub-nodes: "G0556 / G0557 / G0558 by tier," "Service-element evidence auto-assembled," "Level 3 = $0 patient cost-share (QMB)"
   - Improvement annotation (teal): "Audit packet = query, not separate effort"

**Top annotation banner (above the swim lane):**
"Practical ceiling: 500+ patients per nurse. Regulatory unlock (no time clock) compounds with AI unlock (operational compression)."

**Bottom annotation banner:**
"Source: CMS 2025 Physician Fee Schedule Final Rule (CMS-1807-F), 2026 Final Rule (CMS-1832-F), AAFP, NACHC."

**Visual contrast tip:** Place Diagram 1 and Diagram 2 vertically stacked or side-by-side so the eye can compare. The friction-annotation coral in Diagram 1 disappears in Diagram 2, replaced by teal improvements.

---

## Diagram 3: Nurse Screen Architecture (Sitemap)

**Purpose:** Show what's been built. The user-facing surface map.

**Layout:** Tree structure, top-to-bottom with main flows as branches.

**Root node:** "Foresight Care Operating System" (navy, top center)

**Branch 1 (left): Auth**
- "Login" → "Email or phone + OTP"

**Branch 2 (center): Nurse application**
- "Dashboard" (navy, large)
  - "KPI strip"
  - "Today's queue (agent-prioritized)"
  - "Full panel (sorted, filterable)"
- "Patient Detail" (navy, large)
  - Tabs:
    - "Overview"
    - "Care Plan (with diff history)"
    - "Encounters"
    - "Documents"
    - "Service Elements"
    - "Messages"
- "Voice-to-SOAP Modal" (navy)
  - "Record → Whisper → GPT-4 draft → Sign"

**Branch 3 (right): Patient portal**
- "My Care Plan (plain English)"
- "Monthly Statements"
- "Messages with nurse"

**Branch 4 (far right): Admin**
- "Patients CRUD"
- "Nurses CRUD"
- "Seed Data Generator"
- "System Triggers (recompute risk scores, etc.)"

**Persistent overlay across nurse application (teal, floating on right):**
"Master Agent Right Rail (LiquidGlass)"
- "Morning Briefing on login"
- "Natural-language panel queries"
- "Action cards (Apply / Edit / Dismiss)"
- "Voice input"
- "End-of-Day Wrap on logout"
- Annotation: "Persistent across screens; context shifts to current patient when on patient detail"

---

## Diagram 4: System Architecture (Dual-Track)

**Purpose:** The technical credibility diagram. Shows the stack with primary choice + alternative on every node.

**Layout:** Top-to-bottom layered, with two side-by-side user types at the top.

**Top tier (clients):**
- "Patient browser" (gray box, left)
- "Nurse browser" (navy box, right)

**Tier 2 (hosting):**
- "Vercel (alt: AWS EC2 + ALB)" (navy box, spans full width)

**Tier 3 (application):**
- "NextJS 14+ App Router" (navy box, full width)
  - Annotation below: "Server components, streaming, edge cached static"

**Tier 4 (backend layer):**
Three side-by-side columns:
- **Left: "Convex Queries (alt: AWS RDS via Postgres + Prisma)"**
  - Sub: "Reactive subscriptions, indexed reads"
- **Center: "Convex Mutations + Actions (alt: AWS Lambda + API Gateway)"**
  - Sub: "Mutations: short transactional writes"
  - Sub: "Actions: longer-running, can call external APIs"
- **Right: "Convex Scheduled Functions (alt: AWS EventBridge + Lambda)"**
  - Sub: "Morning Briefing 6am"
  - Sub: "End-of-Day Wrap 6pm"
  - Sub: "Risk score nightly batch"

**Tier 5 (storage):**
Two columns:
- **Left: "Convex DB (alt: AWS RDS Postgres)"**
  - Sub: "TypeScript schema in convex/schema.ts"
- **Right: "Convex File Storage (alt: AWS S3)"**
  - Sub: "Audio recordings, medical documents, audit PDFs"

**Tier 6 (auth):**
- "Clerk + Convex (alt: AWS Cognito)" (navy box, full width)

**Tier 7 (external services, off to the right):**
- "OpenAI API: GPT-4o, GPT-4o-mini, Whisper" (teal box)
- "Twilio (future)" (gray box, dashed border)
- "ADT feed (future)" (gray box, dashed border)
- "FHIR R4 endpoints (future)" (gray box, dashed border)

**Arrows:**
- Clients → Vercel (solid bold)
- Vercel → NextJS (solid bold)
- NextJS → Convex Queries / Mutations / Actions (solid bold)
- NextJS → External services (dashed teal, labeled "via Convex Actions")
- Convex Actions → OpenAI (solid teal)
- Convex Actions → Twilio (dashed, labeled "future")

**Side annotation (right of the diagram):**
"Why Convex over AWS for the MVP:
- Single platform, single mental model
- Realtime subscriptions out of the box (critical for the nurse dashboard)
- TypeScript schema = type-safe queries end-to-end
- No DevOps overhead
- Migration path to AWS exists if needed (Convex provides exports)
The alternatives shown are not rejected forever; they're the natural Series A scale-up."

---

## Diagram 5: Monthly Care Cycle for a Single Level 2 Patient

**Purpose:** Directly answers Tienlan's "focusing on the care piece" question. Shows what happens for one patient across one month.

**Layout:** Horizontal timeline, with a vertical lane per actor.

**Lanes (top to bottom):**
1. "System (Convex + cron)"
2. "Agent (LLM-driven)"
3. "Nurse (Sarah)"
4. "Patient (Maria, Level 2)"

**Timeline (days 1-30 of the month, left to right):**

**Day 1, midnight:**
- System lane: "Nightly risk score recompute runs" (gray)

**Day 1, 6:00am:**
- Agent lane: "Generates Morning Briefing for Sarah" (teal)
- Agent lane: "Maria appears in today's queue (priority 5)" (teal)

**Day 1, 9:00am:**
- Nurse lane: "Sarah logs in, sees Maria in briefing" (navy)

**Day 5:**
- Patient lane: "Maria receives SMS appointment reminder" (gray, automated)

**Day 7:**
- Patient lane: "Maria pays a portal visit, reads her care plan summary" (gray)

**Day 12, 10:30am:**
- Nurse lane: "Sarah opens Maria's chart, pre-call context auto-loads" (navy)
- Nurse lane: "Sarah dials Maria" (navy)
- Patient lane: "Maria answers, 22-minute conversation" (gray)
- Nurse lane: "Sarah hits microphone, records call" (navy)

**Day 12, 10:55am:**
- Agent lane: "Whisper transcribes (2 sec)" (teal)
- Agent lane: "GPT-4 drafts SOAP note + time log + care plan delta (8 sec)" (teal)
- Nurse lane: "Sarah reviews and signs the draft in 90 seconds" (navy)

**Day 12, 11:00am:**
- System lane: "Encounter, SOAP, time log, care plan version all written transactionally" (gray)
- System lane: "Risk score recomputes for Maria (demo patient: on-write trigger)" (gray)
- System lane: "Service element 'comprehensive care management' marked delivered for this month" (gray)

**Day 18:**
- Patient lane: "Maria messages via portal: 'How do I take this new medication?'" (gray)
- Nurse lane: "Sarah sees notification, agent drafts response, Sarah reviews and sends" (navy + teal)

**Day 22:**
- Patient lane: "Maria has lab results uploaded by primary care" (gray)
- System lane: "Hospital event feed (or document upload) creates medical document row" (gray)
- Agent lane: "Detects lab result, surfaces in dashboard as 'lab follow-up needed'" (teal)

**Day 25:**
- Nurse lane: "Sarah calls Maria to explain lab results (5-minute supplemental encounter)" (navy)
- Nurse lane: "Time log auto-logged from encounter" (navy)

**Day 30, 6:00pm:**
- Agent lane: "End-of-Day Wrap generated for Sarah" (teal)
- Agent lane: "Service-element coverage for Maria: 9 of 11 delivered, 2 available (24/7 access, performance measurement)" (teal)

**Month-end automation:**
- System lane: "Billing record draft created for Maria: G0557 Level 2, 11 elements attested, $54 reimbursement, $11 patient share" (gray)
- Nurse lane: "Sarah reviews and approves" (navy)

**Annotations along the bottom:**
"Total Sarah time on Maria this month: 32 minutes (22 call + 5 lab call + 5 documentation review)"
"Without the agent: ~60 minutes (15 min documentation per encounter + chart review)"
"The 28-minute saving per patient, multiplied by 500 patients, is the panel-size unlock."

---

## Diagram 6: Inside a Single Nurse Call (Anatomy of 22 Minutes)

**Purpose:** Zoom into the call itself. Show what happens minute-by-minute, where the agent helps, where the nurse leads, where the patient experience is preserved.

**Layout:** Horizontal timeline, three lanes top-to-bottom.

**Lanes:**
1. "Pre-call (T minus 5 to T 0)"
2. "Call itself (T 0 to T 22)"
3. "Post-call (T 22 to T 25)"

**Pre-call (5 minutes):**
- "Sarah opens Maria's chart on dashboard click"
- "Pre-call context auto-loads:"
  - "Last 3 encounters summary"
  - "Recent labs (A1c 7.8, BP 145/90)"
  - "Current medications + last refill dates"
  - "Active care plan goals"
  - "Upcoming appointments"
  - "Recent hospital events"
- Annotation (teal): "Agent has pre-fetched this. Saves 5-10 minutes of manual chart review."

**Call (22 minutes):**
- Minute 0-2: "Greeting, build rapport, check how she's feeling" (nurse leads, agent silent)
- Minute 2-5: "Symptom check: any new concerns since last call" (nurse leads, agent listens via transcription)
- Minute 5-9: "Review medication adherence, ask about side effects" (nurse leads)
- Minute 9-13: "Coordination items: refill needed, specialist referral, schedule follow-up" (nurse leads)
- Minute 13-18: "Care plan review with Maria, confirm goals, adjust if needed" (nurse leads)
- Minute 18-21: "Education and self-management coaching (lifestyle, monitoring)" (nurse leads)
- Minute 21-22: "Wrap, confirm next contact, end call" (nurse leads)

Annotation across the call lane:
"Agent's role during the call: SILENT. Transcribing in the background. Does not interrupt. Does not coach Sarah. Patient-nurse relationship is the irreducible human core."

**Post-call (3 minutes):**
- Minute 22-23: "Sarah hits stop on microphone. Audio uploads."
- Minute 23-24: "Whisper transcribes. GPT-4 drafts: SOAP note + time log + care plan deltas"
- Minute 24-25: "Sarah reviews on screen, edits 10%, clicks 'Sign and save'"
- System action: "Encounter, SOAP, time log, care plan version 17 all persisted. Service-element row for 'comprehensive care management' marked delivered."

Annotation:
"Total Sarah time: 5 (pre) + 22 (call) + 3 (post) = 30 minutes."
"Without the agent: 5 (pre) + 22 (call) + 15 (post documentation) = 42 minutes."
"Per-patient saving: 12 minutes. × 500 patients = 100 hours per month freed up."

---

## Diagram 7: Morning Briefing Sequence

**Purpose:** Show the showpiece flow that demonstrates the AI compounding the non-AI levers.

**Layout:** Vertical sequence diagram with actors as columns.

**Actors (left to right columns):**
1. "Cron (6:00am)"
2. "Convex scheduled function"
3. "Convex queries"
4. "Convex DB"
5. "OpenAI GPT-4o"
6. "Nurse browser"
7. "Right rail UI"

**Sequence (top to bottom):**

1. Cron → Convex scheduled function: "trigger generateMorningBriefing for each active nurse"
2. Convex scheduled function → Convex queries: "getPanel(nurseId)"
3. Convex queries → Convex DB: "SELECT patients WHERE primaryNurseId = ?"
4. Convex DB → Convex queries: "[500 patient rows]"
5. Convex scheduled function → Convex queries: "getDueToday, getOverdue, getRecentHospitalEvents, getPendingApprovals, getUnreadMessages, getKPIs"
6. Convex queries → Convex DB: "[multiple indexed reads]"
7. Convex DB → Convex queries: "[result sets]"
8. Convex scheduled function: "composePrompt({ nurseName, dueToday, overdue, recentHospitalEvents, pendingApprovals, unreadMessages, yesterdayKpis })"
9. Convex scheduled function → OpenAI: "POST /chat/completions, model gpt-4o, system + user messages"
10. OpenAI → Convex scheduled function: "structured response (priorityQueue, kpis, headsUp, recap)"
11. Convex scheduled function → Convex DB: "INSERT agentBriefings (nurseId, date, type=morning, content)"
12. ...Later, 9:00am...
13. Nurse browser → Convex queries: "useQuery(getBriefing, { nurseId, date: today })"
14. Convex queries → Convex DB: "SELECT * FROM agentBriefings WHERE nurseId = ? AND date = ?"
15. Convex DB → Right rail UI: "{ content }"
16. Right rail UI: "renders Morning Briefing cards (priority queue, KPIs, heads-up, recap)"
17. Nurse browser → Convex DB: "UPDATE agentBriefings SET viewedAt = NOW()"

Annotations on the right:
"This whole pipeline is async and proactive. The nurse arrives in the morning and the day is already organized. This is the operator-mode answer to Tienlan's question."

---

## Diagram 8: Voice-to-SOAP Sequence

**Purpose:** Show the documentation-drag answer end-to-end.

**Layout:** Vertical sequence diagram with actors as columns.

**Actors:**
1. "Nurse browser (microphone)"
2. "Browser MediaRecorder"
3. "Convex File Storage"
4. "Convex Action (transcribeAudio)"
5. "OpenAI Whisper API"
6. "Convex Action (draftSoapNote)"
7. "OpenAI GPT-4o"
8. "Convex DB"
9. "Right rail UI"
10. "Patient detail modal"

**Sequence (top to bottom):**

1. Nurse → Browser: "Click microphone button"
2. Browser MediaRecorder: "Start recording (webm or mp4)"
3. ... call happens ... (annotated: "22 minutes of audio captured locally")
4. Nurse → Browser: "Click stop"
5. Browser MediaRecorder: "Finalize blob"
6. Browser → Convex File Storage: "POST audio blob, get storageId"
7. Convex File Storage → Browser: "{ storageId: 'abc123' }"
8. Browser → Convex Action transcribeAudio: "{ storageId: 'abc123', encounterId, patientId }"
9. Convex Action → Convex File Storage: "fetch audio by storageId"
10. Convex Action → OpenAI Whisper: "POST /audio/transcriptions, file=audio.webm"
11. OpenAI Whisper → Convex Action: "{ text: '...' }"
12. Convex Action → Convex DB: "INSERT transcripts (encounterId, audioStorageId, text)"
13. Convex Action → Right rail UI: "transcript text appears in agent thread"
14. Browser → Convex Action draftSoapNote: "{ transcriptId, patientId }"
15. Convex Action → Convex DB: "load patient context (current care plan, recent encounters, conditions)"
16. Convex Action → OpenAI GPT-4o: "POST /chat/completions, system prompt: 'You are a clinical documentation assistant. Draft a SOAP note based on this transcript and patient context. Also draft a time log entry and any suggested care plan deltas.' Plus user message with transcript and context."
17. OpenAI GPT-4o → Convex Action: "{ subjective, objective, assessment, plan, timeLogEntry, carePlanDeltas[], confidence }"
18. Convex Action → Convex DB: "INSERT soapNotes (status: draft, draftSource: ai_from_transcript, aiConfidenceScore)"
19. Convex Action → Patient detail modal: "navigate modal to review state with draft loaded"
20. Nurse: "reviews and edits SOAP note"
21. Nurse: "approves or rejects each care plan delta"
22. Nurse: "click 'Sign and save'"
23. Patient detail modal → Convex Mutation signEncounter: "{ encounterId, soapNoteEdited, timeLogConfirmed, carePlanDeltasApproved[] }"
24. Convex Mutation → Convex DB (transactional):
    - "UPDATE encounters SET endedAt, durationSeconds, status=completed"
    - "UPDATE soapNotes SET subjective/objective/assessment/plan (edited), status=signed, signedAt, signedBy"
    - "INSERT timeLogs (patientId, nurseId, encounterId, ...)"
    - "FOR each approved delta: INSERT carePlanVersions (...)"
    - "UPDATE serviceElements SET status=delivered, evidence=encounterId"
    - "UPDATE patients SET riskScoreUpdatedAt (trigger recompute)"
    - "INSERT notifications (if any deltas need physician approval)"

Annotations:
"End-to-end documentation effort: 90 seconds of nurse review. Compare to industry baseline 15-20 minutes per encounter."

---

## Diagram 9: Data Model ER Diagram

**Purpose:** The schema visualization. The database engineer's diagram.

**Layout:** Standard ER format. Entity boxes with field lists. Lines with cardinality markers (one, many, optional).

**Entities (grouped by tier):**

**Tier 1 (essential):**
- users (id, role, name, email, ...)
- patients (id, medicareId, firstName, ..., **billingProgram**, **tier**, primaryNurseId, ...)
- carePlans (id, patientId, currentVersionId, ...)
- carePlanVersions (id, carePlanId, versionNumber, content, ...)
- encounters (id, patientId, nurseId, type, durationSeconds, ...)
- soapNotes (id, patientId, encounterId, subjective, ..., aiConfidenceScore, ...)
- transcripts (id, encounterId, audioStorageId, text, ...)
- agentThreads (id, userId, contextPatientId, ...)
- agentMessages (id, threadId, role, content, toolCalls, ...)
- agentBriefings (id, userId, date, type, content, ...)
- notifications (id, userId, patientId, type, ...)
- medicalDocuments (id, patientId, type, fileStorageId, ...)

**Tier 2 (important):**
- timeLogs (id, patientId, nurseId, encounterId, durationSeconds, activityType, ...)
- billingRecords (id, patientId, month, **billingProgram**, billingCodes, ..., **discriminator emphasized**)
- serviceElements (id, patientId, month, elementId, status, evidence, ...)

**Tier 3 (nice-to-have):**
- portalMessages (id, patientId, senderType, ...)
- outreachAttempts (id, patientId, scheduledFor, method, ...)
- hospitalEvents (id, patientId, eventType, eventDate, ...)

**Relationships (line cardinalities):**
- users 1—N patients (via primaryNurseId)
- patients 1—1 carePlans
- carePlans 1—N carePlanVersions
- patients 1—N encounters
- encounters 1—1 soapNotes (optional)
- encounters 1—1 transcripts (optional)
- patients 1—N timeLogs
- patients 1—N billingRecords
- patients 1—N serviceElements (one per element per month)
- patients 1—N medicalDocuments
- users 1—N agentThreads
- agentThreads 1—N agentMessages
- users 1—N agentBriefings
- users 1—N notifications

**Annotations:**
- Highlight `patients.billingProgram` and `billingRecords.billingProgram` with annotation: "Single discriminator across CCM, PCM, APCM. Not three parallel tables."
- Highlight carePlans → carePlanVersions relationship: "Per-document versioning, full snapshot per version, diff computed at read time."
- Highlight serviceElements: "One row per (patient, month, element). Lets dashboard query 'patients with under 8 of 11 elements covered' in O(rows)."
- Highlight agentThreads + agentMessages + agentBriefings: "Agent has memory. First-class entities, not bolt-ons."

---

## Diagram 10: Outreach Retry Flow (Future State)

**Purpose:** Show the agentic future. Marked "FUTURE STATE, drawn for vision, not built in MVP."

**Layout:** Flowchart with decision diamonds and loops.

**Start node:** "Patient on today's queue, scheduled for monthly touch"

**Step 1 (action box):** "Nurse attempts call (or system attempts via Twilio)"

**Decision 1 (diamond):** "Patient answered?"
- Yes → "Call completed, log encounter, document, end" (success path, teal)
- No → continue to decision 2

**Decision 2:** "Voicemail or no answer?"
- Voicemail → "Leave voicemail (recorded message, optional), log attempt"
- No answer → "Log attempt"

**Decision 3:** "Attempt number?"
- Attempt 1 of 3 → "Schedule retry tomorrow at patient's best-answer window (LLM-suggested)"
- Attempt 2 of 3 → "Schedule retry day after, different time of day"
- Attempt 3 of 3 → continue to step 4

**Step 4 (action):** "Switch to SMS fallback. Agent drafts a patient-appropriate message."

**Decision 4:** "Patient responded to SMS?"
- Yes → "Convert response to encounter (inbound SMS counts), log, end" (teal)
- No → continue to step 5

**Step 5 (action):** "Portal nudge with check-in form"

**Decision 5:** "Patient completed portal nudge?"
- Yes → "Log as encounter via portal_message, mark service-element delivered" (teal)
- No → continue to step 6

**Step 6 (action):** "Mail letter (postal)"

**Step 7 (action):** "If no response within 30 days, flag patient as 'unreachable status' on dashboard"

**Decision 6:** "Unreachable for 90 days?"
- Yes → "Notify primary nurse. Recommend status review (deceased? moved? declining program?)" (coral, requires human decision)
- No → "Continue monitoring"

**End nodes:**
- Success (teal): "Encounter logged, service element delivered, audit-defensible"
- Failure (amber): "Unreachable flagged, primary nurse alerted, manual review"

**Across the top of the diagram:**
"This entire flow is automated by the agent in future state. The nurse only sees the patient when human judgment is required or a successful contact happens."

**Across the bottom:**
"FUTURE STATE. Not built in MVP. Drawn here to demonstrate the operational compression that gets the panel from 400 (manual) to 500+ (agent-automated)."

---

## Order of presentation in the interview

If Tienlan only has time for a subset, present in this order:

1. **Diagram 1** (CCM today): grounds the problem
2. **Diagram 2** (APCM tomorrow): shows the regulatory unlock
3. **Diagram 5** (monthly care cycle): directly answers his "care piece" question
4. **Diagram 3** (nurse sitemap): shows what was built
5. **Diagram 7** (Morning Briefing sequence): demonstrates the showpiece flow
6. **Diagram 4** (system architecture, dual-track): the technical credibility

If he has more time:

7. **Diagram 6** (inside a call)
8. **Diagram 8** (voice-to-SOAP sequence)
9. **Diagram 9** (data model)
10. **Diagram 10** (outreach retry future)

---

## Drawing tips

- Excalidraw supports library shapes. Use the "Library" feature for reusable nurse/patient/system icons.
- Use the Group function to keep related nodes together when moving them.
- Use the Frame feature to define presentation areas. Each diagram should be in its own Frame so you can present them sequentially during the call.
- Export each Frame as PNG or SVG for backup in case the live Excalidraw URL breaks during the interview.
- Save the Excalidraw file to `design/Foresight_Interview_Deck.excalidraw` so it's checked into the project.

---

## Companion docs

- **CCM_Plan.md**, **APCM_Plan.md**: operational substance these diagrams illustrate
- **PRD.md**: the MVP flows Diagrams 3, 7, 8 visualize
- **Technical_Architecture.md**: the schema and architecture Diagrams 4 and 9 visualize
- **UIUX_Spec.md**: the visual design for the sitemap (Diagram 3)
