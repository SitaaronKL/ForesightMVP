# ForesightHealth Interview Prep Project

This folder is the working directory for Dhruv's preparation for his Foresight Health interview on Friday, May 15, 2026 with Tienlan Sun (Founder/CEO). It will eventually also hold the NextJS + Convex skeleton app and Excalidraw system diagrams.

## Context recap (so any future Claude session picks up fast)

Tienlan's interview email frames the conversation around two questions:

1. Each CCM nurse manages a panel of ~300 patients (eligibility → consent → care → billing). How do we make sure every nurse can call and care for their full panel every month? What are the non-AI structural levers, and what are the AI automations and planning levers?
2. APCM is essentially CCM without the time-based billing requirements. How would you architect the system so each nurse can supervise 500+ patients? How would you roll it out? What interfaces would you provide patients?

After discussion a take-home assignment / onsite follows, where Dhruv would build a portion of what was discussed.

Dhruv's plan: walk in with the research done, system design diagrams (Excalidraw), and a working NextJS+Convex skeleton MVP. His best friend Ian works on the Foresight team and is verifying parts of the prep.

## Folder structure

```
ForesightHealth/
├── CLAUDE.md                          # this file
├── research/                          # papers Dhruv reads to get smart on the space
│   ├── 01_CCM_Operations_Research.docx
│   └── 02_APCM_Research.docx
├── outreach/                          # for talking to real CCM nurses
│   ├── Nurse_Call_Questions.docx
│   └── reddit_r_nursing_post.md
├── planning/                          # operational plan docs (post-planning conversation)
│   └── (to be created: CCM_Plan.docx, APCM_Plan.docx)
├── technical/                         # backend architecture, Convex schema, API surface
│   └── (to be created: Technical_Architecture.docx)
├── prd/                               # product requirements document
│   └── (to be created: PRD.docx)
├── uiux/                              # UI/UX spec, design language, screen inventory
│   └── (to be created: UIUX_Spec.docx)
├── design/                            # Excalidraw files (system flows, data model, sequence)
│   └── (to be created)
└── app/                               # NextJS + Convex MVP source
    └── (to be initialized)
```

## Sequencing rule (don't break this)

The agreed flow is:

1. **Research** — done (CCM + APCM papers in `research/`). Dhruv reads these.
2. **Planning conversation** — Dhruv reviews papers, then we discuss together: system design, UI/UX direction, Convex vs AWS RDS/S3/EC2 question, Kanban pushback, what the MVP scope actually is. NOTHING in `planning/`, `technical/`, `prd/`, `uiux/` should be created without that conversation happening first.
3. **Plan docs** — operational plans for CCM and APCM (what Foresight should actually do, written like consulting deliverables).
4. **Technical / PRD / UI-UX docs** — derived from the planning conversation.
5. **Excalidraw diagrams** — flows and backend architecture.
6. **MVP build** — NextJS + Convex, deployed.
7. **Iteration** — Dhruv sends screenshots, we refine.

The current step is between (1) and (2). Wait for Dhruv to review the research papers before writing anything in `planning/`, `technical/`, `prd/`, or `uiux/`.

## Tech stack notes (current Dhruv intent — may change in planning)

Dhruv's stated preferences:
- Frontend: NextJS, liquid glass aesthetic, gradients, animations
- Backend: Convex + Convex Actions
- AWS RDS for relational data (patient records, billing, claims)
- AWS S3 for patient files (medical documents)
- EC2 for hosting

**Open architecture question to resolve in the planning conversation:** Convex is its own backend platform with its own database (TypeScript-defined schema, reactive queries, scheduled functions). Layering Convex *and* AWS RDS is unusual — typically you pick one or the other. Need to figure out whether (a) Convex is the primary store and AWS is just for the S3 file blobs, (b) AWS RDS is the system of record and Convex is a thin sync/cache layer, or (c) drop one. This will affect the data model significantly.

## Feature ideas Dhruv has floated (open for pushback)

