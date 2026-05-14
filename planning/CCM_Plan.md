# CCM Operational Plan: Making 300 Tractable Today

**Author:** Dhruv Lalwani
**Prepared for:** Foresight Health interview (Tienlan Sun)
**Date:** May 14, 2026
**Companion docs:** APCM_Plan.md, PRD.md, Technical_Architecture.md, UIUX_Spec.md

---

## Executive summary

Tienlan's question 1 is direct: each nurse manages a panel of approximately 300 patients running the four-stage flow (eligibility, consent, care, billing). Focusing on the care piece, how do we make sure every nurse can call and care for their full panel every month?

The honest answer in one paragraph. The 300-patient ceiling is not a nurse-capability ceiling, it is a structural one imposed by the 20-minute time clock that sits underneath every billable encounter and the contemporaneous documentation requirement that doubles the per-patient effort. A competent registered nurse can have substantive twenty-minute clinical conversations with twenty to twenty-five patients in a workday. She cannot also handle the documentation, the chart review, the specialist coordination, the retry calls to unreachable patients, the audit-defensible time logging, and the care plan updates for all 300 patients within the working month. The math breaks somewhere between hour 160 and hour 220 of monthly effort. Foresight's opportunity is to take fifty to seventy percent of that supporting work off the nurse's plate, leaving her with the clinical conversation as the irreducible human core, and pushing the panel ceiling up structurally.

This plan covers the operational levers that get a Chronic Care Management nurse from missing roughly a third of her panel each month (the industry baseline) to touching effectively all of it. It is organized into non-AI structural levers and AI-driven levers, in that order, because the non-AI levers carry most of the unlock and the AI compounds it.

---

## 1. Context and constraints

### Who is being managed
A Chronic Care Management patient is a Medicare beneficiary, almost always 65 or older, with two or more chronic conditions expected to last twelve months or until death. Typical condition combinations: diabetes with hypertension, congestive heart failure with chronic obstructive pulmonary disease, depression with osteoarthritis, kidney disease with diabetes, dementia with atrial fibrillation. Most Medicare patients meet eligibility on their sixty-fifth birthday by default, but only about four percent of those who qualify are enrolled in Chronic Care Management today. The market is structurally underdeveloped.

### Who is doing the managing
The clinical staff member is typically a registered nurse, sometimes a licensed practical nurse, working under general physician supervision (the supervising physician must be available by phone but does not have to be on-site). The nurse runs the workflow. The physician's name appears on the claim and on the care plan but in practice the physician is doing the nurse's work for one or two acute moments per quarter, not the monthly cadence. Some practices use medical assistants or community health workers for parts of the work. Almost no Chronic Care Management is delivered by the physician personally, despite there being a code (99491) for that, because the economics make personal delivery unattractive.

### What gets paid
The dominant code is 99490: twenty minutes of clinical staff time per calendar month, billed once per patient per month, reimbursed at approximately $66.30 in calendar year 2026. The patient owes twenty percent as Medicare Part B coinsurance, roughly $13 per month. The add-on code 99439 buys another twenty minutes at approximately $50.56, billable up to two times in a month. Complex Chronic Care Management (99487 + 99489) is for higher medical decision making complexity and pays substantially more (~$145 base) but is used by a small fraction of programs. The nurse can also bill Principal Care Management (99424 through 99427) for patients whose situation is dominated by a single severe condition rather than multiple chronic ones. Most practices like Foresight bill a mix of Chronic Care Management and Principal Care Management depending on the patient.

### The structural ceiling
The 20-minute threshold creates the binding constraint. A nurse who spends twenty actual minutes on a call with a patient still needs five to ten minutes of pre-call chart review, ten to fifteen minutes of post-call documentation, and five to fifteen minutes of follow-up tasks (refill messages, specialist coordination, scheduling). Realistic per-patient effort lands between forty and sixty minutes. 300 patients times 40 minutes is 200 hours per month. A full-time work month is roughly 160 hours. Add retries on unreachable patients (one in three on average), audit preparation, training, meetings, paid time off, and the day stops working.

