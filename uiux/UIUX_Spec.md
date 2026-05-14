# UI/UX Specification: Foresight Care Operating System

**Author:** Dhruv Lalwani
**Prepared for:** Foresight Health interview (Tienlan Sun)
**Date:** May 14, 2026
**Companion docs:** CCM_Plan.md, APCM_Plan.md, PRD.md, Technical_Architecture.md

---

## 1. Design philosophy

The application is for clinical professionals doing concentrated work for eight hours a day. The aesthetic targets the intersection of three references: Apple's Vision Pro liquid glass surfaces, Linear's panel-of-information density, and Notion's documents-as-canvas editability. The brand temperature is calm-confident: navy primary, near-white surfaces, restrained accents, generous whitespace.

Three rules govern every screen decision:

**Calm is faster than busy.** A nurse doing fifteen patient touches in a day cannot afford visual noise. Restraint on color, motion, and density. The dashboard surfaces what matters. Nothing competes for attention.

**Glass over chrome.** Translucent surfaces, soft shadows, subtle gradient meshes in the background. No hard lines, no aggressive borders, no high-contrast widgets. The visual metaphor is depth, not separation.

**Motion is signal, not decoration.** Animations exist to indicate state change (a new notification glides in, the agent thinks with a gradient pulse, a patient row highlights as it gets sorted up the urgency list). No looping animations, no idle motion, no parallax tricks. Motion communicates, then stops.

---

## 2. Brand identity

### 2.1 Colors

| Name | Hex | Tailwind | Use |
|---|---|---|---|
| Navy primary | #0B3B5C | `navy` | Headings, primary brand surfaces, table headers |
| Navy deep | #062738 | `navy-deep` | Hover state of navy primary |
| Navy soft | #2A6790 | `navy-soft` | Secondary text on navy backgrounds |
| Accent teal | #34D1BF | `teal` | Gradient companion to navy, success states |
| Surface white | #F8FBFD | `surface` | Page background |
| Surface card | #FFFFFF | `card` | Card surfaces with subtle drop shadow |
| Surface glass | rgba(255,255,255,0.65) | `glass` | Liquid glass overlay (used with backdrop-blur) |
| Text primary | #1A1F2E | `ink` | Body text |
| Text secondary | #647084 | `ink-soft` | Captions, metadata |
| Text muted | #9CA6B6 | `ink-muted` | Disabled state, placeholder |
| Risk low | #2DA15A | `risk-low` | Risk score badge low |
| Risk medium | #E5A03C | `risk-mid` | Risk score badge medium |
| Risk high | #D8504C | `risk-high` | Risk score badge high |
| Tier 1 | #8B9DC3 | `tier-1` | Patient tier badge level 1 |
| Tier 2 | #4A7BA8 | `tier-2` | Patient tier badge level 2 |
| Tier 3 | #1F4E7A | `tier-3` | Patient tier badge level 3 |
| Diff add | #D4F5E2 | `diff-add` | Care plan diff: added content background |
| Diff remove | #FBE0DE | `diff-remove` | Care plan diff: removed content background |
| Diff modify | #FAE9C8 | `diff-modify` | Care plan diff: modified content background |

### 2.2 Gradient palette

Three named gradients for use across the application:

**Brand gradient (navy-to-teal):**
`linear-gradient(135deg, #0B3B5C 0%, #1F6488 35%, #34D1BF 100%)`
Use for: hero accents, button-active states, brand splash moments, agent thinking glow.

**Mesh background (multi-stop subtle):**
A radial gradient mesh combining `#F8FBFD`, `#EAF2F9`, and `#D6E5F1` at varying positions. Slow rotation animation acceptable on backgrounds only (10s+ duration). Use for: page backgrounds, modal overlays, agent rail background.

**Risk gradient (linear, score-driven):**
`linear-gradient(90deg, #2DA15A 0%, #E5A03C 50%, #D8504C 100%)`
Use for: risk score progress indicators where the position of the marker on the gradient corresponds to the score.

### 2.3 Typography

