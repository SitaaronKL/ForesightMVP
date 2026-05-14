# APCM Operational Plan: Architecting for 500+ Per Nurse

**Author:** Dhruv Lalwani
**Prepared for:** Foresight Health interview (Tienlan Sun)
**Date:** May 14, 2026
**Companion docs:** CCM_Plan.md, PRD.md, Technical_Architecture.md, UIUX_Spec.md

---

## Executive summary

Tienlan's question 2 is the bigger one: Advanced Primary Care Management is essentially Chronic Care Management without the time-based billing requirement. How would you architect the system so each nurse can supervise 500 or more patients? How would you roll it out? What interfaces would you provide patients to deliver strong care and meet guidelines?

The headline answer. Advanced Primary Care Management removes the structural ceiling of Chronic Care Management at the regulatory layer (no time clock, service-element capability replaces minute logging) and Foresight removes the remaining ceiling at the workflow layer (artificial intelligence agent handles the supporting work, nurse owns the clinical conversation). The two unlocks compound. The math that broke at 300 patients with Chronic Care Management becomes tractable at 500+ with Advanced Primary Care Management plus the right operating system. The rollout is a transitional one, because Foresight already bills Chronic Care Management plus Principal Care Management today. The system supports all three billing programs in parallel, the patient cohort transitions program by program as eligibility is verified, and the panel grows as the operational compression lands.

The patient interfaces are a portal (read-only care plan summary, monthly statement in plain English, asynchronous messaging with the nurse), automated outreach via short message service and interactive voice response for routine touches, and a no-friction enrollment flow that emphasizes consent-time clarity to suppress the post-bill revocation pattern. The Advanced Primary Care Management "designated care team member" continuity requirement is satisfied by primary-nurse-plus-backup-pool attribution, with patients always seeing "your nurse is Sarah" while the system handles coverage.

This plan is structured around the four pillars Tienlan named: the architecture for 500+, the rollout sequence, the patient interfaces, and meeting Centers for Medicare and Medicaid Services guidelines.

---

## 1. Why Advanced Primary Care Management unlocks 500+

The constraint at 300 under Chronic Care Management is not nurse capability. It is the regulatory shape of the code itself. The Chronic Care Management billing code requires twenty cumulative minutes of clinical staff time per calendar month per patient, contemporaneously documented to the minute. Twenty minutes times 300 patients is 100 hours of pure clinical time per month, which is feasible on paper but breaks operationally once you add the supporting work (pre-call review, documentation, retries on unreachables, audit defense). Real per-patient effort is forty to sixty minutes. The math tops out somewhere around 300 patients per nurse before quality degrades.

Advanced Primary Care Management replaces minute logging with service-element capability. The Centers for Medicare and Medicaid Services 2025 Final Rule defines approximately eleven service elements the practice must be able to deliver to every enrolled patient: twenty-four hour access to care, continuity with a designated care team member, comprehensive care management, patient-centered care plan, management of care transitions, practitioner and home and community-based care coordination, enhanced asynchronous communication, patient population-level management, and performance measurement. Not every element must be delivered every month. They must be available, with delivery documented when the patient's situation triggers them.

The operational shift is enormous. Under Chronic Care Management, every patient needs twenty minutes of nurse attention to be billable. Under Advanced Primary Care Management, the nurse's attention flows to where it is needed clinically, while the system handles the lighter-touch monthly coverage for stable patients. A Level 1 Advanced Primary Care Management patient (one chronic condition or fewer) might generate one short personal call per month plus automated portal nudges plus an annual wellness visit; this is twelve to twenty minutes of nurse attention quarterly, not monthly. A Level 2 patient gets the traditional twenty-minute monthly conversation. A Level 3 patient (Qualified Medicare Beneficiary, two or more conditions, highest complexity) gets extended hands-on care with multiple touches per month. The pricing structure is tier-aware: G0556 for Level 1 (~$17 monthly), G0557 for Level 2 (~$54 monthly), G0558 for Level 3 (~$117 monthly, no patient cost-share because Qualified Medicare Beneficiaries are exempt).

The math at 500 patients with a typical mix (say 200 Level 1, 250 Level 2, 50 Level 3) lands around 200 Level 1 times 8 minutes = 1,600 min/month, 250 Level 2 times 30 minutes = 7,500 min/month, 50 Level 3 times 90 minutes = 4,500 min/month, totaling 13,600 minutes or 227 hours of nurse attention spread across the panel. That is more than 160-hour work month, but the system fills the gap by automating low-touch outreach (Level 1), pre-loading context (Level 2), and providing agent-drafted documentation (all tiers). With the artificial intelligence multiplier on the supporting work, the math closes.

