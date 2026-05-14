**Chronic Care Management Operations**

*A field briefing on how the program actually runs, who it strains, and
where it breaks*

Prepared for: Foresight Health interview (Tienlan Sun) • May 2026 •
Dhruv Lalwani

**The 30-second version (plain English)**

Your mental model is correct. Picture each nurse holding 300 patients
(think 300 nodes on a screen), and every patient moves through the same
four-stage flow each month: eligibility → consent → care → billing. Most
of the operational pain lives in the "care" stage, which is what
Tienlan's prompt zeroes in on.

**Quick glossary**

-   **Beneficiary =** a Medicare patient. Mostly people 65 and older,
    plus some younger people on Medicare for disability. Not the same as
    "customer" or "consumer"; in this world they are the patient.

-   **Two or more chronic conditions =** examples include diabetes +
    high blood pressure, heart failure + chronic obstructive pulmonary
    disease, depression + arthritis, kidney disease + diabetes,
    dementia + atrial fibrillation. Most Medicare beneficiaries 65+ have
    two or more by default.

-   **Clinical practice =** a doctor's office, typically a primary care
    or family medicine clinic. Chronic Care Management is a
    primary-care-led program, not a hospital program.

-   **Care (the verb) =** for Chronic Care Management, this is mostly a
    roughly-monthly phone call from a nurse to the patient. The nurse
    checks symptoms, refills prescriptions, coordinates with
    specialists, follows up on labs, and updates the care plan. It is
    not a doctor visit.

-   **The 20-minute rule =** Medicare only pays for that month if the
    nurse logs at least 20 documented minutes per patient (the minutes
    can be one long call or accumulated across the month).

-   **General physician supervision =** the supervising doctor does not
    have to be in the room. They just have to be reachable by phone. The
    nurse runs the workflow.

-   **Audit risk =** Medicare can review records after the fact and claw
    back payments if the documentation is sloppy. This is where the
    "contemporaneous" (logged as you do it, not reconstructed at
    end-of-day) part bites.

**Why 300 patients is the practical ceiling**

The math at a glance:

-   300 patients × 20 minutes = 6,000 minutes of pure call time per
    month = 100 hours.

-   A full-time work month is roughly 160 hours (40 hours × 4 weeks).

-   On paper that leaves 60 hours for everything else. Plenty of room.

-   But the 20-minute call is only one part of the per-patient effort.
    Add: pre-call chart review (5--10 min), the call itself (20--30 min
    if it goes long), live documentation (10--15 min), follow-up tasks
    like prescription messages or specialist referrals (5--15 min).
    Realistic per-patient effort is 40--60 minutes.

-   40 minutes × 300 patients = 200 hours/month. That already exceeds a
    full-time month.

-   Now layer in the retries on unreachable patients (one in three
    patients on average), audit prep, team meetings, training, paid time
    off, and the long-windedness of the Mrs. Smith who calls back. The
    day stops working.

That is what people mean when they say "the time clock is the problem."
The 20-minute floor sounds modest, but because Medicare requires it be
billed per-patient per-month, and because the documentation overhead is
roughly the same regardless of conversation depth, every minute of call
time multiplies the workload by a factor of 2--3 once you add the
supporting work. Software can compress that multiplier. The successor
program (Advanced Primary Care Management, the "new monthly thing" that
started in January 2025) drops the clock entirely, which is why everyone
in this space is moving toward it.

**Where Principal Care Management fits**

Chronic Care Management is for patients with two or more chronic
conditions. There is a sibling program called Principal Care Management
(Principal Care Management, Current Procedural Terminology codes
99424--99427) for patients with a single chronic condition that is
severe enough to warrant active care management on its own. Many primary
care practices, including Foresight per your conversation with Ian, bill
both Chronic Care Management and Principal Care Management today,
depending on the patient. Advanced Primary Care Management is the 2025
program that effectively bundles Chronic Care Management, Principal Care
Management, and Transitional Care Management together and drops the
time-tracking requirement. So the path you'll hear talked about is:
today Chronic Care Management + Principal Care Management, tomorrow
Advanced Primary Care Management.

**The short version (operator framing)**

