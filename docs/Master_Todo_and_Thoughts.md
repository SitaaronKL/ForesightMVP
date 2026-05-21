# Master TODO + Current State

**Last updated:** May 14, 2026, ~02:00 AM
**Interview:** Friday May 15 with Tienlan Sun, Foresight Health
**Working overnight to ship the full package.**

---

## What's done

### Research phase (complete)
- [x] CCM operations research (deep, source-backed)
- [x] APCM research (deep, source-backed)
- [x] Voice-of-the-nurse qualitative research (Glassdoor, AllNurses, JGIM, KevinMD, AHRQ)
- [x] `research/01_CCM_Operations_Research.docx` and `.md`
- [x] `research/02_APCM_Research.docx` and `.md`
- [x] Plain-English overview + PCM section added to CCM paper
- [x] All abbreviations expanded across both research papers
- [x] `outreach/Nurse_Call_Questions.docx` and `.md` (12 questions, vocabulary, scripts)
- [x] `outreach/reddit_r_nursing_post.md` (3 subreddit-tailored versions + etiquette)
- [x] `CLAUDE.md` seeded with project context

### Planning phase (complete, decisions locked below)
- [x] Tech stack locked
- [x] MVP scope locked (6 flows)
- [x] Kanban pushback resolved (smart list primary, Kanban only for onboarding pipeline)
- [x] Data model schema sketched
- [x] Agent tool surface defined
- [x] Excalidraw deliverables outlined

### File-format housekeeping
- [x] All existing .docx files have .md siblings (for Claude Code readability going forward, every new .docx gets a paired .md)

---

## What's next (immediate)

- [ ] Write `planning/CCM_Plan.docx` and `.md`
- [ ] Write `planning/APCM_Plan.docx` and `.md`
- [ ] Write `technical/Technical_Architecture.docx` and `.md`
- [ ] Write `prd/PRD.docx` and `.md`
- [ ] Write `uiux/UIUX_Spec.docx` and `.md`
- [ ] Produce Excalidraw text specs in `design/`
- [ ] Scaffold the NextJS + Convex app in `app/`
- [ ] Seed mock data (50-100 hand-crafted patients, 1 demo nurse, 1 demo physician)
- [ ] Build the 6 MVP flows
- [ ] Polish pass, rehearsal

---

## Locked decisions (full detail will live in the planning docs)

### Tech stack
| Layer | Primary | Alt (shown in Excalidraw only) |
|---|---|---|
| Frontend | NextJS 14+ (App Router) | (same) |
| Hosting | Vercel | AWS EC2 |
| Database | Convex | AWS RDS + Postgres |
| File storage | Convex File Storage | AWS S3 |
| Server logic / cron | Convex Actions + scheduled functions | AWS Lambda + EventBridge |
| Auth | Convex Auth or Clerk | AWS Cognito |
| Agent | OpenAI SDK (Dhruv has credits) | Claude Agent SDK |
| Voice transcription | OpenAI Whisper (browser MediaRecorder upload) | Deepgram, AssemblyAI |
| Styling | Tailwind + framer-motion | (same) |

Drawn but not built in MVP: Twilio outbound calling, agentic patient calls, FHIR/Epic integration.

### MVP scope (6 flows)
1. **Nurse dashboard** with smart sorted list, risk-stratified, urgency-ordered, KPI strip
2. **Master agent right rail** with morning briefing on login + end-of-day wrap
3. **Patient detail** with care plan version history (git-diff view)
4. **Voice → SOAP draft** (browser mic → Whisper → GPT-4 → structured note)
5. **Patient-facing portal** (care plan summary, monthly statement, message thread)
6. **Admin page** (CRUD for fake data, seed generator, manual risk-score trigger for demo)

### Kanban decision
Primary nurse workspace = **smart sorted list**, not Kanban. CCM/APCM work is cyclical (monthly cadence), not progressive (state transitions). Kanban breaks at 300+ items and the work isn't state-transition shaped.

Kanban appears only as **secondary view for the new-patient onboarding pipeline** (referred → eligibility verified → consent obtained → care plan drafted → first call scheduled → activated). That sub-workflow IS state-transition shaped.

### Schema highlights (full detail in Technical doc)
- Tables in 4 tiers: essential (users, patients, carePlans + carePlanVersions, encounters, soapNotes, transcripts, agentThreads/Messages/Briefings, notifications, medicalDocuments), important (timeLogs, billingRecords, serviceElements), nice-to-have (portalMessages, outreachAttempts, hospitalEvents), future (careTeams, practices).
- Single `billingRecords` table with `billingProgram` discriminator (CCM/PCM/APCM), not three parallel tables.
- Care plan versioning: per-document full snapshots, diff computed at read time.
- Service elements: one row per (patient, month, element) for APCM audit attestation.
- Risk score: computed on-write of encounters (throttled 24hr per patient). Admin page has "Recompute all" button for the demo. One designated demo patient gets immediate-recompute on every encounter so Tienlan can watch the score change live.
- Soft delete everywhere (HIPAA retention).
- Showcase mode: skip app-level encryption of medicareId, skip multi-tenancy enforcement, skip auditFlags array, skip outreach retry cron. Mention them in Technical doc as production notes.