---

## 2. Foresight's actual starting state (per Ian conversation)

Foresight today bills Chronic Care Management plus Principal Care Management. Not Advanced Primary Care Management. Principal Care Management is the sibling program for patients whose situation is dominated by a single severe condition (heart failure, end-stage renal disease, advanced chronic obstructive pulmonary disease, active oncology) rather than multiple chronic conditions. Most primary care practices bill a mix. The "300 to 500" framing in Tienlan's prompt is therefore the Chronic-Care-Management-plus-Principal-Care-Management-today to Advanced-Primary-Care-Management-tomorrow transition.

The product accommodates this. The schema models billing program as a discriminator on the patient record and on the billing record, with all three (Chronic Care Management, Principal Care Management, Advanced Primary Care Management) sharing the same patient, care plan, encounter, and documentation tables. A patient can move from one program to another month-over-month based on their clinical situation and Advanced Primary Care Management eligibility. The user interface is identical regardless of billing program; only the audit artifact (minute-log versus service-element attestation) and the dashboard's "what is due this month" computation change.

This matters for the rollout sequence. Foresight does not turn a switch and convert from Chronic Care Management to Advanced Primary Care Management overnight. The cohort transitions practice by practice, patient by patient, as Advanced Primary Care Management eligibility is verified (current Centers for Medicare and Medicaid Services requirement is participation in the Medicare Shared Savings Program, the Realizing Equity, Access, and Community Health model, Making Care Primary, or Primary Care First; this is expected to expand).

---

## 3. Architecture for 500+ (the design that makes it work)

### 3.1 Risk-tiered delivery model
Every patient on the panel has a tier assignment (Level 1, 2, or 3) that drives the expected monthly cadence and the share of nurse attention. The tier is computed from condition count, Qualified Medicare Beneficiary status, recent hospital events, and risk score; it can be overridden by the primary nurse for clinical judgment reasons. The dashboard displays the tier prominently on every patient row. The Morning Briefing prioritizes by tier and urgency.

### 3.2 Continuity with backup pool
Every patient has a designated primary nurse, satisfying the Advanced Primary Care Management "continuity with a designated care team member" service element. The patient knows the primary nurse's name and sees it on the patient portal. But the primary nurse is supported by a backup pool of two to three colleagues who can cover during paid time off, weekends, and triage. The system enforces continuity-first attribution (the primary nurse handles the majority of touches) without making the patient-nurse relationship brittle.

### 3.3 Service-element capability layer
Rather than per-encounter time logging, the system tracks per-patient-per-month service-element delivery. Eleven element rows per patient per month, each with status (not yet, available, delivered) and evidence (link to the encounter, document, message, or care plan update that constitutes proof). The audit artifact is generated automatically at month end; the practice does not need to assemble it manually. The nurse sees a coverage view on the dashboard ("87% of your panel has 8 of 11 elements covered for this month") and the agent surfaces specific gaps in the Morning Briefing.

### 3.4 Population-level management surfaces
A required service element. The system has a panel-wide analytics view that shows risk distribution across tiers, gap-closure status for preventive services (hemoglobin A1c, Annual Wellness Visit, immunizations, screenings), reach rate by month, and recent hospital event clustering. The agent runs a scheduled scan monthly to flag missing preventive services and surface them to the nurse as one-click outreach campaigns. This is the regulatory feature most legacy Chronic Care Management platforms do not have, and the one most needed to defend Advanced Primary Care Management claims under audit.

### 3.5 Enhanced asynchronous communication channels
Patient portal messaging, short message service reminders, interactive voice response confirmations. The Advanced Primary Care Management "enhanced communication" service element is satisfied by maintaining and using these channels, not by any specific message volume. The patient portal is read-write for the patient (they can message their nurse, request a refill, confirm an appointment), the short message service channel is automated for low-content reminders, and the interactive voice response handles "please confirm your appointment, press 1 for yes" style flows. All three channels generate audit-ready evidence that the practice is providing enhanced communication.