### The audit risk
Centers for Medicare and Medicaid Services requires contemporaneous documentation (logged as you do it, not reconstructed at end-of-day) showing what was done, when, by whom, and for how long. Vague entries are the number one audit failure pattern. "Care coordination, 20 minutes" without substance gets clawed back. Round-number minutes (every entry exactly twenty) are statistically implausible and trigger Recovery Audit Contractor scrutiny. Programs that scale without audit-defensible documentation face six or seven figure repayment events.

### The retention risk
Roughly half of Chronic Care Management eligible patients carry Medicare supplemental insurance (Medigap) or are dual-eligible with Medicaid, in which case the twenty percent coinsurance is covered for them and they pay nothing. The other half pays the full $13 per month out of pocket. The 2019 Mathematica qualitative study found that about half of patients with supplemental insurance reported they would not have consented to Chronic Care Management if they had been told they would owe the coinsurance out of pocket, and patients who saw the first coinsurance bill on a statement sometimes revoked the service immediately. The fix is not lower price (the law sets the share). The fix is consent-time clarity and ongoing transparency about what they are getting for the charge.

---

## 2. The four-stage flow today

Every patient moves through the same four stages each month, and each stage has its own failure modes.

### Stage 1, eligibility
The practice must verify that the patient has two or more qualifying chronic conditions expected to last at least twelve months, and that a face-to-face initiating visit happened in the past twelve months. Failure modes: the chronic conditions list in the electronic medical record is incomplete, the initiating visit is older than twelve months and not flagged, the patient was added to the panel without anyone running the check. Solution direction: an automated eligibility check that runs against the chronic conditions list and visit history and surfaces eligible-but-not-enrolled patients to the nurse for enrollment outreach.

### Stage 2, consent
A documented consent has to exist before any billing happens, and it must inform the patient of the right to revoke at any time, the existence of the coinsurance, and the single-practitioner rule. Failure modes: consent is "obtained" verbally and never documented, the documentation is generic and lacks the required disclosures, consent obtained years ago when the billing practitioner has since changed (re-consent is required when the billing physician changes). Solution direction: a structured consent form with a built-in cost-share calculator that shows the patient their actual expected monthly cost given their supplemental coverage, captured electronically with audit trail.

### Stage 3, care
The substantive work. The nurse spends at least twenty cumulative minutes per patient per calendar month on non-face-to-face clinical care coordination. The minutes can come from one long call or accumulated across multiple shorter touches. Allowable activities include patient calls, medication reconciliation, lab review, specialist coordination, family/caregiver calls, prescription refill management, and care plan updates. Failure modes: patient unreachable (one-third on any given call), minutes documented vaguely, time accumulates from coordination work that the nurse forgot to log, the care plan goes stale between annual reviews, batched call retries return to voicemail because nobody knows when each patient actually answers. This is the stage Foresight's product needs to compress dramatically.

### Stage 4, billing
At month end, the practice submits claims for every patient whose qualifying time was met and documented. Failure modes: claims submitted for patients whose minutes were not actually met, missing care plan, missing consent, vague documentation that fails audit, claims missed because nobody knew the patient had enough minutes accumulated to bill. Solution direction: a per-patient monthly billing readiness state computed from the data, with audit-defensible artifacts assembled automatically and the nurse pressing one button to submit.

---

## 3. Non-AI structural levers (most of the unlock lives here)

Tienlan asked specifically about non-AI levers. These are the operational, design, and rule-based interventions that would push a competent nurse from 300 missed-monthly to 400 reliably-served patients without any large language model involvement. They are listed in order of leverage.

### Lever 1, unified workspace
Today most Chronic Care Management nurses operate across two stacks: the electronic medical record (Epic, eClinicalWorks, Athena, etc.) and a Chronic Care Management platform layered on top (ChartSpan, ThoroughCare, CircleLink). The same patient data lives in both. The nurse documents in two places, switches windows constantly, and loses context. A unified workspace replaces the stack with a single interface, eliminating window-switch overhead and double-documentation. This alone saves an estimated ten to fifteen minutes per nurse per day.

