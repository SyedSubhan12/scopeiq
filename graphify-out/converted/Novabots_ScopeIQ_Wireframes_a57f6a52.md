<!-- converted from Novabots_ScopeIQ_Wireframes.docx -->



# 1. Design Philosophy
ScopeIQ serves two distinct audiences on separate but connected interfaces: the Agency Dashboard (used daily by creative professionals) and the Client Portal (accessed occasionally by their clients). Each interface has different density, complexity, and interaction requirements.


# 2. Color System & Typography

## 2.1 Color Tokens

## 2.2 Typography Scale

# 3. Navigation Architecture

Agency Dashboard — Global Navigation Structure
Note: Badge counts show unresolved action items. Red = urgent (scope flags requiring action). Amber = pending (awaiting approval). Nav items without count = nothing pending.

Client Portal — Single-Project Minimal Navigation
Note: Client portal is single-project scoped per URL. Clients never see multi-project navigation. Each project generates a unique portal token URL. Maximum 3 tab steps visible at any time.

# 4. Agency Dashboard Screens

Screen 1 — Dashboard Overview (Home)
Note: Scope flags surface prominently at top-right with direct action buttons — highest-priority information. Metric cards are clickable and navigate to the filtered relevant view.

Screen 2 — Project Detail
Note: Scope meter gives immediate visual health check. Tab navigation between modules. Deliverable rows show status with color coding and context-sensitive action buttons.

Screen 3 — Brief Builder (Form Configuration)
Note: Drag-and-drop field builder with live client-view preview. AI scoring threshold and action configurable directly on the builder screen.

Screen 4 — Scope Flag Detail & Action
Note: Three clear, mutually exclusive actions. Confirm → generates change order immediately. Mark In-Scope → dismisses with reason and trains the AI. Snooze → defers 24 hours.

# 5. Client Portal Screens

Screen 5 — Client Brief Submission
Note: Paginated form — max 4–5 questions per step. Progress bar shows completion. Agency branding fills the header completely. No ScopeIQ branding on paid plans.

Screen 6 — Client Deliverable Review
Note: Revision round counter prominently shows remaining rounds, creating natural urgency to consolidate feedback. Two-action pattern only: Approve or Request Changes — no ambiguity.

## 5.1 Core UI Components