### 3.6 Care transitions automation
Hospital event feed (Admission, Discharge, Transfer) drops events into the patient record. Discharge events trigger a forty-eight-hour transition-of-care deadline (Advanced Primary Care Management requires clinical information exchange within seven business days; we target two days to be safe). The Morning Briefing surfaces patients with closing transition windows at the top of the day's queue. The nurse makes the call, the system records the transition-of-care touch as evidence on the service-element row for that month.

### 3.7 Documentation as a byproduct, not an effort
Voice transcription plus large language model drafting reduces per-encounter documentation time from fifteen to twenty minutes (industry baseline) to one to three minutes of review. With Advanced Primary Care Management's removal of time logging, the audit pattern shifts from "did the nurse really spend twenty minutes" to "did the practice deliver the eleven service elements," and the latter is satisfied by the workflow data rather than separate documentation. The nurse never does audit preparation. The system assembles audit packets on demand.

### 3.8 The agent multiplier
Every non-artificial-intelligence lever above has an artificial intelligence companion that compounds it. Risk stratification is supported by an agent-computed risk score. Continuity is supported by the agent's per-nurse panel-aware behavior. Service-element coverage is supported by agent-generated gap reports. Population-level analytics are supported by agent-generated insight summaries. Care transitions are supported by agent-drafted seven-day follow-up notes. Communication is supported by agent-drafted outreach messages. Documentation is supported by agent transcript-to-Subjective-Objective-Assessment-Plan drafting.

---

## 4. Patient interfaces

Tienlan asked specifically what interfaces we would provide patients. Four surfaces.

### 4.1 The patient portal
Web application, mobile-responsive. The patient logs in (lightweight authentication: phone or email with one-time code, lower friction than passwords for a 65+ user base) and sees:

- **Their care plan summary**, written in plain English. Not the structured clinical document the nurse edits, but a one-page version: "Your goals this quarter are X, Y, Z. Your medications are listed below. Your next scheduled appointment is on date. Things to watch for: A, B, C. If you experience symptom D, call us immediately."
- **A monthly statement**. Plain English breakdown: "In April, your nurse Sarah spent 22 minutes on your care. Here is what she did: refilled your metformin, called your cardiologist about the echo result, updated your care plan with the new blood pressure goal. Medicare paid us $54. Your share is $11."
- **A message thread with their nurse**. Asynchronous, secure messaging. The patient can ask questions, request refills, share concerns. The nurse sees portal messages on her dashboard and responds. The agent drafts initial responses for the nurse to review.
- **An "ask a question" surface** for non-message inquiries. Drafts go to the nurse for review before sending. This is where the patient might ask "what does this lab result mean," and the nurse approves a plain-English answer.

### 4.2 Short message service touchpoints
For patients who prefer text over portal logins (a substantial fraction, especially among caregivers managing parent accounts), the system sends short message service reminders for appointments, refill availability, screening due dates, and check-in prompts. Inbound short message service messages are routed to the nurse's dashboard as portal-message equivalents. No special application needed; works on a feature phone.

### 4.3 Interactive voice response for confirmations
"Hello, this is Foresight Health calling on behalf of Dr. Singh's office. We're calling to confirm your appointment tomorrow at 2pm. Press 1 to confirm, 2 to reschedule." Replaces the nurse's time on routine confirm-or-reschedule calls. Drawn in the Excalidraw as a future state; not in the Minimum Viable Product build.

### 4.4 No-friction enrollment with cost-share clarity
The enrollment surface is a single page that takes the patient through the four eligibility checks (Medicare beneficiary, two or more chronic conditions or one severe single, established primary care relationship, no concurrent enrollment elsewhere), the consent disclosures (right to revoke, cost-share, single-practitioner), and a cost calculator personalized to their supplemental coverage ("Your Medigap plan covers Part B coinsurance, so your expected monthly cost is $0," or "You do not have supplemental coverage, so your expected monthly cost is approximately $11"). Patients sign electronically. The audit-ready consent record is stored, attributed, timestamped.

This is the single most-leverage intervention for retention. The 2019 Mathematica study found that the largest revocation driver was the post-bill surprise, not the bill amount. When the patient sees the number at consent and agrees, they do not revoke.

---

## 5. Meeting Centers for Medicare and Medicaid Services guidelines

Advanced Primary Care Management is more permissive than Chronic Care Management on workflow but stricter on service-element capability. The system needs to demonstrate, for each enrolled patient each month, that the practice was capable of delivering all eleven elements, and that the elements actually delivered are documented with evidence.