Chronic Care Management is a Medicare program that pays a primary care
practice (the doctor's office) a small monthly fee for managing the care
of beneficiaries (Medicare patients, mostly 65+) with two or more
chronic conditions (think diabetes + high blood pressure, chronic
obstructive pulmonary disease + heart failure, depression + arthritis),
on the condition that a nurse or other clinical staff spends at least
twenty contemporaneously documented minutes (timestamped, logged live,
not reconstructed at end of day) per month coordinating that care under
general physician supervision (doctor available by phone, not required
to be on-site). The economics work at scale, the audit risk is real, and
the operational ceiling for a single nurse sits around three hundred
patients per panel. The constraint is not nurse capability; it is the
time clock that sits underneath every billable minute. The successor
program (Advanced Primary Care Management, live since January 2025)
removes the time clock entirely and is the reason this interview is
happening.

**1. What Chronic Care Management Is and Why It Exists**

the Centers for Medicare and Medicaid Services launched the Chronic Care
Management benefit in 2015 to pay primary care for the non-face-to-face
work that already happened informally between visits: prescription
refills, specialist coordination, social-services referrals, medication
reconciliation, and the long phone calls a patient or family member
needed at 6 p.m. on a Tuesday. The agency expanded the benefit with new
codes in 2017, 2022, and 2024. The 2026 Medicare Physician Fee Schedule
Final Rule (CMS-1832-F) increased the entire family of care-management
codes by approximately ten percent.

The simplest way to understand the program is that it is a payment for
time spent caring for a patient outside an office visit, documented to
the minute, owned by one designated practitioner per patient per month.

**2. How the Program Works (Codes, Rates, Performers)**

Medicare uses billing codes (Current Procedural Terminology codes) to
specify what was done and how much it pays. The Chronic Care Management
code family covers three flavors: non-complex Chronic Care Management
(the 99490 codes, which is the standard 20-minute monthly nurse-led
service), physician-personally-performed Chronic Care Management (99491,
when the doctor does the time themselves), and complex Chronic Care
Management (99487, for high-complexity patients needing a full hour).
The clinical-staff codes (99490, 99439, 99487, 99489) are performed by
registered nurses (registered nurses), licensed practical nurses
(licensed practical nurses), medical assistants (medical assistants),
licensed clinical social workers (licensed clinical social workers), or
clinical pharmacists --- incident-to a billing physician under general
supervision. Incident-to means the work is billed under the physician's
National Provider Identifier (provider ID) even though the nurse
performed it. General supervision means the physician must be available
by phone but does not need to be physically on-site.
Physician-personally-performed codes (99491, 99437) require the billing
doctor to render the time themselves and cannot be delegated.

  ------------------------------------ ------------------------------------------------------------------------------ ----------- --------------------------------------------------------------------------------- --------------- --------------- -----------
  **Current Procedural Terminology**   **Description**                                                                **Time**    **Performer**                                                                     **2025 rate**   **2026 rate**   **Limit**
  99490                                Non-complex Chronic Care Management, base code                                 20 min/mo   Clinical staff, general supv                                                      \$60.49         \$66.30         1/mo
  99439                                Add-on to 99490                                                                +20 min     Clinical staff                                                                    \$45.93         \$50.56         Max 2x
  99491                                Physician/qualified healthcare professional-provided Chronic Care Management   30 min/mo   physician/nurse practitioner/physician assistant/clinical nurse specialist only   \$82.16         \~\$89          1/mo
  99437                                Add-on to 99491                                                                +30 min     physician/nurse practitioner/physician assistant/clinical nurse specialist only   \$57.58         \~\$63          
  99487                                Complex Chronic Care Management (moderate-to-high medical decision making)     60 min/mo   Clinical staff                                                                    \$131.65        \~\$145         1/mo
  99489                                Add-on to complex 99487                                                        +30 min     Clinical staff                                                                    \$70.52         \~\$77          
  ------------------------------------ ------------------------------------------------------------------------------ ----------- --------------------------------------------------------------------------------- --------------- --------------- -----------

Rates above are 2026 national averages, non-facility. Geographic
adjustment (Geographic Practice Cost Index) shifts them roughly ten to
fifteen percent in either direction. Source of truth for cents-accurate
figures is the Centers for Medicare and Medicaid Services Physician Fee
Schedule Look-up Tool. The June 2025 Medicare Learning Network booklet
(MLN909188) is the official program guide.

**2.5 The Principal Care Management Sibling (Principal Care
Management)**

Worth knowing because Foresight bills both: Principal Care Management
(Principal Care Management, Current Procedural Terminology codes
99424--99427) is the same idea as Chronic Care Management but for
patients with a single chronic condition that is severe or unstable
enough to warrant its own monthly care management --- examples include
uncontrolled heart failure, advanced chronic obstructive pulmonary
disease, end-stage renal disease, or active oncology care. The structure
mirrors Chronic Care Management: 30 minutes of clinical staff time per
month, documented contemporaneously, under general physician
supervision. The dividing line is patient profile: Chronic Care
Management for the patient with 2+ conditions managed broadly, Principal
Care Management for the patient with 1 condition managed intensively. A
practice can bill Chronic Care Management or Principal Care Management
on a given patient in a given month, but not both. Advanced Primary Care
Management (covered in the companion paper) is the 2025 program that
effectively bundles Chronic Care Management and Principal Care
Management together and removes the time requirement entirely. For the
interview: when Tienlan says "Chronic Care Management," he likely means
the broader Chronic Care Management-plus-Principal Care Management
workflow that Foresight runs today, not literally only the 99490 family.

**3. Patient Eligibility, Consent, and Care Plan**

**Eligibility**

The patient must be a Medicare beneficiary (Medicare patient, mostly
65+) with two or more chronic conditions expected to last at least
twelve months or until the patient's death. The conditions must place
the patient at significant risk of death, acute exacerbation or
decompensation (sudden worsening, like a heart failure flare requiring
the emergency room), or functional decline (loss of the ability to do
things they used to do, like walking unaided or managing their own
medications). A face-to-face initiating visit (an evaluation and
management office visit, Annual Wellness Visit, or Initial Preventive
Physical Examination) must have occurred in the prior twelve months for
any new patient. This is why eligibility is step one of the four-stage
flow: the practice has to confirm the patient is on Medicare, has the
right conditions, and was seen in person within the last year.

**Consent**

Step two of the four-stage flow. Consent must be obtained before Chronic
Care Management begins and any time a new billing practitioner (the
doctor of record) takes over. Verbal or written is acceptable, but it
must be documented in the medical record. The documented consent must
inform the patient of (a) the right to revoke at any time, (b) the
existence of the twenty percent Part B coinsurance (the patient's
out-of-pocket share, roughly \$7--\$10 per month for the standard
Chronic Care Management code, which Medicare does not cover and which is
the single biggest reason patients drop the program), and (c) the rule
that only one practitioner may bill Chronic Care Management in a given
month. the American Medical Association guidance is explicit that
re-consent is not required monthly --- once is enough unless the billing
doctor changes.

**Care Plan**

The care plan is the central document that defines step three (the
"care" stage) of the four-stage flow. It must be electronic, accessible
to the entire care team twenty-four hours a day (including covering
clinicians and locum tenens --- temporary fill-in doctors), shared with
the patient on paper or electronically, and shared electronically (not
by fax) with other treating clinicians. Auditors look for substance over
template adherence: problem list (the active conditions), expected
outcomes and prognosis (where this is going), measurable treatment goals
(e.g., "hemoglobin A1c under 7.5 by Q3"), symptom management plan,
planned interventions and the person responsible (which member of the
care team owns what), medication management, community and social
services ordered (like home health, meal delivery, transportation), plan
for coordination with other providers (specialists, pharmacy), and a
schedule for periodic review.

**4. The Operational Reality of a Chronic Care Management Nurse**

**The 20-minute clock is both a floor and a ceiling**

On paper the rule is simple: a clinical staff member must spend twenty
cumulative minutes per calendar month on non-face-to-face care
coordination per enrolled patient to bill 99490. In practice nurses
describe a double bind in employee reviews. At one major Chronic Care
Management vendor (ChartSpan), reviewers report being penalized for
going over the threshold while simultaneously being penalized for not
hitting it. The economics of the code create an incentive to hit twenty
minutes exactly, which is the single most common audit red flag because
it is statistically implausible.

> *"If you spend more than 20 minutes on a patient you are penalized\...
> if you don't get enough minutes in each day, you get in trouble."* ---
> ChartSpan Patient Care Coordinator, Indeed review

**Documentation eats the clinical time**

the Agency for Healthcare Research and Quality and the American
Association of Critical-Care Nurses data put roughly eighteen percent of
a twelve-hour shift on charting alone, and Chronic Care Management
stacks specialized time-tracking on top. Industry analysis converges on
the same point: the twenty minutes of patient-facing time does not
account for documentation, care plan updates, coordination calls with
specialists, follow-up scheduling, and the administrative work that
surrounds every clinical touchpoint. A one-touch twenty-minute call is
typically thirty-five to forty-five minutes of real nurse time.

**Outreach is futile in batches**

Twenty to forty percent of monthly outreach attempts go to voicemail or
no-answer. Programs typically allow three attempts across different days
and times before flagging a patient unreachable for the month. KevinMD's
2026 review of outpatient voicemail dynamics frames the staff side of
this clearly: messages accumulate during the busy parts of the day and
are returned in batches hours later, by which time the patient is
unavailable, context is lost, or the underlying issue has escalated.

> *"Panel size is way too large for a nurse. 200+ should not be the size
> for any nurse. First calls required to be completed in 2 weeks."* ---
> CareHarmony Care Coordinator, Glassdoor

**The day-in-the-life**

A typical Chronic Care Management nurse logs in to a stack of two
systems: an electronic medical record (electronic medical record, the
doctor's charting software, often Epic or eClinicalWorks) and a Chronic
Care Management platform layered on top (a workflow tool like
ThoroughCare or ChartSpan that handles the time-tracking, outreach
queue, and care plan separately from the electronic medical record). She
also has a call queue (the list of patients to dial today). The
expectation at vendor-led shops is fifteen to twenty unique patient
touches per day as a floor, with some job postings requiring fifty
outbound calls. A good call is patient-driven and substantive:
medication change, symptom flare, scheduling a specialist follow-up. A
bad call is forty-five minutes with a patient who is lonely, repeating
issues the nurse has already documented twice this quarter --- and the
system is silently logging it as the same minutes as a good call. The
2020 telephone-nurse study found exactly this pattern, including the
cognitive trap where familiarity makes nurses worry about missing
something urgent inside a familiar caller's monologue.

**5. Industry Benchmarks: Panels, Pay, and Plateau**

**Panel size is the single most contested number**

The vendor-side claim is that one care manager can hold five hundred
patients in a tech-enabled program; the nurse-side reality is that even
two hundred is unsustainable manually. Welby Health's analysis puts the
manual ceiling at eighty to one hundred fifty before quality degrades
and documentation gets sloppy. Phamily's benchmark of five hundred per
full-time equivalent assumes meaningful automation. The three hundred
number Foresight uses in its prompt sits exactly at the floor where the
math works on a spreadsheet and exactly at the point nurses begin
breaking on the job.

**Pay and turnover signal the strain**

Care coordinators at the major vendors report wages in the twenty-three
to twenty-eight dollar per hour range, often without benefits at
1099-classified shops like CircleLink. ChartSpan employees on Glassdoor
describe new-hire cohorts of twenty to thirty people in which only five
remain past month three. Recommend-to-a-friend numbers on Glassdoor sit
at thirty-five percent for ChartSpan and twenty-eight percent for
CareHarmony.

**Vendor landscape**

The market splits along a service-vs-software axis. ChartSpan and
CareHarmony run full-service models where they staff the nurses, take a
revenue share of thirty to fifty percent of Chronic Care Management
reimbursement, and operate twenty-four-seven triage lines. ThoroughCare
and Prevounce sell software only; the practice keeps more of the
per-patient revenue and hires its own nurses. Phamily, HealthSnap,
Signallamp, HumHealth, HealthArc occupy the hybrid middle. Signify
Health (CVS-owned since 2023) is adjacent rather than direct, focused on
in-home health evaluations. Foresight Health is a different shape
entirely: it is the provider, not a vendor, augmenting an in-house
clinical team with an artificial intelligence agent (Emi) and selling
care, not software.

**Adoption is wide-open**

Roughly four percent of the twenty-two and a half million Chronic Care
Management-eligible Medicare beneficiaries are enrolled, with 6.5
million Chronic Care Management claims in 2023 averaging 5.1 claims per
beneficiary (Avalere). A primary care practice with two hundred enrolled
patients generates roughly one hundred fifty-eight thousand dollars in
annual gross Chronic Care Management revenue. The total addressable
market if fully penetrated is north of fifteen billion dollars.

**6. Where Chronic Care Management Breaks (Voice of the Nurse)**

**The recurring themes**

-   **Scripted, timed calls feel inhuman.** Coordinators describe being
    "expected to be a robot solely for metrics' sake." (Glassdoor:
    ChartSpan).

-   **The 20-minute clock is a double bind.** Pressure to hit it,
    pressure not to exceed it, audit risk if round numbers repeat.

-   **Documentation drag dominates the day.** Nurses describe entering
    the same patient data into two systems. Tool stacking is the real
    workflow problem.

-   **Coinsurance attrition.** The 2019 Mathematica/the Journal of
    General Internal Medicine qualitative study found patients revoking
    after seeing the twenty percent coinsurance bill. About half of
    patients with supplemental insurance said they would not have
    consented if they had to pay out of pocket.

-   **Audit anxiety is a daily emotion, not a quarterly event.** Vague
    entries ("care coordination, 20 minutes") are the number one finding
    in the Centers for Medicare and Medicaid Services reviews. Practices
    have faced clawbacks.

-   **Don't automate the relationship.** CircleLink's positive reviews
    specifically cite the long-term relationships formed through monthly
    calls. Anything that dilutes the patient-nurse trust will be
    rejected. The framing that lands with nurses is "I'm protecting your
    time with Mrs. Smith," not "I'm replacing your call with Mrs.
    Smith."

**Vocabulary that signals you have done the work**

Panel (never "caseload" --- case management is a different role). Reach
rate. Unreachable patients. Touches. Billable minutes. Non-face-to-face
time. Care plan. The 20-minute threshold or "the clock." Coinsurance
pushback. Contemporaneous documentation. Recovery Audit Contractor
audit. Outreach queue. Disposition. Revocation.

**7. Implications for the Foresight Question**

Tienlan's prompt asks how every nurse can call and care for their full
panel every month. Reading the research, three things are true at once:

-   First, the 300-patient panel does not break because nurses are
    unskilled or unwilling. It breaks because the structure of the code
    forces twenty minutes of stopwatch-counted, documentation-heavy
    effort per patient per month, and twenty minutes times three hundred
    is one hundred hours of patient-facing time alone in a four-week
    workmonth that has roughly one hundred sixty hours of actual
    capacity. Coordination, documentation, retries, audit prep, and paid
    time off fit into the remaining sixty hours. The math is
    structurally fragile.

-   Second, the non-artificial intelligence structural levers Tienlan
    asks about exist and matter: pre-call electronic medical record
    auto-summary, smart outreach time-of-day prediction, unified
    workspace replacing the two-system stack, contemporaneous
    documentation that the nurse confirms rather than types, batched and
    template-driven care plan updates, dedicated unreachable-patient
    queues with text messaging and interactive voice response fallbacks,
    dedicated triage shifts that absorb the urgent calls without
    breaking the monthly rhythm, and risk-stratifying so the
    highest-touch quintile gets two contacts per month and the
    lowest-touch quintile gets one well-prepared one.

-   Third, the artificial intelligence levers are where the program
    economics flip. An agent that handles the outreach attempts, drafts
    the documentation the nurse confirms, auto-generates the
    time-stamped audit trail, surfaces the right context at the right
    second of the call, and routes the patient who only needs a refill
    to a fully asynchronous flow does not replace the nurse: it gives
    the nurse back the sixty hours the structure stole.

The natural next step is the Advanced Primary Care Management
transition. Advanced Primary Care Management is the 2025 program that
effectively bundles Chronic Care Management and Principal Care
Management together and removes the time-based requirement, replacing it
with a service-element attestation (the practice attests to having
delivered required capabilities, not to having logged minutes). It
unlocks the five-hundred-plus panel that the current Chronic Care
Management-plus-Principal Care Management workflow structurally caps at
three hundred. Per the conversation with Ian, Foresight bills Chronic
Care Management and Principal Care Management today; Advanced Primary
Care Management is the natural successor architecture, and the
"300-to-500" framing in Tienlan's prompt is exactly that transition.
That is the subject of the companion paper.

**Sources and Further Reading**

the Centers for Medicare and Medicaid Services Chronic Care Management
program page:
[cms.gov/medicare/payment/fee-schedules/physician-fee-schedule/chronic-care-management-complex-conditions](https://www.cms.gov/medicare/payment/fee-schedules/physician-fee-schedule/chronic-care-management-complex-conditions)

Medicare Learning Network Chronic Care Management Services booklet
(MLN909188, June 2025):
[cms.gov/files/document/chroniccaremanagement.pdf](https://www.cms.gov/files/document/chroniccaremanagement.pdf)

calendar year 2026 Physician Fee Schedule Final Rule (CMS-1832-F) fact
sheet:
[cms.gov/newsroom/fact-sheets/calendar-year-cy-2026-medicare-physician-fee-schedule-final-rule-cms-1832-f](https://www.cms.gov/newsroom/fact-sheets/calendar-year-cy-2026-medicare-physician-fee-schedule-final-rule-cms-1832-f)

the American Academy of Family Physicians Chronic Care Management coding
overview:
[aafp.org/family-physician/practice-and-career/getting-paid/coding/chronic-care-management.html](https://www.aafp.org/family-physician/practice-and-career/getting-paid/coding/chronic-care-management.html)

Avalere on Chronic Care Management utilization:
[advisory.avalerehealth.com/insights/chronic-care-management-in-medicare-optimizing-utilization](https://advisory.avalerehealth.com/insights/chronic-care-management-in-medicare-optimizing-utilization)

Mathematica/the Journal of General Internal Medicine qualitative patient
study:
[pmc.ncbi.nlm.nih.gov/articles/PMC6374248/](https://pmc.ncbi.nlm.nih.gov/articles/PMC6374248/)

KevinMD on outpatient voicemail dynamics (Feb 2026):
[kevinmd.com/2026/02/why-voicemail-in-outpatient-care-is-failing-patients-and-staff.html](https://kevinmd.com/2026/02/why-voicemail-in-outpatient-care-is-failing-patients-and-staff.html)

Welby Health panel-size math:
[welbyhealth.com/post/the-math-your-practice-hasnt-done-on-chronic-care-management](https://welbyhealth.com/post/the-math-your-practice-hasnt-done-on-chronic-care-management)

Glassdoor ChartSpan reviews (patient care coordinator role):
[glassdoor.com/Reviews/ChartSpan-Medical-Technologies-Patient-Care-Coordinator-Reviews-EI\_IE1308992.0,30\_KO31,55.htm](https://www.glassdoor.com/Reviews/ChartSpan-Medical-Technologies-Patient-Care-Coordinator-Reviews-EI_IE1308992.0,30_KO31,55.htm)

Glassdoor CareHarmony reviews (Care Coordinator):
[glassdoor.com/Reviews/CareHarmony-Care-Coordinator-Reviews-EI\_IE2087255.0,11\_KO12,28.htm](https://www.glassdoor.com/Reviews/CareHarmony-Care-Coordinator-Reviews-EI_IE2087255.0,11_KO12,28.htm)

Telephone-nurse frequent-caller study:
[pubmed.ncbi.nlm.nih.gov/31997365/](https://pubmed.ncbi.nlm.nih.gov/31997365/)

the Agency for Healthcare Research and Quality Documentation Burden
technical brief:
[effectivehealthcare.ahrq.gov/sites/default/files/related\_files/documentation-burden-prepub-technical-brief.pdf](https://effectivehealthcare.ahrq.gov/sites/default/files/related_files/documentation-burden-prepub-technical-brief.pdf)