### Lever 2, pre-call context auto-load
When the nurse opens a patient, the system pre-loads recent labs, last three encounters, current medications, active care plan goals, open referrals, upcoming appointments, recent hospital events, family contact notes. Everything she would otherwise spend five to ten minutes pulling up. The nurse begins the call already oriented. Saves five to ten minutes per call, multiplied by twenty calls a day.

### Lever 3, risk stratification at panel level
Every patient gets a tier assignment (Level 1, 2, 3) based on condition complexity and recent activity. Level 1 patients get the lightest-touch monthly outreach (often an automated check-in plus a brief confirmation call). Level 2 patients get the standard 20-minute call. Level 3 patients get the bulk of the nurse's clinical time. The nurse's clinical hours flow to where they have the most impact. This is non-AI because the stratification can be a rule (count of conditions, recent hospitalizations, age) rather than a model.

### Lever 4, smart batching by call topic
Instead of dialing patients in alphabetical or random order, the daily queue is grouped by what the call is about: refills today, lab follow-ups today, transitions of care today, monthly check-ins today. The nurse builds conversational momentum on one topic before switching contexts. The cognitive load of switching from "refill chat" to "discharge follow-up" to "lab review" repeatedly across a day is real and depletes clinical attention.

### Lever 5, time-of-day reach prediction
The system records when each patient historically answers (Tuesday afternoons, Saturday mornings, never before noon). When building the daily queue, it surfaces patients in their personal best-answer window. No machine learning required, just a histogram per patient over their call history. Lifts the reach rate from a typical 60-70% to 80%+, which compounds into more billable encounters per nurse per month.

### Lever 6, automated outreach for low-value touches
Routine reminders ("don't forget your appointment tomorrow," "your refill is ready," "please complete your blood pressure log") move to SMS, portal messages, and Interactive Voice Response. The nurse's twenty-minute clinical conversation is reserved for substantive clinical content. The system also handles the unreachable-patient retry loop: three call attempts at different times of day, then SMS fallback, then portal nudge, then mail letter, then flag inactive at 90 days. The nurse only sees the patient on her dashboard once a real human-touch is required.

### Lever 7, audit-ready by default
Every encounter logs start time, end time, activity description, who performed it, what was done. Every care plan revision is versioned. Every consent is captured electronically. The audit artifact is a byproduct of the workflow, not a separate effort. The nurse is never doing audit preparation; she is just doing the work, and the system assembles the audit packet when needed.

### Lever 8, care plan templates by condition combo
For common condition combinations (diabetes with hypertension, congestive heart failure with chronic obstructive pulmonary disease, depression with arthritis, kidney disease with diabetes), the system has pre-populated care plan skeletons. The nurse customizes for the individual patient rather than starting from a blank document each time. Saves substantial time on care plan creation and ensures coverage of guideline-recommended interventions.

### Lever 9, transparent cost-share at consent
The consent screen includes a cost calculator: "Your supplemental insurance covers Part B coinsurance, so your expected monthly cost is $0," or "You do not have supplemental insurance covering this, so your expected monthly cost is approximately $13. Here is what you receive for that charge." Patients who say yes after seeing the number do not revoke when the first bill arrives. Patients who say no decline at consent, before the practice has invested billable nurse time.

### Lever 10, monthly itemized statement to the patient
The recurring monthly charge is invisible to most patients because Medicare's Explanation of Benefits is unreadable. A Foresight-branded monthly statement in plain English ("In April, your nurse Sarah spent 22 minutes on your care. Here is what she did: refilled your metformin, called your cardiologist about the echo result, updated your care plan with the new blood pressure goal. Your share this month is $13.") turns the invisible into the visible and pre-empts the "what is this for" revocation conversations.