### 5.1 The service-element row table
A single table with one row per (patient, month, element). Eleven elements, twelve months, hundreds of patients per nurse, generating thousands of rows. The audit query is straightforward: select rows where status equals "delivered" with evidence, plus rows where status equals "available" with the practice attestation. The agent generates the attestation evidence (a brief paragraph explaining how the practice provides each element generally) once per practice, reused across patients.

### 5.2 Continuous documentation through the workflow
Every encounter, message, care plan revision, and outreach touch generates a row in its respective table with timestamp, attribution to the human who performed it, and link to the patient. The audit artifact is assembled at query time, not as a separate step. Centers for Medicare and Medicaid Services auditors typically request: enrolled patient list, monthly billing records, care plans, consent records, documentation evidence for each billing month. All five queries run against the live tables.

### 5.3 Population-level performance measurement
Advanced Primary Care Management requires the practice to report quality measures, either via the Merit-based Incentive Payment System Value Pathway program (if not accountable-care-organization-attributed) or via accountable care organization quality measure submission (if attributed). The system captures the electronic clinical quality measure data points natively (hemoglobin A1c values, blood pressure readings, screening completions, vaccination records) so the quarterly or annual reporting is a query, not a separate effort.

### 5.4 Care transitions deadlines
For each hospital discharge, the seven-business-day clinical information exchange deadline is tracked. Discharges that fall outside the window are flagged for the nurse. The audit defense is: the discharge happened on date X, the seven-day window closed on date Y, the practice's clinical information exchange happened on date Z, here is the evidence.

### 5.5 Designated practitioner attribution integrity
The patient's "designated practitioner" (primary care physician of record) is tracked over time. When a patient transfers practices, a transfer record captures the attribution change with consent. Centers for Medicare and Medicaid Services prohibits two practitioners billing Advanced Primary Care Management for the same patient in the same month. The system enforces this at the billing-record creation step.

### 5.6 Concurrent code conflicts
Advanced Primary Care Management cannot be billed in the same month as Chronic Care Management, Principal Care Management, or Transitional Care Management for the same patient. The system enforces this at the billing-record write. Concurrent billing with Remote Physiologic Monitoring, Remote Therapeutic Monitoring, and behavioral health integration is permitted; the system allows these stacks to compose.

### 5.7 Cost-share enforcement
For Level 3 patients (G0558, Qualified Medicare Beneficiaries), the system records that the patient is Qualified Medicare Beneficiary and that no cost-share applies. The monthly statement to the patient shows $0 owed. The billing record reflects the cost-share waiver. Auditors verify this for compliance with the federal Qualified Medicare Beneficiary protection rules.

---

## 6. Rollout sequence

The rollout is concrete and time-phased. Each phase has measurable success criteria.

### Phase 1: Internal pilot (Month 0 to 1)
Single nurse, single physician at one primary care practice partner. Twenty Chronic Care Management or Principal Care Management patients (the partner's existing panel) migrated to the new workspace. Goal: validate the unified workspace, pre-call context loading, voice-to-Subjective-Objective-Assessment-Plan flow, audit artifact assembly. Success: nurse reports per-encounter documentation time below ten minutes (down from fifteen to twenty), reach rate at or above sixty percent (the partner's baseline).

### Phase 2: Full panel (Month 1 to 3)
Expand to all three nurses at the partner practice, full panel of approximately 900 Chronic Care Management plus Principal Care Management patients. Roll out the Master Agent, the Morning Briefing, the patient portal, the monthly statements. Success: reach rate above seventy-five percent, documentation time below five minutes, patient revocation rate below eight percent monthly, all three nurses report subjective improvement in panel manageability.

### Phase 3: Advanced Primary Care Management transition (Month 3 to 5)
The partner practice joins an accountable care organization (or already participates in one). Begin transitioning eligible patients from Chronic Care Management or Principal Care Management billing to Advanced Primary Care Management billing. Per-patient transition: verify Advanced Primary Care Management eligibility, re-consent for the new program (one-time, captured electronically), update the patient's billing program assignment in the system, allocate to a tier (Level 1, 2, or 3). Patients ineligible for Advanced Primary Care Management (typically because the practice's accountable care organization status is in flux) remain on Chronic Care Management or Principal Care Management; the system supports both running in parallel. Success: at least seventy percent of eligible patients transitioned, audit-defensible service-element attestation generated for the first Advanced Primary Care Management claims batch.