| Use | Family | Weight | Size | Line height |
|---|---|---|---|---|
| Display | Inter | 700 | 36px | 1.15 |
| Heading 1 | Inter | 600 | 28px | 1.2 |
| Heading 2 | Inter | 600 | 22px | 1.25 |
| Heading 3 | Inter | 600 | 18px | 1.3 |
| Body | Inter | 400 | 15px | 1.55 |
| Body bold | Inter | 600 | 15px | 1.55 |
| Caption | Inter | 400 | 13px | 1.4 |
| Micro | Inter | 500 | 11px | 1.3 |
| Mono (for codes) | JetBrains Mono | 400 | 13px | 1.45 |

The research papers use Arial for cross-platform print fidelity. The application uses Inter for screen rendering quality.

### 2.4 Spacing scale

Tailwind default (4-based): 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96 pixels.

Most page-level spacing uses 6 (24px) for breathing room between major sections, 4 (16px) for related card spacing, 2 (8px) for inline elements.

### 2.5 Shadow scale

| Name | Value | Use |
|---|---|---|
| `shadow-soft` | 0 1px 3px rgba(11,59,92,0.08), 0 1px 2px rgba(11,59,92,0.04) | Default card |
| `shadow-glass` | 0 4px 24px rgba(11,59,92,0.08), 0 1px 6px rgba(11,59,92,0.04) | Glass surfaces |
| `shadow-elevated` | 0 12px 48px rgba(11,59,92,0.12), 0 4px 16px rgba(11,59,92,0.06) | Modals, agent rail |
| `shadow-glow` | 0 0 0 4px rgba(52,209,191,0.18) | Focus rings, active states |

### 2.6 Border radius

| Name | Value | Use |
|---|---|---|
| `rounded-lg` | 8px | Inputs, small chips |
| `rounded-xl` | 12px | Cards, buttons |
| `rounded-2xl` | 16px | Large cards, modal corners |
| `rounded-3xl` | 24px | Agent rail, hero surfaces |

---

## 3. Liquid glass primitive

The signature visual element. Defined as a reusable React component used throughout the application.

### 3.1 Anatomy

```tsx
<LiquidGlass tone="navy" intensity="medium" elevation="raised">
  ...content...
</LiquidGlass>
```

Implementation: a div with:
- `backdrop-blur-xl` (Tailwind: 24px blur)
- `bg-glass` (rgba(255,255,255,0.65))
- A subtle multi-stop linear gradient overlay at low opacity
- `shadow-glass` or `shadow-elevated` depending on elevation prop
- `rounded-2xl` corners
- `border border-white/40` for the highlight edge

The "tone" prop adjusts the gradient overlay's hue (navy, teal, or neutral). The "intensity" prop adjusts the backdrop-blur intensity (light = 8px, medium = 16px, heavy = 24px). The "elevation" prop selects the shadow.

### 3.2 Background context

LiquidGlass is meant to overlay a colored or textured background, otherwise the blur has nothing to refract. The page background is the mesh gradient (subtle, low-saturation, large-radius radial blobs). Cards layered on top get the glass treatment.

### 3.3 Where it's used

- The agent right rail
- Patient detail header
- Modal overlays
- Onboarding wizard steps
- Hero KPI strip on dashboard
- Today's queue cards

### 3.4 Where it's NOT used

- Body text in long documents (illegible)
- Form input fields (need solid contrast for typing)
- Tables (dense data needs solid background)
- Patient portal (older user base, accessibility-first, less glass)

---

## 4. Component inventory

| Component | Purpose | Notes |
|---|---|---|
| `Button` | Primary, secondary, ghost, danger variants | rounded-xl, framer-motion scale on hover |
| `IconButton` | Icon-only buttons in toolbars | Tooltip on hover |
| `Input` | Text input | Floating label, focus ring with brand glow |
| `Textarea` | Multi-line text input | Auto-grow option |
| `Select` | Dropdown select | Custom styled, supports search |
| `Combobox` | Searchable select | Used for patient picker, condition picker |
| `Tabs` | Tab strip | Used in patient detail |
| `Modal` | Modal overlay | Glass surface, fade-in 200ms, click-outside-close |
| `Drawer` | Side drawer | Used for agent rail when in full-screen mode |
| `Toast` | Notification toast | Bottom-right, auto-dismiss 4s |
| `Avatar` | User avatar | Initials fallback if no image |
| `Badge` | Inline status badge | Used for tier, risk, status |
| `Chip` | Filter chip | Removable, used in filter strip |
| `Card` | Standard card | Soft shadow, padding 6, optional glass |
| `Table` | Data table | Hover row highlight, sortable headers, sticky header |
| `TimelineItem` | Care plan version row | Used in history modal |
| `DiffViewer` | Care plan diff renderer | Inline + side-by-side modes |
| `RiskBadge` | Risk score visualization | Score number + colored dot or gradient bar |
| `TierBadge` | Tier indicator | Level 1/2/3 with color |
| `LiquidGlass` | Wrapper for glass surfaces | See section 3 |
| `MeshBackground` | Animated mesh gradient | Used on page backgrounds |
| `ActionCard` | Agent suggestion card | Apply / Edit / Dismiss buttons |
| `AgentMessage` | Single agent thread message | Markdown renderer, tool call expansion |
| `AgentRail` | The full right rail | See section 6 |
| `CallRecorder` | Microphone capture widget | See section 8 |