Novabots — ScopeIQ — Confidential — 2026
| ScopeIQ
UI/UX Wireframes & Design System
Novabots Design Team  |  Screen Flows · Component Specs · Interaction Models  |  v1.0  |  2026 |
| --- |
| Design Principle | Expression in the UI |
| --- | --- |
| Progressive disclosure | Show summary first; details on expand. Never front-load complexity. |
| Action proximity | The most important action on any screen is the largest, highest-contrast element. |
| Signal clarity | Color never decorates — it always carries meaning (status, urgency, type). |
| Client simplicity | Client portal: max 3 actions per screen. No jargon. Plain English only. |
| Audit visibility | Timestamps and actor identities shown everywhere decisions are made. |
| Speed first | Every primary workflow must be completable in under 3 clicks from the dashboard. |
| Token | Hex | Usage |
| --- | --- | --- |
| primary-teal | #0F6E56 | Buttons, links, active nav states, accent borders |
| primary-teal-mid | #1D9E75 | Hover states, badges, tag backgrounds |
| primary-teal-light | #E1F5EE | Section backgrounds, info banners |
| status-red | #DC2626 | Scope flags — out of scope, errors, critical alerts |
| status-amber | #D97706 | Warnings, approaching revision limits, pending items |
| status-green | #059669 | Approvals, completions, success confirmations |
| status-blue | #2563EB | Informational notices, in-progress indicators |
| text-primary | #0D1B2A | Headings, labels, high-emphasis content |
| text-secondary | #4B5563 | Body text, descriptions, secondary labels |
| text-muted | #9CA3AF | Placeholders, timestamps, metadata |
| surface-white | #FFFFFF | Card and modal backgrounds |
| surface-subtle | #F8FAFC | Page backgrounds, alternate row fills |
| Style | Font | Size / Weight | Usage |
| --- | --- | --- | --- |
| Display | Inter | 32px / 700 | Page-level hero headings only |
| Heading 1 | Inter | 24px / 600 | Major section titles |
| Heading 2 | Inter | 20px / 600 | Sub-section titles, card headers |
| Heading 3 | Inter | 16px / 600 | Form labels, table headers |
| Body Large | Inter | 16px / 400 | Primary body and description text |
| Body Default | Inter | 14px / 400 | Most UI text, table cells, input values |
| Body Small | Inter | 12px / 400 | Timestamps, metadata, helper text |
| Code | JetBrains Mono | 13px / 400 | Code blocks, IDs, technical field values |
| Label | Inter | 11px / 500 | Badge text, status pills, nav count badges |
| ┌──────────────────────────────────────────────────────────────────────┐
│ [ScopeIQ] [Novabots]      [🔍 Search...]      [🔔 3]  [JL ▾]        │
│────────────────────────────────────────────────────────────────────  │
│ LEFT NAV (240px)          │   MAIN CONTENT AREA (flex)               │
│ ─────────────────────     │                                          │
│ ▶ Dashboard               │   (Changes based on active nav item)     │
│   Projects          (12)  │                                          │
│   Briefs             (3)  │                                          │
│   Scope Flags        (2)  │   ← Red badge = urgent; Amber = pending  │
│   Clients                 │                                          │
│   Change Orders      (1)  │                                          │
│   ─────────────────────── │                                          │
│   Settings                │                                          │
│   Help & Docs             │                                          │
│   ─────────────────────── │                                          │
│   [Plan: Studio ✓]        │                                          │
│   [Upgrade to Agency ↗]   │                                          │
└───────────────────────────┴──────────────────────────────────────────┘ |
| --- |
| ┌──────────────────────────────────────────────────────────────────────┐
│ [Agency Logo]              Project: Brand Identity — Acme Corp        │
│────────────────────────────────────────────────────────────────────  │
│   [ Brief ]  ─────  [ Review Work ]  ─────  [ Messages ]             │
│   (Tab steps — only show phases relevant to current project state)    │
│────────────────────────────────────────────────────────────────────  │
│                                                                       │
│                     ACTIVE STEP CONTENT                              │
│                                                                       │
└───────────────────────────────────────────────────────────────────── ┘ |
| --- |
| ┌────────────────────────────────────────────────────────────────────────┐
│  Good morning, James. You have 2 scope flags requiring attention.      │
│────────────────────────────────────────────────────────────────────────│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Active       │  │ Awaiting     │  │ Scope Flags  │  │ MRR       │  │
│  │ Projects  12 │  │ Approval  4  │  │    2 🔴      │  │ $8,400    │  │
│  │              │  │ ⚡ Action    │  │  Urgent      │  │ ↑ 12% mo  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘  │
│────────────────────────────────────────────────────────────────────────│
│  RECENT ACTIVITY                │  SCOPE FLAGS — ACTION REQUIRED       │
│  ─────────────────────────────  │  ─────────────────────────────────   │
│  ✓ Acme Corp approved Logo v3   │  🔴 Acme Corp                        │
│    2 hours ago                  │  'Can we add social media templates?' │
│  ● Brief submitted: TechStart   │  Confidence: 82% · Severity: HIGH    │
│    4 hours ago                  │  [View Flag]  [Send Change Order]    │
│  → Change order sent: MiniCo    │  ─────────────────────────────────   │
│    1 day ago                    │  🟡 TechStart                        │
│              [View All →]       │  'Needs responsive version...'       │
│                                 │  [View Flag]  [Dismiss]              │
│  UPCOMING DEADLINES             │                                      │
│  ─────────────────────────────  │  [View All Scope Flags →]            │
│  MiniCo final delivery — 3 days │                                      │
│  Acme revision 2 due — 5 days   │                                      │
└─────────────────────────────────┴──────────────────────────────────────┘ |
| --- |
| ┌────────────────────────────────────────────────────────────────────────┐
│  ← Projects  /  Acme Corp  /  Brand Identity                           │
│  Status: [● Active]  Client: Acme Corp  Jan 15 → Mar 28                │
│────────────────────────────────────────────────────────────────────────│
│  [ Brief ] [ Deliverables ] [ Scope Guard ] [ Change Orders ] [ Log ]  │
│────────────────────────────────────────────────────────────────────────│
│  SCOPE METER                                                            │
│  ██████████████████░░░░░░░░░  68% of contracted scope used              │
│  Deliverables: 4 / 6 complete  │  Revisions: 3 / 4 rounds used          │
│────────────────────────────────────────────────────────────────────────│
│  DELIVERABLES                       │  BRIEF SUMMARY                    │
│  ────────────────────────────────   │  ─────────────────────────────   │
│  ✓ Logo System v3  Approved  Feb 12 │  Score: 87/100  ✓ Approved       │
│  ⏳ Brand Guidelines  In Review     │  Type: Brand Identity             │
│     [View Feedback] [Send Reminder] │  Budget: $12,000                  │
│  ○  Icon Set          Not started   │  Revisions: 4 rounds             │
│  ○  Digital Templates Not started   │  Deadline: Mar 28                │
│               [+ Add Deliverable]   │  [View Full Brief →]             │
└─────────────────────────────────────┴──────────────────────────────────┘ |
| --- |
| ┌────────────────────────────────────────────────────────────────────────┐
│  Brief Builder  /  Brand Design Template          [Preview] [Publish]  │
│────────────────────────────────────────────────────────────────────────│
│  FIELD LIBRARY (drag to add)  │  FORM CANVAS                          │
│  ────────────────────────     │  ──────────────────────────────────   │
│  📝 Short Text                │  ┌────────────────────────────────┐   │
│  📄 Long Text                 │  │ Project Name         *Required │   │
│  ☑  Multiple Choice          │  │ [Short text input field]       │   │
│  ○  Single Choice            │  └────────────────────────────────┘   │
│  📅 Date / Date Range         │  ┌────────────────────────────────┐   │
│  📁 File Upload               │  │ Primary goal?                  │   │
│  🔀 Conditional Logic         │  │ ○ New brand from scratch        │   │
│  ─────────────────────────── │  │ ○ Refresh existing brand        │   │
│  AI CLARITY SETTINGS          │  │ ○ Sub-brand / campaign          │   │
│  ─────────────────────────── │  └────────────────────────────────┘   │
│  Min clarity score:  [ 70 ]   │                                       │
│  Action if below:  [Hold ▾]   │  [+ Add Field]                        │
│  [Preview as client]          │                         [Save draft]  │
└───────────────────────────────┴───────────────────────────────────────┘ |
| --- |
| ┌────────────────────────────────────────────────────────────────────────┐
│  🔴 SCOPE FLAG — HIGH CONFIDENCE                              ✕ Close  │
│  Project: Acme Corp / Brand Identity  ·  Received today at 2:34 PM    │
│────────────────────────────────────────────────────────────────────────│
│  CLIENT MESSAGE:                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 'Hi! The logo system looks great. One more thing — can we also   │  │
│  │  get a set of social media post templates in Canva format?       │  │
│  │  We'd need about 10 formats across different platforms.'         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  SOW CLAUSE REFERENCED:                                                 │
│  Section 2.2 Exclusions: 'Social media templates, post creation, and   │
│  platform-specific production are not included in this SOW.'           │
│                                                                         │
│  CONFIDENCE:  ████████░░  82%     SEVERITY:  HIGH                      │
│────────────────────────────────────────────────────────────────────────│
│  AI SUGGESTED RESPONSE:                                                 │
│  'Social media templates fall outside our current scope — I'll prepare  │
│   a change order with pricing for your review. Happy to discuss!'      │
│                                          [Edit Response]  [Copy Text]  │
│────────────────────────────────────────────────────────────────────────│
│  [ 🔴 Confirm & Generate Change Order ]  [ ✓ Mark In-Scope ] [⏰ Snooze]│
└────────────────────────────────────────────────────────────────────────┘ |
| --- |
| ┌────────────────────────────────────────────────────────────────────────┐
│  [Agency Logo & Brand Colors]                                           │
│────────────────────────────────────────────────────────────────────────│
│  Tell us about your project                                             │
│  Your answers help us build the right plan. Takes about 10 minutes.    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ What is the name of this project?               * Required     │    │
│  │ [                                                            ]  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Which best describes what you need?                            │    │
│  │  ○  New brand identity from scratch                            │    │
│  │  ○  Refresh or update an existing brand                        │    │
│  │  ○  Sub-brand or campaign identity                             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  Step 1 of 4   [██░░░░░░░░░░░░░░]  25% complete                        │
│                                                        [Next Step →]   │
└────────────────────────────────────────────────────────────────────────┘ |
| --- |
| ┌────────────────────────────────────────────────────────────────────────┐
│  [Agency Logo]           Brand Identity — Logo System v3                │
│────────────────────────────────────────────────────────────────────────│
│  Revision round: 3 of 4  [███████████░░]  1 round remaining            │
│────────────────────────────────────────────────────────────────────────│
│  ┌──────────────────────────────────┐   FEEDBACK PANEL                 │
│  │                                  │   ─────────────────────────      │
│  │   [Deliverable Preview Area]     │   Click anywhere on the image    │
│  │                                  │   to pin a comment at that       │
│  │   [Image / PDF / Figma embed]    │   exact location.                │
│  │                                  │   ─────────────────────────      │
│  │  ● Comment #1  (click to view)   │   💬 3 comments added so far     │
│  │  ● Comment #2  (click to view)   │   ─────────────────────────      │
│  └──────────────────────────────────┘   [+ Add General Note]           │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Overall feedback (optional)                                     │    │
│  │ [                                                             ] │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  [ ✓ Approve This Version ]              [ ↩ Request Changes ]         │
└────────────────────────────────────────────────────────────────────────┘ |
| --- |
| Component | Specification |
| --- | --- |
| Primary Button | Background: #0F6E56; Text: white; Height: 40px; Radius: 8px; Hover: #1D9E75 |
| Secondary Button | Background: white; Border: 1px solid #0F6E56; Text: #0F6E56; Same dimensions |
| Danger Button | Background: #DC2626; Text: white; Destructive/irreversible actions only |
| Text Input | Height: 40px; Border: 1px solid #D1D5DB; Radius: 6px; Focus ring: 2px #0F6E56 |
| Status Badge | Height: 22px; Radius: 11px (pill shape); Padding: 0 8px; 11px/500 font |
| Scope Flag Card | Left border: 4px solid #DC2626; Bg: #FEF2F2; Contains: severity, clause, 3 actions |
| Metric Card | Bg: surface-subtle; Radius: 12px; Padding: 16px; Large number + label + trend |
| Revision Counter | Progress bar; Colors: green (0–50%) → amber (51–80%) → red (80%+) |