### Phase 4: Panel expansion (Month 5 to 9)
With operational compression proven, panel sizes per nurse expand from 300 to 400 to 500. Hire one additional nurse to absorb the growth as patients are added. Add a second partner practice to validate cross-practice variability. Success: nurses sustainably hold 500-patient panels with documented quality metrics matching or exceeding industry benchmarks. Patient revocation rate trends down (consent-time clarity working).

### Phase 5: Multi-practice scale (Month 9 to 18)
Generalize. Expand to five or more partner practices. Standardize the onboarding sequence for new practices (typically two to four weeks from contract to first billable Foresight-managed encounter). Begin marketing the documented panel size, reach rate, and quality metrics to additional accountable care organizations.

---

## 7. Risks and mitigations

### Risk: Advanced Primary Care Management adoption is gated by accountable care organization participation
Centers for Medicare and Medicaid Services currently limits Advanced Primary Care Management to practitioners in the Medicare Shared Savings Program, the Realizing Equity, Access, and Community Health model, Making Care Primary, or Primary Care First. Practices outside these programs cannot bill Advanced Primary Care Management. Mitigation: support Chronic Care Management plus Principal Care Management as parallel billing programs in the system, do not architect away from them. Foresight can serve practices regardless of accountable care organization status, with the transition to Advanced Primary Care Management as a future state when their practice's status changes or Centers for Medicare and Medicaid Services expands eligibility.

### Risk: The eleven service elements are open to interpretation by auditors
Centers for Medicare and Medicaid Services has not published canonical audit guidance for Advanced Primary Care Management as of mid-2026. Practices submitting early Advanced Primary Care Management claims face some interpretation risk. Mitigation: design the service-element attestation to be conservative (capture evidence beyond what is likely required), maintain a parallel optional minute-log on Advanced Primary Care Management encounters so that if Centers for Medicare and Medicaid Services later imposes a soft floor, the practice has the data.

### Risk: Patient revocation under Advanced Primary Care Management Level 1 and 2 due to cost-share
Level 3 patients (Qualified Medicare Beneficiaries) pay nothing. Level 1 and 2 patients pay roughly $3 and $11 monthly respectively (twenty percent of $17 and $54). The same revocation pattern as Chronic Care Management applies. Mitigation: consent-time clarity (the cost calculator), monthly itemized statements, deliberate enrollment of supplemental-insurance-having patients first (they pay $0), patient education on the value received.

### Risk: Designated care team member continuity hard to maintain at scale
Advanced Primary Care Management requires the patient have a designated care team member with successive routine appointments. If nurses turn over or burn out, this is hard to honor. Mitigation: continuity-first attribution with backup pool, nurse retention as an operational metric (industry baseline at vendor shops is below six months; Foresight should target above eighteen months), patient transitions documented and explained when the primary nurse changes.

### Risk: Care transitions seven-day window is tight
Hospital discharges happen on Friday evenings. The seven-day clinical information exchange clock is calendar days, not business days. Mitigation: care transitions queue gets priority surfacing in the Morning Briefing, backup pool covers weekends, agent drafts the seven-day follow-up note in advance so the nurse can confirm and send rather than draft from scratch.

### Risk: Audit failure on early Advanced Primary Care Management claims
First-batch claims often face higher scrutiny. Mitigation: deliberate over-documentation on the first three months, pre-audit by the practice's billing team before submission, agent-generated audit packet reviewed by the practice manager.

---

## 8. What the patient experiences

The patient view of Advanced Primary Care Management feels qualitatively different from Chronic Care Management. A walk-through:

**Day of enrollment.** Patient is offered enrollment during an Annual Wellness Visit. The nurse (or front desk) walks them through the enrollment screen on a tablet: their eligibility (already confirmed), the eleven service elements they will receive, the cost calculator showing their expected monthly cost given their supplemental coverage. Patient signs electronically. The system creates the consent record, attributes them to the primary nurse, sets their tier provisionally.

**First week.** Patient receives a welcome message in the portal (or by short message service if they prefer): "Welcome to our care management program. I'm Sarah, your nurse. Here's what to expect: monthly check-in calls, a written care plan we'll review together, easy access to message me with questions. Your first call will be on date X." Sarah's photo, name, and contact preferences are visible in the portal.

**Monthly cadence.** Patient receives a short message service reminder the day before their scheduled call, the day of, and an hour before. Sarah calls. Call is twenty to thirty minutes. After the call, the patient receives a portal notification: "Sarah updated your care plan today. Here's what changed and why." Patient can view the updated plan in the portal.