### Lever 11, continuity-first attribution with backup pool
Every patient is assigned a primary nurse. The patient knows that nurse's name. The system surfaces "this is your nurse" prominently on the patient portal. But the primary nurse is not locked-in. There is a backup pool for coverage during paid time off, weekends, and triage. The continuity-first design satisfies the Advanced Primary Care Management "designated care team member" requirement at the architectural level and also addresses the operational reality that patients form lasting trust with the same nurse over time.

### Lever 12, onboarding pipeline as the only Kanban
For new patient onboarding, a small Kanban board fits the state-transition shape of the workflow (referred, eligibility verified, consent obtained, care plan drafted, first call scheduled, activated). The main nurse workspace stays as a sorted list because the monthly cadence is cyclical, not progressive. Kanban appears only where the work actually has discrete states.

The combined effect of these twelve non-AI levers is to take a competent registered nurse from 300 patients with substantial leakage to 400 patients with reliable monthly coverage. No model inference, no probabilistic output. Just well-designed operational software.

---

## 4. AI levers (the compounding multiplier from 400 to 500+)

The artificial intelligence layer is not the foundation of the unlock. It is the multiplier that compounds the non-AI gains. The argument that lands in the interview is that you could remove every large language model from this system and it would still be the best Chronic Care Management workspace on the market. The artificial intelligence is what makes it the obvious choice.

### Voice-to-documentation drafting
The nurse presses a microphone button at the start of a call. The browser captures audio. After the call ends, the system sends the audio to a transcription model (OpenAI Whisper), then sends the transcript plus the patient context to a language model (GPT-4) which produces a structured Subjective, Objective, Assessment, Plan note, a draft time log entry with appropriate activity description, and a list of suggested care plan deltas. The nurse reviews on screen, edits where needed, and signs. The documentation drag that consumes ten to fifteen minutes per encounter today drops to one to three minutes of review.

### Master agent on the right rail
A persistent agent surface that the nurse can query in natural language. Examples: "who needs a refill this week," "summarize Mrs. Garcia's last three calls," "draft a SOAP note from this transcript," "which Level 2 patients have not been reached this month." The agent is the search replacement, the documentation drafter, the panel-wide context engine. The agent operates only within the calling nurse's panel and only produces drafts: every write action requires the nurse to click "Apply." Tool budget per turn is capped at four calls with a "Continue" button if the agent needs to go deeper. The agent never speaks to a patient directly in version one; that boundary preserves the patient-nurse relationship that the entire program depends on.

### Morning Briefing
A scheduled large language model job runs at six in the morning (Convex scheduled function) and assembles, for each nurse, the priority queue for the day: patients due, patients overdue, urgent items (recent hospital discharges with transitions-of-care deadlines closing), care plan revisions awaiting approval, unread portal messages. Plus the previous day's snapshot: reach rate, completion percentage. The nurse opens the application and the day is already organized. This is the showpiece moment because it answers Tienlan's question literally: how do we make sure every nurse can call and care for their full panel every month? The Morning Briefing tells her where to start so she will not run out of time before reaching the patients who need her most.

### End-of-Day Wrap
A bookend to the Morning Briefing. End of shift, the agent assembles: reached today vs due, unreached patients, automatic retry schedules created for tomorrow, draft notes awaiting signature, service-element coverage gaps that should be addressed this week. The nurse closes the application knowing what is open and what is automated for her.

### Risk scoring
Each patient carries a risk score (0-100) computed by a large language model from recent encounters, labs, hospital events, and medication adherence signals. Updated on each new encounter (throttled to once per twenty-four hours per patient). The dashboard surfaces high-risk patients prominently. The score is for prioritization, not for clinical decision making; it is a signal for which patient deserves the nurse's attention next, not a substitute for clinical judgment.

### Care plan revision suggestions
When recent encounters or labs surface a pattern that should change the plan (a new diagnosis, a goal that should be tightened, a medication to add or stop), the patient detail page shows an agent-generated revision suggestion in the sidebar. The nurse reviews the diff. If she agrees, she clicks Apply. The revision becomes a new care plan version, attributed to the nurse with the agent noted as draft source.