---

## 5. Screen-by-screen wireframe descriptions

### 5.1 Login screen

Page background: mesh gradient. Centered card on glass surface. Logo at top (Foresight wordmark in navy with subtle gradient). Below: "Welcome back, Sarah." (personalized if return user). Single email field. "Send code" button (gradient brand). Or: link "Sign in with phone instead." After code sent: 6-digit code input. "Continue" button. Below: subtle "Need help signing in?" link. No corporate footer or marketing copy.

### 5.2 Nurse dashboard

Three-column-style layout, although technically two columns plus an agent rail.

**Left column (main):**

Header row: greeting ("Good morning, Sarah"), date, weather icon (optional, just for warmth), profile menu.

KPI strip: five LiquidGlass cards in a row, each showing one metric. Panel size, patients reached this month, reach rate (with color), average documentation time, service-element coverage percentage. Each card has a small trend sparkline showing the last 7 days.

Today's queue heading: "Today's priorities" with a small "Customize" link.

Today's queue: 8-15 patient cards arranged vertically. Each card is a LiquidGlass surface containing patient name (large), tier badge, risk badge, last touched ("3 days ago"), top open issue ("Refill due"), and a small "why prioritized" note ("Hospital discharge 36h ago, transition window closes today"). Click any card to drill into patient detail.

Below the fold: full panel section header "All patients (487)" with filter chips below (Tier, Status, Last touched, Reach status, Condition, plus a freeform search). The table renders below, scrollable, sticky header. Columns: Name, Tier, Risk, Last touched, Status, Top issue, Actions.

**Right column (agent rail):**

See section 6.

### 5.3 Patient detail

Header row: back arrow, patient name (large), age, primary nurse, tier badge, status badge, billing program ("Advanced Primary Care Management, Level 2"). Right side: action buttons (Send message, Schedule call, More).

Tabs below header: Overview, Care Plan, Encounters, Documents, Service Elements, Messages.

Right column (agent rail): now scoped to this patient, with context banner "Context: Maria Rodriguez" prominently displayed.

**Overview tab (default):**

Grid of LiquidGlass cards:
- Demographics card: age, gender, address, phone, primary contact
- Conditions card: chronic flag, condition list, severity if available
- Medications card: current med list with last refill date
- Vitals card: most recent blood pressure, weight, hemoglobin A1c with trend sparkline
- Hospital events card: last 90 days, with type (admission/discharge/transfer) and facility
- Risk score card: large number with gradient bar visualization, trend over last 30 days

Below the cards: a "Last 3 encounters" mini-list with date, type, duration, summary snippet.

**Care Plan tab:**

The current care plan rendered as a structured document. Sections expand/collapse. Each section is editable (click to edit, save on blur). Header has "History" button which opens the diff modal.

Care Plan History modal: side-by-side layout. Left: timeline of versions with date, drafter, status. Right: selected version content with diff highlighting against previous version. Action buttons: Close, Restore this version, Open in full view.

**Encounters tab:**

Chronological list of encounters. Each row: date, type icon, duration, nurse, status, top topic tag. Click expands inline to show the full SOAP note plus transcript if available.

**Documents tab:**

Grid of medical document cards. Each card: type icon, title, source facility, upload date. Click to view (PDF inline preview or download).

**Service Elements tab:**

Eleven element rows showing coverage for the current month. Each row: element number, name, status badge (not yet / available / delivered), evidence link. Filter to switch months.