**Recurring touchpoints.** Refill requests via portal or short message service get answered within twenty-four hours. Symptom concerns trigger a same-day or next-day nurse callback. Lab results are explained in plain English in a portal message. Hospital discharges trigger a transition-of-care call within forty-eight hours (with the seven-day Centers for Medicare and Medicaid Services window as the regulatory ceiling).

**Monthly statement.** End of each month, the patient receives a plain-English summary: "In May, Sarah spent 24 minutes total on your care, across 1 call and 3 portal messages. Here's what she did: [bullet list]. Medicare paid us $54. Your supplemental insurance covered $11. Your share is $0." No surprise.

**Annual review.** Once per year, Sarah does a comprehensive care plan review, often during the Annual Wellness Visit. Patient signs off on the updated plan.

The qualitative difference from typical Chronic Care Management programs is that the patient sees the nurse as a real person who knows them, sees the value being delivered, and never gets a surprise bill. The trust compounds over months and years.

---

## 9. The interview narrative

If Tienlan asks "how would you architect for 500+ and roll it out," the response should land roughly like this.

The architecture has three layers. The regulatory layer is Advanced Primary Care Management itself: tier-aware billing without minute logging removes the structural ceiling. The operational layer is risk-stratified care delivery with continuity-first attribution, audit-ready by default, with the eleven service elements computed from the workflow rather than tracked separately. The compression layer is the artificial intelligence multiplier: agent-drafted documentation, agent-assembled Morning Briefings, agent-generated population gap reports. Each layer makes the next possible.

The rollout is gradual and patient-by-patient, not all-at-once. We support Chronic Care Management, Principal Care Management, and Advanced Primary Care Management in parallel because the practice's accountable care organization status, the patient's eligibility, and the regulatory environment are all in flux. The system transitions cohorts as eligibility lines up. Phase 1 is internal pilot, Phase 2 is full single-practice deployment, Phase 3 is Advanced Primary Care Management transition, Phase 4 is panel expansion to 500, Phase 5 is multi-practice scale. Each phase has measurable success criteria so we know we are not declaring victory prematurely.

The patient interfaces are a portal, short message service touchpoints, future interactive voice response, and a no-friction enrollment with cost-share clarity. The most important interface is the consent screen, because retention is mostly won or lost there. Patients who see the cost number and agree do not revoke. Patients surprised by the first bill do.

Centers for Medicare and Medicaid Services guidelines are met by the service-element row table (one row per patient per month per element), continuous workflow documentation with attribution, native capture of electronic clinical quality measure data points, care transitions deadline enforcement, designated practitioner attribution integrity, and concurrent-code-conflict guardrails. The audit artifact is a query, not a separate effort.

The honest framing is that this is a compounding system. Non-artificial-intelligence operational design (twelve levers in the Chronic Care Management plan) carries most of the unlock. Artificial intelligence is the multiplier. Advanced Primary Care Management is the regulatory unlock that lets both layers operate at their full potential. The 500-patient nurse is the natural output of all three working together; it is not achieved by any single intervention.

---

## Companion docs

- **CCM_Plan.md**: the operational plan for running Chronic Care Management at 300 patients today, including the twelve non-AI levers and the AI multipliers.
- **PRD.md**: the product requirements for the six Minimum Viable Product flows.
- **Technical_Architecture.md**: the full schema, agent surface, tech stack with alternatives.
- **UIUX_Spec.md**: design language and screen inventory.
- **design/Excalidraw_Specs.md**: text specifications for the diagrams.

---

## Sources

The detailed citations for the regulatory and operational claims in this plan are in `research/02_APCM_Research.md`, including:

- Centers for Medicare and Medicaid Services 2025 and 2026 Physician Fee Schedule Final Rules (CMS-1807-F, CMS-1832-F)
- Centers for Medicare and Medicaid Services Advanced Primary Care Management Services page
- American Academy of Family Physicians coding guidance for Advanced Primary Care Management
- National Association of Community Health Centers Advanced Primary Care Management reimbursement tip sheet
- Federal Register publications of the Final Rules
- Foley & Lardner and DLA Piper legal analyses of the new Healthcare Common Procedure Coding System codes and behavioral health integration add-ons
- Pearl Health, Aledade, and Prevounce industry analyses of Advanced Primary Care Management
- Centers for Medicare and Medicaid Services Innovation Center Making Care Primary model evaluation materials