### Cross-patient pattern detection
At the panel level, the agent detects clusters: three patients today who mentioned dizziness, five patients due for hemoglobin A1c this month, four patients on the same medication with reported adherence issues. The nurse can act on the cluster in one batch rather than discovering each independently across many calls.

### Outreach message drafting
When the nurse clicks "send a check-in message," the agent pre-fills a contextual draft customized to the patient (their conditions, their recent activity, their tone preferences). The nurse reviews and sends. Saves significant time on the routine portal messaging without sounding generic.

### Gap-closure scanning
A scheduled large language model job runs monthly and scans the panel for missing preventive services per guideline (Annual Wellness Visit overdue, immunizations missed, screenings not done, hemoglobin A1c overdue for diabetic patients). Surfaces them on the dashboard with one-click outreach drafts. This compounds the regulatory advantage under Advanced Primary Care Management, where population-level management is an explicit service element.

---

## 5. Where this lands in the product

The Minimum Viable Product is six flows, sequenced to demonstrate the thesis.

1. **Nurse dashboard**. Smart sorted list, KPI strip at top, risk-stratified, urgency-ordered, default sort = "what should I do today." Filters by tier, status, last touched, reach status. This is where the 300 (or 500 under Advanced Primary Care Management) becomes visually tractable.

2. **Master agent right rail**. Liquid glass surface, always visible, persistent across navigation. Morning Briefing on login. Action cards for every write operation. Voice-input microphone integrated.

3. **Patient detail with care plan version history**. Click any patient on the dashboard to drill in. See the full chart with care plan rendered as a versioned document, encounter history, recent labs. Click "History" on the care plan to see every revision with diff highlighting. This is the technical-depth proof and the audit-trail story.

4. **Voice-to-SOAP draft**. Microphone button on the patient detail page. Records audio, transcribes via Whisper, drafts the Subjective-Objective-Assessment-Plan note via GPT-4 with patient context, presents for nurse review and signature. The documentation-drag answer demonstrated end-to-end.

5. **Patient-facing portal**. Read-only view for the patient: current care plan summary, monthly statement in plain English, message thread with their nurse. This is the consent-time clarity and ongoing transparency answer.

6. **Admin page**. Internal tooling: create / edit fake nurses, fake patients, fake encounters. Seed-data generator. Manual "recompute all risk scores" button for the demo (so during the interview the score can visibly change in real time).

Detailed product specifications live in PRD.md. Detailed technical specifications including the full schema, agent surface, and architecture diagrams live in Technical_Architecture.md. Detailed visual design specifications live in UIUX_Spec.md.

---

## 6. Rollout sequence (if Foresight built this for production)

The interview ask is not literally "tell us how to roll this out next quarter." But Tienlan wants to know that the candidate can think past the demo into operations. Rough sketch:

**Month 0 to 1**, internal staff usage with a single primary care practice partner. Onboard their nurses to the unified workspace. Measure baseline reach rate, calls per day, documentation time per encounter. Twenty patient pilot panel.

**Month 1 to 2**, expand to one full nurse's panel (~300 patients). Roll out the Master agent and Morning Briefing. Measure documentation time reduction, reach rate lift, audit-readiness of generated artifacts. Iterate the agent prompts on real data.

**Month 2 to 4**, expand to three nurses in the same practice (~900 patients). Roll out the voice-to-Subjective-Objective-Assessment-Plan flow. Roll out the patient portal and monthly statements. Measure patient revocation rate change.

**Month 4 to 6**, second practice partner. Repeat the rollout. Tune for cross-practice variability.

**Month 6 to 9**, transition pilot practices to Advanced Primary Care Management billing. Validate that the system's service-element attestation passes Centers for Medicare and Medicaid Services audit on the first claims batch.

**Month 9 to 12**, generalize. Expand to additional accountable care organization participants. Push panel sizes from 300 to 400 (proven), pilot toward 500 for Advanced Primary Care Management cohorts.

The product changes that lock in over this period: a clear audit story that Centers for Medicare and Medicaid Services has reviewed favorably, a published reach-rate benchmark that beats industry baseline, a documentation-time benchmark that nurses report as life-changing, and a revocation rate that meaningfully beats the post-bill-shock pattern.