**Messages tab:**

Chat-style thread. Patient and nurse messages distinguished by sender color and alignment. Compose box at bottom with "Draft with Sage" button to generate an agent-drafted response.

### 5.4 Voice-to-SOAP modal

Triggered by microphone button on patient detail.

Initial state: large microphone icon centered, "Press to start recording" caption, Cancel button bottom-left.

Recording state: pulsing red dot, elapsed time counter, "Press to stop" caption, audio waveform visualization at the bottom.

Processing state: spinner with text "Transcribing your call..." then "Drafting your SOAP note..."

Review state: modal grows to large size with:
- Transcript section (collapsible, default collapsed): scrollable transcript text
- SOAP draft: four editable text areas (Subjective, Objective, Assessment, Plan), each with copy-to-clipboard icon
- Time log entry: duration field (auto-filled), activity description (auto-drafted), billable toggle (auto-on)
- Care plan deltas: list of suggested diffs, each with Approve / Edit / Reject buttons

Footer: "Discard" button (ghost), "Save as draft" button (secondary), "Sign and save" button (gradient brand primary).

### 5.5 Patient portal

Simpler aesthetic. Larger font (16px body), higher contrast, less glass.

Header: practice name, patient name, log out.

Three large cards: My Care Plan, Monthly Statements, Messages.

**My Care Plan:**

Plain-English version, large headings, generous spacing. "Updated by Sarah Chen on April 28" at top. Sections: My health goals (bulleted list with progress indicators), My medications (list with refill status), My next appointment (large date), Things to watch for, When to call us.

**Monthly Statements:**

Card per month, last 12 months. Click to expand: nurse name, summary of what was done (3-5 bullets in plain English), amount Medicare paid, amount supplemental covered, your share (large number), running balance.

**Messages:**

Chat thread with nurse. Patient compose box at bottom.

### 5.6 Admin page

Minimal aesthetic. Functional, not polished. Sidebar nav (Patients, Nurses, Encounters, Care Plans, Seed Data, System). Each section is a simple table with create/edit/delete actions. Seed Data has the bulk generator buttons. System has the "Recompute all risk scores" and "Regenerate morning briefing" and "Trigger end-of-day wrap" buttons.

---

## 6. Master Agent Right Rail (detail spec)

### 6.1 Dimensions and behavior

Always-visible. Collapsed state: 48px wide vertical strip with the agent icon at top, recent unread count badge, expand arrow. Expanded state: 360px wide, full viewport height minus 64px header.

### 6.2 Anatomy (expanded state)

**Header (64px tall):**
LiquidGlass surface with brand gradient overlay. Agent name "Sage" in 16px bold. Status dot (green = ready, blue pulse = thinking, amber = waiting on user approval). Collapse arrow on the right. Context banner below: small chip with "Context: Maria Rodriguez" or "Context: full panel" depending on current scope.

**Body (scrolling thread):**
LiquidGlass surface, gradient mesh background. Messages stack bottom-up (most recent at the bottom).

User messages: right-aligned, gray bubble, plain text.

Agent messages: left-aligned, no bubble, just text on the glass surface with subtle indent. Supports markdown rendering. Tool call expandable: a small "Searching panel..." chip that expands on click to show the tool name, arguments, and result count.

Action cards (when agent suggests a write): full-width card within the message, with the suggestion content (e.g., drafted SOAP note preview, drafted message text, suggested care plan delta), and three buttons: "Apply" (gradient brand), "Edit" (secondary), "Dismiss" (ghost).

**Footer (input area):**
LiquidGlass surface, sticky to bottom. Text input with placeholder "Ask Sage anything about your panel..." Microphone button on the right of the input (toggle for voice input). Send button (arrow icon, only enabled when text exists).

### 6.3 Morning Briefing rendering

When the agent message is the Morning Briefing, it renders with a special card layout instead of plain text:

**Card 1 - Day at a glance:**
"Good morning Sarah." Then a stat row: patients due today, overdue, ER follow-ups needed.

**Card 2 - Suggested priority order:**
Numbered list of 5-8 priority items. Each item is clickable to drill into the patient.

**Card 3 - Heads up:**
List of awaiting-approval items, unread messages, etc.

**Card 4 - Yesterday's snapshot:**
KPI mini-strip.