- **Kanban-style nurse workspace.** Dhruv asked Claude to push back hard on this if it's wrong for CCM. Defer the pushback until after the research is reviewed (per agreed sequencing), then evaluate against the actual workflow surfaced in the papers.
- **Agentic search + normal search toggle.** Tab to switch between LLM-driven semantic search and conventional keyword search across the patient panel and records.
- **Patient detail with medical-document version history / git diff style.** Click a patient → see the version history of their care plan / medical docs with diff view.
- **Single AI agent the nurse can query** for context across the panel.

## Style rules (user preferences)

- **No em dashes.** Dhruv has explicitly asked for this. Use commas, periods, or parentheses instead.
- Headings in research docs use the brand color #0B3B5C, Arial.
- Pull-quotes for nurse voice attribution use a left border accent.
- Tables use zebra rows and a navy header.
- Citations live at the end of each doc, full URLs.

## Email addresses to use

- Personal / GitHub: `dhruvbhatia115@gmail.com`
- Work / outreach to people: `dhruvlalwani114@gmail.com`
- School: `dkl70@rutgers.edu`

## Key fact from Ian conversation (May 12)

Per Dhruv's call with Ian (Foresight team), Foresight today bills **CCM + PCM** (Principal Care Management, CPT 99424-99427), not APCM. PCM is the single-condition sibling to CCM (severe single chronic condition, e.g., heart failure or ESRD). APCM is the 2025 program that bundles CCM + PCM and removes the time-tracking requirement. So Tienlan's "300 → 500" framing is the CCM+PCM-today → APCM-tomorrow transition, not a pure CCM → APCM transition. The CCM paper now reflects this.

## What's done so far (May 12, 2026)

- ✅ CCM operations research dossier (deep, source-backed)
- ✅ APCM research dossier (deep, source-backed)
- ✅ Voice-of-the-nurse research (Glassdoor, AllNurses, JGIM, KevinMD, AHRQ)
- ✅ `research/01_CCM_Operations_Research.docx` — now includes plain-English overview, glossary, explicit "why 300 is the ceiling" math, and a PCM (Principal Care Management) section per Ian's input
- ✅ `research/02_APCM_Research.docx`
- ✅ `outreach/Nurse_Call_Questions.docx` (12 questions, vocabulary, scripts)
- ✅ `outreach/reddit_r_nursing_post.md` (3 subreddit-tailored versions + etiquette)

## What's next (waiting on Dhruv)

- ⏳ Dhruv reviews the two research papers
- ⏳ Dhruv decides whether to post on Reddit / AllNurses first or move straight to planning
- ⏳ Planning conversation: system design, UI/UX direction, Convex vs AWS RDS question, Kanban pushback, MVP scope

Once those happen:
- ⏳ Write `planning/CCM_Plan.docx`
- ⏳ Write `planning/APCM_Plan.docx`
- ⏳ Write `technical/Technical_Architecture.docx`
- ⏳ Write `prd/PRD.docx`
- ⏳ Write `uiux/UIUX_Spec.docx`
- ⏳ Build Excalidraw diagrams in `design/`
- ⏳ Initialize NextJS + Convex app in `app/`
- ⏳ Deploy MVP

## Verification flags from research (worth Ian's eyes)

A few claims in the papers are derived from secondary sources and would benefit from a Foresight insider sanity check:

- Exact CY2026 Medicare reimbursement rates for 99491, 99437, 99487, 99489 (derived from ~10% PFS scaler, not directly cited cents-accurate).
- CY2026 rates for G0557 and G0558 (same situation).
- "11 vs 13 service elements" for APCM — sources differ on count. Paper uses the AAFP/CMS framing of ~11.
- Adoption volume claims for APCM (no published CMS data yet).

## Tone for Tienlan in the interview

What lands with this kind of founder (read his X presence and Neo/Ali Partovi endorsement):

- Treat the regulatory layer as a first-class object, not background.
- Be specific about what the AI agent should *not* do (preserving the patient-nurse trust relationship).
- Frame APCM as a regulatory unlock that pairs with the AI unlock, rather than as a billing change.
- Don't be a vendor. Be an operator.
- Push back on his Kanban-or-not framing only after you've earned the right by showing you understand the workflow.