---

## 7. Open production notes (not in MVP scope)

These are the things that would matter for a real production deployment, included here so the technical depth is on record without making the MVP too heavy.

- **Application-level encryption** of the medicareId field on the patients table (Convex encrypts at rest by default, but defense in depth matters for personal health information).
- **Multi-tenancy** with practice-level data isolation enforced at the query layer.
- **Audit trail completeness**: every read of a patient record logged, every write attributed to a user identifier and timestamp, immutable.
- **Concurrent billing guardrails**: automated checks preventing Advanced Primary Care Management plus Chronic Care Management/Principal Care Management/Transitional Care Management in the same month per patient.
- **Patient revocation workflow**: a clean way to revoke that immediately stops billing and notifies the practice.
- **Recovery from designated-practitioner change**: re-consent flow triggered when the billing physician changes.
- **Integration surface**: outbound posting of claims to a billing clearinghouse, inbound feed of hospital events (Admission/Discharge/Transfer) from a health information exchange, eventual two-way sync with the electronic medical record (FHIR R4).
- **Telephony integration**: Twilio for outbound calling with consent-aware recording, voicemail handling, transcript persistence.
- **Quality measure reporting**: ability to export Merit-based Incentive Payment System Value Pathway compliant electronic clinical quality measures from the captured data, or in the accountable care organization case, attribution-level rollups suitable for the Medicare Shared Savings Program.

---

## 8. What success looks like

For a single primary care practice running on this system, after a full quarter of operation:

- Reach rate per nurse per month above eighty percent (industry baseline is sixty to seventy percent).
- Average documentation time per encounter below five minutes (industry is fifteen to twenty).
- Audit-readiness verified: every claim has time logs, contemporaneous notes, signed Subjective-Objective-Assessment-Plan, current care plan, documented consent.
- Patient revocation rate below five percent monthly (industry hovers around fifteen percent for the cohort that pays out-of-pocket coinsurance).
- Nurse panel size proven sustainable at 400 (Chronic Care Management + Principal Care Management), trending to 500 (Advanced Primary Care Management).
- Nurse retention above one year average (industry vendor average is below six months at the major staffing shops).

For Foresight as a business, the same metrics translate into proof that the augmented care model is not just operationally novel but financially superior, which is the unlock for accountable care organization partnerships, multi-practice deployment, and eventually expansion beyond Chronic Care Management/Principal Care Management/Advanced Primary Care Management into adjacent value-based care arrangements.

---

## Companion docs

- **APCM_Plan.md**: the operational plan for the Advanced Primary Care Management transition, panel expansion from 300 to 500+, and patient interfaces.
- **PRD.md**: the product requirements for the six Minimum Viable Product flows.
- **Technical_Architecture.md**: the full schema, agent tool surface, system architecture with primary and alternative tech stacks.
- **UIUX_Spec.md**: design language, screen inventory, animation principles, the liquid glass spec.
- **design/Excalidraw_Specs.md**: text specifications for all ten diagrams in the deck.

---

## Sources (research underlying this plan)

The research bases of this plan are documented in detail in `research/01_CCM_Operations_Research.md` and `research/02_APCM_Research.md`, including:

- Centers for Medicare and Medicaid Services 2025 and 2026 Physician Fee Schedule Final Rules
- Medicare Learning Network Chronic Care Management Services booklet (MLN909188, June 2025)
- American Academy of Family Physicians Chronic Care Management coding guidance
- Mathematica/Journal of General Internal Medicine 2019 qualitative study on patient revocation drivers
- Glassdoor and Indeed reviews of CareHarmony, ChartSpan, CircleLink Health, and Cigna telephonic case manager roles
- AllNurses case management forum discussions
- Agency for Healthcare Research and Quality documentation burden technical brief
- American Association of Critical-Care Nurses documentation burden analysis
- KevinMD analysis of outpatient voicemail dynamics
- Welby Health analysis of Chronic Care Management panel-size math