Action buttons at the bottom of the briefing: "Start with priority queue," "Customize my day," "Show full panel."

### 6.4 End-of-Day Wrap rendering

Similar card-based layout:
- Today's recap (reached vs due)
- Auto-scheduled retries (list of patients + scheduled times)
- Documentation status (signed vs pending)
- Service-element coverage gaps
- Action buttons: "Review pending notes," "See coverage gaps," "End shift"

### 6.5 Voice input flow

When the microphone button is clicked: input field is replaced with a recording UI (pulsing red dot, elapsed time, waveform). Click again to stop. Browser MediaRecorder captures audio. Audio is sent to Whisper via a Convex Action. Transcript appears in the input field. User can edit then send.

### 6.6 Thinking state

When the agent is processing (between turn submission and final response): the status dot pulses blue. A "thinking" line appears in the thread with a gradient sweep animation. As tool calls fire, the line updates to show what is happening ("Searching panel...", "Reading care plan...", "Drafting note...").

### 6.7 Continue button

If the agent attempts more than 4 tool calls in one turn, the loop pauses and a "Continue" button appears at the bottom of the partial response. Clicking it resumes the loop. Side benefit: visible to the demo audience.

---

## 7. Care Plan Diff Viewer (detail spec)

### 7.1 Layout

Full-screen modal triggered by "History" button in care plan view.

Left pane (30% width): timeline of versions. Each row: date, drafter, version number, status badge. The currently selected version is highlighted with a left border accent in brand teal.

Right pane (70% width): selected version content rendered with diff highlighting against the previous version.

Top toolbar: "Comparing version N to version N-1" with version picker dropdowns, "Switch to side-by-side" toggle, close button.

Bottom toolbar: "Restore this version" button (creates new version cloning the selected old one), "Open in full view" button (closes modal, scrolls to current care plan).

### 7.2 Diff rendering

Inline diff (default): the rendered care plan with inline insertions highlighted in green background, deletions in red strikethrough, modifications in yellow background. Sections that did not change are collapsed by default with a "Show unchanged" toggle.

Side-by-side diff: two columns showing previous version on the left, selected version on the right. Synchronized scrolling. Differences highlighted as in inline mode.

### 7.3 Granularity

Diffs are computed at the field level. Each care plan field (problem list, expected outcomes, treatment goals, etc.) is diffed independently. Whole-field changes show the field name in a header bar above the diff.

### 7.4 Edge cases

First version: no comparison available. Show the version content with a note "Initial version, no prior to compare against."

Restored version: marked in the timeline as "Restored from version N" with a chain icon.

Rejected versions: shown in the timeline grayed out with a "Rejected" badge.

---

## 8. Animation principles

### 8.1 Timing

- Page transitions: 250ms ease-out
- Modal entry: 200ms ease-out, modal exit 150ms ease-in
- Toast entry: 300ms ease-out from bottom, exit 200ms ease-in
- Card hover scale: 1.02 over 150ms
- Button hover: 1.04 scale plus shadow grow, 150ms
- Button active: 0.98 scale, 100ms
- Drawer open: 300ms ease-out from right
- Agent rail collapse: 200ms ease-in-out
- Thinking pulse: 1.5s loop while active, fade out 200ms

### 8.2 Choreography

When the dashboard loads, it stages:
1. Background mesh gradient renders immediately
2. Header fades in (100ms after mount, 200ms duration)
3. KPI strip cards stagger in (50ms apart, 200ms each)
4. Today's queue cards stagger in (40ms apart, 250ms each)
5. Full panel section header (300ms after queue)
6. Agent rail expands (350ms after mount, 250ms duration)

The total stagger should resolve within 800ms.

### 8.3 No-no's

- No looping animations on idle screens (battery drain, distraction)
- No parallax scrolling effects
- No bouncy/spring animations on professional surfaces (one exception: a subtle bounce on the "Sign and save" success state)
- No carousel auto-play

### 8.4 Reduced motion

Respect `prefers-reduced-motion`. All non-essential animations disabled, replaced with instant state changes. Essential motion (the agent thinking pulse, which communicates state) remains but with reduced amplitude.

---

## 9. Accessibility

### 9.1 Color contrast