### Agent surface
- **Read tools**: getPatient, listPanel, searchPanel (internal, no separate tool), getPatientHistory, getCarePlanHistory, getOverdue, getDueToday, getMonthlyKPIs, getServiceElementCoverage, getRecentTranscripts.
- **Write tools** (every one renders a card with "Apply" button, no auto-apply): draftSoapNote, suggestCarePlanRevision, draftPatientMessage, scheduleOutreachAttempt. Then explicit `applyX` mutations fire only on click.
- **Action tools** (Convex Actions, external API access): transcribeAudio, generateMorningBriefing, generateEndOfDayWrap, computeRiskScore, detectPatternsAcrossEncounters, scanForGapClosure.
- **Tool budget**: 4 tool calls per turn cap. If agent needs more, surfaces a "Continue" button for nurse approval. Side benefit: makes the agent's work visible during the demo.
- **Hard constraints**: agent never talks to patient directly in v1, never auto-submits billing, never modifies care plan without nurse approval, scoped to assigned panel.
- **Proactive flows**: Morning Briefing (scheduled Convex function generates at 6am, viewed on login), End-of-Day Wrap (triggered on shift end). These define the day for the nurse.

### Excalidraw deliverables (10 diagrams, priority order)

**Required (the core deck):**
1. **Patient journey: CCM and PCM today** (the "before") — the four-stage flow with operational friction visible (20-min stopwatch, coinsurance, audit risk)
2. **Patient journey: APCM tomorrow** (the "after") — same flow with regulatory unlocks (service-element checklist, no time clock, tier-stratified delivery)
3. **Nurse screen architecture / sitemap** — login → dashboard → patient detail → agent right rail → voice modal → admin
4. **System architecture, dual-track tech stack** — every node labeled `Primary (alt: Alternative)`

**Care-piece focused (Tienlan's explicit ask):**
5. **Monthly care cycle for a single Level 2 patient** — what happens day-by-day across one month, where automation kicks in, where the nurse leads, where the agent assists
6. **Inside a single nurse call** — the 22 minutes minute-by-minute, what the agent does pre-call/during/post-call, where the nurse-patient relationship is preserved

**Showpiece sequences:**
7. **Morning Briefing sequence** — 6am cron → scheduled function → query panel → assemble priority queue → GPT summary → render
8. **Voice → SOAP draft sequence** — mic press → MediaRecorder → upload → Whisper → GPT-4 → draft note + time entry + care plan delta → nurse review and sign

**Reference:**
9. **Data model ER diagram** — entities, FKs, the three billing-program discriminator, version-history relationships
10. **Outreach retry flow (future state)** — agent loop for unreachable patients, marked "drawn for vision, not built in MVP"

---

## Key insights from research to use in the interview narrative

- **The 300-patient ceiling is structural, not a nurse-capability problem.** It's the 20-minute clock + documentation overhead. Math: 300 × 40-60 min realistic per-patient effort = 200-300 hours/month, exceeds a 160-hour work month.
- **Non-AI levers carry most of the unlock; AI compounds it.** Risk stratification, unified workspace, pre-call context auto-load, smart batching, rules-based outreach, audit-ready checklists alone get a nurse from 300 to ~400. AI compounds to 500+.
- **APCM is the regulatory unlock that pairs with the AI unlock.** Removes time clock at the regulatory layer; AI agents remove documentation and outreach load at the workflow layer. They compound.
- **Coinsurance attrition is real but second-order.** About half of Medicare beneficiaries have Medigap and pay $0. The other half feels every $13/month. The bigger problem: ~96% of CCM-eligible patients are never enrolled at all (the program is structurally underdeveloped, not the cost-share).
- **Don't automate the patient-nurse relationship.** Agent reduces overhead AROUND the call, never replaces the call. Frame as "I'm protecting your time with Mrs. Smith," not "I'm replacing your call with Mrs. Smith."
- **CCM and PCM are parallel, not stages.** A patient is on CCM for stable multi-condition periods, transitions to PCM for severe single-condition exacerbations, back to CCM after. APCM bundles both with no time clock.
- **APCM's "designated care team member" tilts toward continuity** but doesn't lock one nurse to one patient. Primary nurse + backup pool is the right model.

---

## Misconceptions to keep top of mind (Dhruv's bias check)
- "$10/month isn't that bad" → for retired Medicare patients on fixed Social Security, $10 is the marginal straw on top of $300+ in monthly healthcare. Real driver of revocation for the half without Medigap.
- "One nurse, fully fungible panel" → reality is hybrid: primary nurse with backup pool. APCM requires this explicitly.
- "Graduate from CCM to PCM" → no, parallel programs based on patient profile, not stages.

---

## Tech stack quickref for tomorrow's build session

- `convex/schema.ts` — tables defined per the locked schema
- `app/` — NextJS App Router
- `convex/queries/`, `convex/mutations/`, `convex/actions/` — backend functions
- `lib/agent/` — OpenAI SDK wrapper, tool definitions, prompt templates
- `components/` — UI primitives (LiquidGlassCard, GradientMesh, RiskBadge, CarePlanDiff, etc.)
- `app/admin/` — admin page with seed data + manual triggers
- Tailwind config with custom backdrop-blur values, gradient stops, animation keyframes

---

## Open verification flags (worth Ian's eyes if there's time)

- Exact CY2026 Medicare rates for 99491, 99437, 99487, 99489 (derived from ~10% scaler, not directly cited cents-accurate)
- CY2026 rates for G0557 and G0558
- 11 vs 13 APCM service elements count (sources differ; paper uses AAFP/CMS framing of ~11)
- APCM adoption volume claims (no published CMS data yet)

---

## Style + tone rules (locked)

- **No em dashes.** Commas, periods, or parentheses instead.
- Brand color #0B3B5C for headings. Arial font.
- Pull quotes use a left-border accent.
- Tables use zebra rows + navy header.
- Citations at end of each doc, full URLs.
- Don't lecture in the interview. Listen first, push back where you've earned the right.
- Frame APCM as a regulatory unlock that pairs with the AI unlock.
- Be the operator, not the vendor.