All text on backgrounds meets WCAG AA (4.5:1 for normal text, 3:1 for large text). Patient portal targets WCAG AAA (7:1) given the older user base.

### 9.2 Keyboard navigation

Every interactive element is keyboard-accessible. Tab order is logical. Focus rings visible (brand teal glow, never removed). Esc closes modals and overlays. Cmd+K (or Ctrl+K) focuses the agent input from anywhere.

### 9.3 Screen reader

ARIA labels on icon buttons. Heading hierarchy is correct (one h1 per page). Tables have proper th/td structure with scope attributes. The agent rail has appropriate aria-live regions so screen readers announce new messages.

### 9.4 Patient portal specifics

Default font size 16px (vs 15px elsewhere). Buttons at least 44px tall (Apple minimum tap target). All form fields have visible labels (never placeholder-only). High contrast mode supported via system preference.

---

## 10. Empty and error states

### 10.1 Empty

- Empty dashboard (new nurse, no patients yet): warm illustration, "Your panel is empty. Add your first patient to get started," with an "Add patient" button.
- Empty agent thread: brand splash, "Hi, I'm Sage. Ask me anything about your panel, or use the microphone to dictate."
- Empty messages thread: "No messages yet. Send the first one."

### 10.2 Loading

- Dashboard: skeleton rows in the KPI strip and queue while data fetches
- Patient detail: skeleton blocks for each card
- Agent thinking: gradient pulse line

### 10.3 Error

- Network error: subtle banner at top "Connection lost. Reconnecting..."
- Failed mutation: toast with the specific error and a retry button
- Agent error: agent message replaced with a small "I couldn't complete that. Please try again or rephrase."

---

## 11. Responsive behavior

### 11.1 Breakpoints

- Mobile: under 640px
- Tablet: 640px to 1024px
- Desktop: 1024px and above

### 11.2 Nurse application

Designed for desktop primarily. Tablet supported (the agent rail collapses into a bottom drawer on tablet). Mobile not supported in MVP (nurses do not run their day on phones).

### 11.3 Patient portal

Mobile-first. Single-column layout. Touch-friendly tap targets. Tested on iOS Safari and Android Chrome.

---

## 12. Brand voice (in-product copy)

### 12.1 To the nurse

Warm but not chatty. Direct. Operational. Examples:

- "Good morning Sarah. You have 23 patients due today."
- "Maria Rodriguez has a discharge follow-up window closing in 14 hours."
- "Apply this care plan revision?"
- "Signed and saved."

Avoid:
- "Awesome!", "Great job!", "Way to go!" (condescending)
- Long apologies for system errors
- Marketing-style language ("Unlock your panel's potential")

### 12.2 To the patient

Clear, warm, never condescending. Plain English at 8th-grade reading level. Examples:

- "Your nurse Sarah updated your care plan on April 28."
- "In May, Sarah spent 22 minutes on your care. Here's what she did..."
- "You haven't been billed this month yet."

Avoid:
- Clinical jargon
- Insurance industry phrasing ("EOB", "coinsurance" without explanation)
- Anything that sounds like marketing

### 12.3 Agent voice

Concise, helpful, never sycophantic. The agent uses the nurse's name occasionally but not every message. The agent does not apologize for asking clarifying questions. The agent does not say "Sure, I can do that!" before doing something; it just does it.

Examples:

- "23 patients are due today. Want me to sort them by tier?"
- "Maria's last A1c was 7.8 in February. Want me to flag her for a recheck?"
- "I've drafted a SOAP note from this transcript. Review it below."
- "I can keep going. Want me to check the unreached patients from yesterday?"

---

## 13. Open design questions

- The exact gradient stops for the brand gradient may need adjustment after seeing the application on a high-density display
- The Sage agent name is a placeholder; Dhruv may pick a different name
- The Morning Briefing card layout may need iteration after seeing real briefing content (the cards should not feel cramped or repetitive)
- The patient portal font size may need adjustment based on user testing with older patients

---

## Companion docs

- **CCM_Plan.md**: operational plan for Chronic Care Management
- **APCM_Plan.md**: operational plan for Advanced Primary Care Management transition
- **PRD.md**: product requirements for the 6 MVP flows
- **Technical_Architecture.md**: full schema, agent surface, tech stack
- **design/Excalidraw_Specs.md**: diagram text specifications
