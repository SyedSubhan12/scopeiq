<!-- converted from ScopeIQ_PRD_v3.docx -->

NOVABOTS
ScopeIQ
Product Requirements Document
v3.0  ·  Post Pressure-Test Edition  ·  2026

Why this version exists
v2.0 was built on an unvalidated assumption: that detection changes behavior. A Paul Graham-style pressure test surfaced six fatal flaws. This document rebuilds the product from the one insight that survived: the problem isn't detection — it is confrontation. ScopeIQ v3.0 makes out-of-scope a shared fact that the system announces to both parties simultaneously, removing the confrontation entirely.


# 1.  The Pressure Test — What We Learned
v2.0 was a technically excellent answer to the wrong question. A structured pressure test identified six flaws, ranked by severity. Each one informed a specific architectural or product decision in v3.0. This section exists so every engineer, designer, and stakeholder understands why the product changed — not just what changed.

## 1.1  Fatal Flaws & Their v3.0 Resolutions


## 1.2  The Core Assumption (Testable Before Building)
The one question everything depends on
When a freelancer is shown that a client request is out of scope — in real time, with the SOW clause cited — do they send a change order or absorb the request anyway? If they absorb it, the root cause is courage, not information. Software cannot fix courage. If they act on it, the root cause is friction and the product eliminates that friction. This is the 30-day behavioral test that gates the full build.
### The 30-Day Behavioral Test Protocol
Before Sprint 1 begins, recruit 20 freelancers who have lost money to scope creep in the last 90 days. Give them a Notion template to log every scope flag moment for 30 days. Measure one metric:
- When they identify an out-of-scope request, what % send a change order vs. absorb the cost silently?
- Threshold to proceed: >40% send change orders unaided → friction problem → ScopeIQ solves it.
- Threshold to pivot: <20% send change orders → courage problem → product reframed as conversation scripts, not detection.
- Gate: No Sprint 1 begins without this data. This is non-negotiable. AGENT-IMPL owns enforcing this gate.

# 2.  The Reframe — From Detection Tool to Shared Reality System

The founding thesis rewritten
Creative professionals don't lose revenue because they're bad at business. They lose it because they're good at relationships. ScopeIQ removes the choice between protecting the relationship and protecting the revenue. When the system speaks, nobody has to.

# 3.  Updated User Personas
Persona targeting has been sharpened based on the pressure test finding: the wrong adopter is the chronically aware freelancer who has 'always' had this problem (they adapted around it). The right adopter is recently burned — anger is activation energy.

## 3.1  Maya — The Recently Burned Freelancer  [PRIMARY BEACHHEAD]

## 3.2  James — The Studio Lead  [EXPANSION PERSONA]

# 4.  Business Model — Take-Rate, Not Subscription
The subscription model was identified as a retention-alignment failure in the pressure test. A take-rate model is adopted, modeled on Stripe's pricing philosophy: we make money exactly when you make money.

## 4.1  Revenue Architecture

## 4.2  Unit Economics

## 4.3  Stripe Analogy — Why This Model Wins
Model precedent: Stripe
Stripe charges 2.9% + $0.30 per transaction. No monthly fee to start. Stripe earns only when merchants earn. Merchants never question whether Stripe is 'worth it' because the invoice answers the question automatically. ScopeIQ adopts this model verbatim for scope enforcement: 4% of every accepted change order. The invoice is the proof of value. Cancellation means walking away from recovered revenue.

# 5.  Launch Sequence — Ship One, Prove It, Expand
The fatal flaw of v2.0 was three modules at launch. v3.0 ships in three gates, each gated by proof of the previous module's core assumption.


# 6.  Functional Requirements — Scope Guard (Gate 1 — Launch)
Every requirement below includes the real-world big tech pattern it is modeled on. Each pattern was selected because it has been proven at scale in a production environment solving an analogous problem. Agents are bound to implement the pattern as specified — deviation requires Lead Architect sign-off.


FR-SG-001  P0 — MUST HAVE  Client Request Inbox (replaces email forwarding)
As a freelancer, I want every client communication to flow through a single project inbox so that Scope Guard can analyze every message without relying on fragile email forwarding.
🏢  Big Tech Pattern
Intercom Conversations + Linear Issue Inbox — Intercom built a unified inbox that routes all customer messages regardless of channel. Linear's issue inbox ensures all project communications are captured before being routed. Both prove that channel consolidation is an adoption problem, not a technical problem — solve it with a great client experience, not forwarding hacks.
Technical Implementation
Client submits all project messages via portal inbox (React controlled textarea + submit). Messages stored in messages table on POST. BullMQ job dispatched: { job_type: 'check_scope', message_id, project_id }. Portal inbox renders like iMessage — client-authored messages on right, agency responses on left. Agency response always includes an inline status badge: In Scope (green) | Flagged (red) | Pending (amber). Resend MX forwarding kept as fallback only — not primary channel. Client onboarding email generated at project creation with branded invitation to use the portal inbox.
Acceptance Criteria
- Client can submit a message in under 3 taps (open portal, tap inbox, type, send)
- Agency receives Supabase real-time push within 500ms of client submission
- Message thread renders correctly on mobile at 375px (iMessage-style layout)
- In-scope / flagged badge visible on every message within 5 seconds of submission
- Email fallback: if client emails project address, message ingested and appears in inbox with 'via email' label
- No message lost — all submissions logged to messages table before scope check begins
- Client onboarding email generated in < 60s of project creation, includes portal link and 1-line explanation


FR-SG-002  P0 — MUST HAVE  Simultaneous Bilateral Scope Flag Notification
As a freelancer, I want both me and my client to see a scope flag at the same time — so neither of us has to raise it first and the confrontation never happens.
🏢  Big Tech Pattern
Stripe Radar + GitHub PR Status Checks — Stripe Radar shows fraud flags to the merchant — but the card decline also shows a message to the customer simultaneously. Neither party initiated the conversation; the system did. GitHub PR status checks work identically: both author and reviewer see the CI result; nobody has to tell the other. This bilateral announcement pattern is the core architectural innovation in v3.0.
Technical Implementation
When scope check detects is_in_scope=false AND confidence>0.60: (1) Agency dashboard: ScopeFlagCard appears in feed with red nav badge — Supabase real-time push. (2) Client portal: inline under the flagged message, a system message appears: 'This request appears to fall outside our current agreement. [Agency name] has been notified and will follow up with options.' — rendered in a distinct amber system bubble, not attributable to either party. (3) Both events written to audit_log in same transaction. (4) Agency sees: Confirm (generate CO) | Mark In-Scope | Snooze. (5) Client sees: nothing actionable — just the fact. Agency drives resolution.
Acceptance Criteria
- Client sees system flag message within 5 seconds of submission (p95)
- Agency sees ScopeFlagCard in feed within 5 seconds (p95)
- System message is visually distinct from client and agency messages (amber system bubble, platform-attributed)
- Client message showing 'flagged' badge visible in inbox thread
- System message copy never attributes the flag to the agency ('our agreement' — shared language)
- Both notifications written atomically — client sees flag if and only if agency sees flag
- If flag is dismissed as in-scope by agency: client system message updates to 'Confirmed in scope' automatically


FR-SG-003  P0 — MUST HAVE  SOW Ingestion and Structured Clause Editor
As an agency owner, I want to upload my signed SOW and have AI extract every scope boundary into an editable clause library — the source of truth for all flag detection.
🏢  Big Tech Pattern
Notion Database Import + Docusign Envelope Parsing — Notion's CSV import extracts data into structured database rows that are then editable before publishing. DocuSign's completed envelope parser extracts fields from signed contracts. Both prove that AI extraction followed by human review is the correct pattern — never trust raw AI output as authoritative before a human confirms it.
Technical Implementation
PDF uploaded via R2 presigned URL. PyMuPDF extracts text. Claude API parses with tool_use output schema: { deliverables[], revision_limits[], timeline_milestones[], exclusions[], payment_terms[] }. Each clause stored in sow_clauses table with clause_type enum. Agency reviews in a grouped editor UI: clauses grouped by type in accordion panels. Individual clauses editable inline (contenteditable). Bulk activate button sets sow.status=active only after agency confirmation modal showing clause count by type. SOW status: draft → reviewing → active. Only active SOW triggers scope checking.
Acceptance Criteria
- PDF and plain text accepted
- Extraction completes in <30 seconds for 10-page SOW (p95)
- >85% clause extraction accuracy validated against 20-SOW test corpus before launch
- Clauses grouped by type (deliverables, exclusions, revision limits, timeline, payment)
- Every clause individually editable, deletable, and addable before activation
- Activation confirmation modal shows clause count by type — agency must confirm
- Only one SOW can be active per project at a time — activation deactivates previous SOW
- SOW activation writes to audit_log with clause count and activating user identity


FR-SG-004  P0 — MUST HAVE  Scope Flag Detection Engine (<5s p95)
As a freelancer, I want every client message analyzed against the active SOW in real time so I never miss an out-of-scope request before it becomes unbilled work.
🏢  Big Tech Pattern
Stripe Radar Fraud Detection + Intercom AI Copilot — Stripe Radar processes every card transaction in real time (sub-second) against hundreds of rules without blocking the payment. Intercom's AI Copilot classifies every support message and surfaces a confidence score to the agent before they respond. Both demonstrate that classification must be fast enough to be imperceptible and specific enough to be actionable — confidence score + cited rule is the minimum viable output.
Technical Implementation
Message ingested → BullMQ job dispatched: { job_type: 'check_scope', message_id }. FastAPI worker fetches message + all active sow_clauses. Claude API called with tool_use output schema: { is_in_scope: bool, confidence: float, matching_clauses: [{ clause_id, clause_text, relevance }], severity: 'low'|'medium'|'high', suggested_response: string }. Flag created only if is_in_scope=false AND confidence>0.60. Axiom metric written on every job: duration_ms, confidence, is_flagged, tokens_used. BullMQ concurrency: max 5 concurrent Claude API calls. Exponential backoff on 429. Dead letter queue for failed jobs after 3 retries.
Acceptance Criteria
- Flag appears on agency dashboard within 5 seconds of message submission (p95) — Axiom SLA alert if exceeded
- False positive rate <15% — validated against 20-message test corpus before launch
- Confidence score shown as % with color coding: <60% gray, 60-79% amber, 80%+ red
- SOW clause referenced verbatim — not paraphrased
- Severity enum: low | medium | high — based on clause type (exclusion=high, revision limit=medium, timeline=low)
- AI suggested response generated — professional, non-confrontational, editable by agency
- Test mode available: flag analysis runs without creating records or notifying client
- Confidence threshold configurable per workspace (default 0.60, range 0.45–0.80)


FR-SG-005  P0 — MUST HAVE  One-Click Change Order Generator with Rate Card Pricing
As a studio lead who has confirmed an out-of-scope request, I want a professional change order generated in one click — pre-priced from my rate card — so every scope expansion becomes a documented billable conversation.
🏢  Big Tech Pattern
PandaDoc Smart Fields + Bonsai Proposal Templates — PandaDoc generates contract documents from a structured data model with smart fields — price tables, e-signature blocks, and work descriptions populated from CRM data. Bonsai auto-fills proposal line items from a stored service catalog. Both prove that document generation from structured data (flag context + rate card) produces a professional output faster than manual writing, with higher consistency.
Technical Implementation
scope_flags.status confirmed → BullMQ job: { job_type: 'generate_change_order', flag_id }. AI Worker fetches flag + SOW clause + rate_card_items. Claude generates: { title, work_description, estimated_hours, pricing: { amount, currency, basis }, revised_timeline }. change_orders record created (status: draft). Agency edits inline in ChangeOrderEditor component (all fields editable). Send button → change_orders.status=sent → Resend CHANGE-ORDER-01 email to client with Accept/Decline action links. Accept → PATCH /api/change-orders/:id/accept → sow_clauses updated in same transaction → scope_flags.status=resolved. Take-rate: Stripe payment intent created at 4% of change order amount — charged only on client acceptance.
Acceptance Criteria
- Change order draft ready within 5 seconds of confirmation (p95)
- All fields editable before sending: title, work description, hours, price, timeline
- Price auto-calculated from rate card but overridable — override logged in audit_log
- Stripe payment intent created at 4% of CO value on generation — collected on acceptance
- Client Accept/Decline email links work without portal login (token-authenticated)
- Typed name + timestamp = legally binding acceptance — stored as signed_by_name + signed_at
- Accepted CO updates sow_clauses in same DB transaction as status change — atomic, no partial state
- PDF generated server-side on acceptance — stored in R2 private ACL — accessible via short-lived presigned URL
- Complete CO history per project — all versions, statuses, and signatures accessible


FR-SG-006  P1 — SHOULD HAVE  Scope Meter Dashboard — Visual Scope Consumption
As a freelancer, I want a visual scope consumption meter showing how much of the contracted scope has been used so I can see pressure building before it becomes a flag.
🏢  Big Tech Pattern
Linear Progress Indicators + Harvest Time Budget Burndown — Linear's project progress bar shows issue completion against total issues — gives a health signal without requiring the user to calculate. Harvest's budget burndown chart shows hours consumed vs. budgeted in real time, creating natural urgency before the limit is exceeded. Both demonstrate that proactive visualization changes behavior more than reactive alerts.
Technical Implementation
scope_meter_pct = (completed_deliverables / total_deliverables) * 0.6 + (revision_rounds_used / revision_limit) * 0.4. Rendered as a horizontal progress bar in project detail header. Color states: 0-50% green (#059669), 51-80% amber (#D97706), 80-99% red (#DC2626), 100% red pulsing. Supabase real-time subscription updates meter on any deliverable status change or revision_round increment. Hover tooltip shows breakdown: X of Y deliverables complete · X of Y revision rounds used.
Acceptance Criteria
- Scope meter visible on project detail page without scrolling
- Meter updates in real time when revision rounds are submitted or deliverables approved
- Color transitions smooth (CSS transition 300ms)
- Hover tooltip shows deliverable and revision breakdown separately
- At 100%: meter pulses with CSS animation, banner appears: 'Contracted scope fully consumed'
- Meter visible to both agency and client in their respective views


# 7.  Functional Requirements — Approval Portal (Gate 2)
Gate 2 begins only when Scope Guard has proven the behavioral change at Gate 1. Every approval portal feature is modeled on a best-in-class real-world pattern. No feature ships without the big tech implementation precedent cited below being reviewed and understood by the implementing agent.


FR-AP-001  P0 — MUST HAVE  White-Label Portal Configuration
As a studio lead, I want to configure the client portal with my agency logo and brand colors and a custom domain so every client interaction reinforces our brand identity — not ScopeIQ's.
🏢  Big Tech Pattern
HoneyBook Client Hub + Dubsado White-Label — HoneyBook's client hub injects agency branding (logo, colors, fonts) as CSS custom properties at the subdomain level — clients never see HoneyBook branding. Dubsado goes further, supporting full custom domains via CNAME with automatic SSL provisioning. Both prove that white-label is a trust mechanism for the agency's clients, not a feature — it must be invisible.
Technical Implementation
Logo stored in Cloudflare R2 as PNG/SVG (≤2MB). CSS variables injected server-side per workspace in portal layout.tsx Server Component: --primary, --secondary, --font. Default URL: {slug}.scopeiq.com via Cloudflare subdomain routing. Custom domain: agency adds CNAME → Cloudflare Tunnels handles SSL automatically. DNS verification polling every 60s for up to 24h. 'Powered by ScopeIQ' watermark removed via plan-gated CSS class on Studio+ tier.
Acceptance Criteria
- Logo uploads (PNG, SVG, JPG) up to 2MB with live preview
- Hex color picker with real-time portal preview (no page refresh)
- Default subdomain active within 5 minutes of workspace creation
- Custom domain active within 5 minutes of DNS propagation
- Zero ScopeIQ branding visible on paid plans — validated by automated screenshot test in CI
- CSS variables applied to all portal elements including scope flag system messages


FR-AP-002  P0 — MUST HAVE  Point-Anchored Annotation on Deliverables
As a client reviewing a design, I want to click anywhere on an image or PDF and leave a comment anchored to that exact location so my feedback is unambiguous.
🏢  Big Tech Pattern
Figma Multiplayer Comments + Markup.io — Figma's comment system stores pin coordinates as percentage of canvas dimensions (not pixels) — making comments device-agnostic and resolution-independent. Markup.io extends this pattern to static images and PDFs. Both prove that percentage-based coordinates are the only correct storage format for annotation pins — pixel values break on zoom, retina displays, and screen size changes.
Technical Implementation
SVG overlay renders on top of deliverable viewer. Click handler captures (clientX/canvasX)*100 = x_pos%, (clientY/canvasY)*100 = y_pos%. Pins stored as x_pos/y_pos as percentage of image dimensions — never pixel values. Pins rendered as numbered circles (24px, filled teal, white number). Hover over pin highlights linked comment in right panel (bidirectional). Click on pin focuses comment thread. Agency can resolve pins (hidden from client, preserved in DB). PDF: page_number stored alongside coordinates.
Acceptance Criteria
- Pins placeable anywhere on image or PDF
- Coordinates display correctly at all zoom levels and screen sizes (375px to 1920px)
- 3-character minimum on comment text with inline validation
- Hovering a pin highlights the linked comment in the panel (bidirectional)
- Resolved pins grayed with checkmark — collapsed in panel but preserved in DB
- PDF: page navigator at bottom; pins survive page navigation
- WCAG 2.1 AA: keyboard alternative for pin placement (Tab to navigate canvas, Enter to place)


FR-AP-003  P0 — MUST HAVE  Revision Round Tracker with At-Limit Modal
As a studio lead, I want a visible revision round counter shown to both agency and client so clients understand when additional rounds will incur a charge — before they submit feedback.
🏢  Big Tech Pattern
DocuSign Envelope Status + Linear Cycle Limits — DocuSign's envelope status indicator tells all parties exactly where they are in the signing process — no party is uninformed. Linear's sprint/cycle tracking shows remaining capacity before the cycle closes. Both prove that proactive visibility of limits changes behavior before the limit is hit — not as a punitive surprise after.
Technical Implementation
revision_limit imported from sow_clauses on SOW activation. current_round incremented each time client submits feedback on a deliverable. Displayed in portal header for both views as a progress bar with color states: 0-50% green, 51-80% amber, 80%+ red. At limit: client sees modal (blurred backdrop, centered dialog — cannot scroll behind): 'You have used all included revision rounds. Additional rounds are billable.' Modal shows pre-generated add-on quote from rate card. Cannot be dismissed without explicit acknowledgment (checkbox: 'I understand additional rounds will be charged'). Acknowledgment logged to audit_log.
Acceptance Criteria
- Counter updates in real time — no refresh required (Supabase subscription)
- Client sees identical counter value as agency
- Color transitions: green → amber → red at correct thresholds
- At-limit modal cannot be dismissed without explicit checkbox acknowledgment
- Acknowledgment event written to audit_log with timestamp and client identity
- Pre-generated add-on quote shown in modal — pulls from rate card automatically
- Revision limit importable from SOW or manually set in project settings


FR-AP-004  P0 — MUST HAVE  Automated Approval Reminder Sequence with Silence-as-Approval
As a freelancer, I want an automated escalating reminder sequence for unresponsive clients so my timelines are protected without manual chasing.
🏢  Big Tech Pattern
Linear Notification System + GitHub PR Review Reminders — Linear batches and escalates notifications — gentle first ping, then more urgent follow-ups — without alert fatigue. GitHub's PR review reminders escalate from Slack nudge to blocking-review status. Both prove that a 3-step progressive escalation with a clear terminal state (approve or block) is the correct pattern — infinite reminders with no consequence train clients to ignore them.
Technical Implementation
BullMQ delayed job pipeline. Step 1 (default: 48h): REMIND-01 gentle nudge. Step 2 (default: 72h after Step 1): REMIND-02 deadline warning. Step 3 (default: 48h after Step 2): REMIND-03 final — silence = approval. Step 3 creates approval_events record (silence_approved) and notifies agency. All steps configurable per workspace and overridable per project. Each email includes direct Approve/Decline links (token-authenticated, no portal login required). All sends logged to reminder_logs with sent_at and Resend delivery_status.
Acceptance Criteria
- Reminder schedule configurable in hours/days per step (workspace default + per-project override)
- Minimum 3 configurable steps
- Reminder emails sent within 5 minutes of threshold crossing
- Renders correctly in Gmail, Outlook, Apple Mail — tested in CI via email rendering service
- Approve/Decline links work without portal login (token-authenticated)
- Silence-as-approval event appears in project audit trail with timestamp
- Agency can pause or reset sequence per project at any time
- Full reminder log visible in project timeline


# 8.  Functional Requirements — Brief Builder (Gate 3)
Gate 3 begins only when the Approval Portal has proven demand at Gate 2. Brief Builder is the least novel module — it competes with Typeform and Tally in an established market. It is included only because it creates a data foundation for Scope Guard. It ships last, and it ships only if organic demand from Gate 2 users justifies it.


FR-BB-001  P0 — MUST HAVE (Gate 3)  Conversational Multi-Step Brief Form
As a freelancer, I want clients to complete a structured intake form that feels simple and guided — not like a government form — so I receive complete project information before kickoff.
🏢  Big Tech Pattern
Typeform Conversational Flow + Tally Minimal UI — Typeform pioneered one-question-per-screen conversational forms — completion rates are 57% higher than traditional multi-field forms. Tally proved that minimal, clean UI achieves the same result without Typeform's price. Both prove that brief intake should feel like a conversation, not a questionnaire. The psychological contract with the client starts here.
Technical Implementation
React Hook Form + Zod. One question per screen on mobile (Typeform-style). Animated slide transitions between questions (150ms ease-out). Progress: discrete step dots + percentage text. Field types: text, textarea, single choice (card layout), multi-choice (checkbox cards), date (native picker, brand-colored), file upload (drag-drop zone). Conditional logic: evaluateShowRules(fieldSchema, currentValues) evaluated client-side. Auto-save to localStorage on every change. Submitted via POST /api/briefs/:templateId/submit → dispatches score_brief BullMQ job.
Acceptance Criteria
- One question per screen on mobile (375px)
- Animated transitions between steps (slide direction indicates forward/back)
- Progress indicator: step dots + percentage complete
- Single-choice fields render as large card options (not small radio buttons)
- File upload: drag-drop zone with file type icon preview and upload progress bar
- Auto-save indicator: 'Saved' badge appears after every field change
- Conditional logic hides irrelevant fields — hidden fields excluded from submission payload
- Submission triggers scoring job within 2 seconds of confirmation


FR-BB-002  P0 — MUST HAVE (Gate 3)  AI Brief Clarity Scorer with Auto-Hold
As a freelancer receiving a submitted brief, I want an AI clarity score within 10 seconds with specific flags so I never begin work on a brief that will cause scope disputes downstream.
🏢  Big Tech Pattern
Grammarly Clarity Score + Notion AI Writing Quality — Grammarly's clarity score gives a single 0-100 number with per-sentence flags. Notion AI's writing quality feedback flags specific passages with specific improvement suggestions — not generic advice. Both prove that a score without specific, actionable flags is anxiety without resolution. The clarity score must be paired with per-field flags and an auto-generated clarification question per flag.
Technical Implementation
BullMQ score_brief job. FastAPI fetches brief fields. Claude API tool_use output: { score: int, flags: [{ field_key, reason, severity, clarification_question }] }. Score stored in briefs.clarity_score. Flags stored in brief_fields.ai_flag + ai_flag_reason. If score < threshold (default 70): brief.status = clarification_needed. Resend BRIEF-CLARIFY-01 dispatched with numbered clarification question list. Client portal shows 'A few more details needed' screen. Re-submission triggers full re-scoring cycle, version incremented.
Acceptance Criteria
- Score visible within 10 seconds of submission (p95)
- Minimum 3 actionable flags for briefs scoring below 70
- Each flag references the specific field_key that triggered it
- Auto-generated clarification question per flag (specific, not generic)
- Hold triggered within 2 seconds of score generation
- Client clarification email dispatched within 60 seconds of hold
- Re-submitted brief triggers full scoring cycle — version incremented in briefs table
- Agency override of hold requires mandatory reason — logged in audit_log


# 9.  Agent Team — Roles, Authority, and Enforcement
ScopeIQ is built by a parallel multi-agent team. This section defines each agent's authority boundaries, enforcement powers, and merge-blocking criteria. No agent may exceed their defined scope without Lead Architect sign-off. All enforcement decisions are logged to the project audit trail.


## 9.1  Absolute Code Rules (All Agents Enforce — Zero Exceptions)

Rule 1
TypeScript strict:true everywhere. noUncheckedIndexedAccess:true, exactOptionalPropertyTypes:true. Zero @ts-ignore. Zero any casts. AGENT-BE and AGENT-FE block any PR violating this.
Rule 2
No raw SQL. All database access via Drizzle ORM. Every query includes explicit workspaceId filter. RLS alone is insufficient — both layers must enforce isolation. AGENT-DB blocks PRs missing workspaceId.
Rule 3
All AI calls dispatched as BullMQ jobs. No direct Anthropic SDK imports in apps/web or apps/api. AGENT-AI blocks any PR importing Anthropic SDK outside apps/ai/.
Rule 4
Files uploaded only via R2 presigned URLs. File content never in API request bodies. AGENT-BE blocks any endpoint accepting file bytes directly.
Rule 5
No client-side secrets. Only NEXT_PUBLIC_ vars in apps/web/src. AGENT-SEC runs secret scan on every PR and blocks immediately on violation.
Rule 6
Every mutation writes audit_log in the same DB transaction. No exceptions. AGENT-DB verifies audit_log write in every service layer test.
Rule 7
All P0 features require Vitest unit test + Playwright E2E before merge. AGENT-TEST blocks any P0 PR without both tests passing in CI.
Rule 8 (NEW)
The bilateral flag notification must be atomic. If the agency sees a flag, the client sees the system message — or neither sees anything. Split-brain state is a trust violation. AGENT-BE enforces this as a transaction constraint.
Rule 9 (NEW)
Gate enforcement is mandatory. No Sprint 2 (Approval Portal) begins before Gate 1 metrics are proven. No Sprint 3 (Brief Builder) begins before Gate 2 metrics are proven. AGENT-IMPL has veto authority over sprint start.
Rule 10 (NEW)
Take-rate Stripe charges are created at change order generation (not acceptance). Collected only on acceptance. The Stripe payment intent must be logged in audit_log when created. AGENT-BE enforces as part of CO generation service.

## 9.2  Implementation Order (Non-Negotiable — AGENT-IMPL Enforces)
For every feature, files must be generated in this exact order. No frontend code for a feature before the backend route exists. No backend route before the schema exists.


# 10.  Non-Functional Requirements
## 10.1  Performance SLAs (Product Features — Not Aspirations)
These are product SLAs enforced by Axiom alerts. Exceeding any of these thresholds in production triggers an automated PagerDuty alert to the on-call engineer. These are not guidelines — they are contractual commitments to users.


## 10.2  Security Requirements

## 10.3  Out of Scope — v1.0

# 11.  Appendix — Pressure Test Full Record
This appendix preserves the complete pressure test findings as a permanent record. Future product decisions must be traceable to either a resolution of one of these flaws or a conscious acceptance of the risk.

Flaw #1 (Fatal) — Resolved
Original: Product gives the agency information they already have. The confrontation is the problem, not the detection. Resolution: Bilateral flag notification removes the confrontation from the architecture. System announces the fact to both parties simultaneously. Neither party has to speak first.
Flaw #2 (Fatal) — Resolved
Original: Client adoption is a hidden dependency. Email forwarding is fragile and unreliable. Resolution: Client inbox is a first-class product feature. Email forwarding deprecated as primary channel. Onboarding flow introduces portal as the professional project communication channel.
Flaw #3 (High) — Resolved
Original: Three modules at launch dilutes the one novel thing. Resolution: Gate-gated launch sequence. Scope Guard only at Gate 1. Brief Builder ships last, at Gate 3, only if organic demand from Gate 2 users justifies it.
Flaw #4 (High) — Resolved
Original: Product works itself out of a job. Success means fewer flags, which threatens subscription retention. Resolution: Take-rate model eliminates this. ScopeIQ earns a percentage of value delivered. Maximum revenue when the product is most valued. Churn only happens when users stop generating change orders.
Flaw #5 (Medium) — Partially Resolved
Original: Wrong persona adopts. Chronically aware freelancers have adapted; recently burned freelancers are the right target. Resolution: ICP refined to recently-burned freelancers ($7K+ scope loss in last 90 days). Community outreach in freelancer Slack groups and Reddit. Organic acquisition through 'I just got stiffed' moments. AGENT-IMPL monitors acquisition channel for ICP drift.
Flaw #6 (Medium) — Resolved via Model Change
Original: Market ceiling is bootstrapped-scale at $199/mo subscription. Resolution: Take-rate model at 5K users = $480K MRR. Path to $5M ARR at 10K users without price increases. Agency tier expansion (consultants, all SOW-based professionals) lifts ceiling by 5× in Year 2.

Novabots — ScopeIQ PRD v3.0 — Post Pressure-Test Edition — Confidential — 2026
| Document | ScopeIQ PRD v3.0 |
| --- | --- |
| Company | Novabots |
| Status | Active Development — Post Pressure-Test Rebuild |
| Target Launch | Q3 2026 (Scope Guard MVP)  ·  Q4 2026 (Full Portal) |
| Business Model | 4% take-rate on accepted change orders — zero monthly fee |
| Core Insight | Make out-of-scope a shared fact, not an agency accusation |
| Pressure Test Architect | Paul Graham evaluation framework — six fatal flaws resolved |
| # | Flaw | Severity | v3.0 Resolution |
| --- | --- | --- | --- |
| 1 | Product gives agencies information they already have. The real problem is the confrontation, not the detection. | FATAL | Client portal announces flags to both parties simultaneously. Confrontation removed from the architecture entirely. |
| 2 | Client adoption hidden dependency. Scope Guard only works if clients communicate through the portal. Email forwarding is fragile. | FATAL | Client inbox is a first-class product. All project comms route through the portal. Email forwarding deprecated. |
| 3 | Three products, one launch. Brief Builder and Approval Portal each compete in established markets with no novel advantage. | HIGH | Launch Scope Guard only. Brief Builder and Approval Portal become v1.1 features after core behavior is proven. |
| 4 | Product works itself out of a job. Success means fewer scope flags, which threatens subscription retention. | HIGH | Take-rate model (4% of accepted COs) eliminates this. Zero revenue when no flags; maximum revenue when the product is valued. |
| 5 | Wrong persona adopts. Freelancers disciplined enough to set up ScopeIQ already manage scope reasonably. | MEDIUM | Target recently-burned freelancers ($7K+ scope loss in last 90 days) via community outreach, not chronically aware ones. |
| 6 | Market ceiling is bootstrapped, not venture-scale, at $199/mo subscription. | MEDIUM | Take-rate model lifts ceiling. 5K users × 3 COs/mo × $800 avg × 4% = $480K MRR. Path to $5M ARR at 10K users. |
| Dimension | v2.0 (Detection Tool) | v3.0 (Shared Reality System) |
| --- | --- | --- |
| Core metaphor | Alarm system for the agency | Shared scoreboard visible to both players |
| Who sees the flag first? | Agency only — then they decide whether to raise it | Both parties simultaneously — no one raises it first |
| Confrontation | Inevitable — agency must send the change order | Eliminated — the system announced the fact already |
| Client adoption required? | Fragile workaround via email forwarding | First-class product — client inbox is the platform |
| Revenue model | $99–$199/mo subscription (self-service) | 4% take-rate on accepted change orders (outcome-based) |
| Retention driver | Ongoing value from continued use | Every accepted CO is proof; product becomes irreplaceable |
| Market ceiling | ~$24M ARR at 10K users | $480K MRR at 5K users; path to $5M ARR by Year 2 |
| Launch strategy | All three modules simultaneously | Scope Guard only — prove behavior first, expand second |
| Attribute | Detail |
| --- | --- |
| Role | Brand Designer — Solo Freelancer |
| Trigger event | Lost $6,000+ in unbilled scope on the last project. Active resentment, not passive acceptance. |
| Willingness to act | HIGH — currently in pain. Will adopt a system immediately if it removes the awkward conversation. |
| WTP | $0/month (take-rate model). Will share 4% of what she recovers. Asks: 'did it work?' not 'is it worth $99/mo?' |
| Adoption barrier | Client must use the portal. Maya needs a template to introduce the portal to clients professionally. |
| Key metric for Maya | First accepted change order — within 14 days of signup. This is ScopeIQ's 'aha moment'. |
| Attribute | Detail |
| --- | --- |
| Role | Creative Director — 3–5 person brand studio |
| Trigger event | Retainer client requested 60 hours of unbilled work in Q1. Team noticed. James absorbed it to keep the contract. |
| Willingness to act | MEDIUM — organizational inertia. Needs to see Maya use it first. Converts on case study, not demo. |
| WTP | 4% of team-wide change orders. At studio scale, that is $1,200–$2,400/month in take-rate. Strong incentive. |
| Adoption driver | Team visibility into scope consumption. Studio-wide scope meter is the feature that unlocks James. |
| Key metric for James | Scope flag seen by junior team member who then generated CO without asking James first. Delegation unlocked. |
| Tier | Fee Structure | Activation |
| --- | --- | --- |
| Free — Scope Guard | Zero monthly fee. 4% of all accepted change orders. | Email signup. Upload one SOW. Invite one client. Done. |
| Studio (Optional Add-on) | $49/mo flat + 3% take-rate (reduced from 4%) | Unlocks team workspace, 5 users, studio-wide scope meter. |
| Agency (Optional Add-on) | $99/mo flat + 2.5% take-rate | Unlocks API access, Slack integration, unlimited users. |
| Metric | Conservative | Base Case | Optimistic |
| --- | --- | --- | --- |
| Active freelancers (Yr 1) | 1,000 | 5,000 | 12,000 |
| Avg change orders/user/mo | 1.5 | 3 | 4.5 |
| Avg change order value | $600 | $800 | $1,000 |
| ScopeIQ take rate | 4% | 4% | 3.5% |
| MRR (take-rate only) | $36K | $480K | $1.89M |
| ARR | $432K | $5.76M | $22.7M |
| Freelancer avg monthly gain | $864 billed vs $0 | $2,304 vs $0 | $4,275 vs $0 |
| Gate | Module | What Must Be Proven Before Moving On | Target |
| --- | --- | --- | --- |
| Gate 0 | 30-Day Behavioral Test | >40% of freelancers act on scope flag data. If <20%, pivot before building. | Pre-sprint — Week 1-2 |
| Gate 1 | Scope Guard MVP | 100 freelancers. >30% accept a change order in first 30 days. NPS > 40. | Q2 2026 |
| Gate 2 | Approval Portal | Scope Guard users request approval tracking. Organic demand, not push. | Q3 2026 |
| Gate 3 | Brief Builder | Portal users request brief intake. Demand proven by support tickets. | Q4 2026 |
| Gate 4 | Agency / Team Tier | Solo users onboarding their team. Studio tier adoption >15% of active users. | Q1 2027 |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-FE (portal inbox) + AGENT-BE (message routing) + AGENT-AI (scope check) | 13 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-FE + AGENT-BE + AGENT-AI | 13 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-AI (extraction) + AGENT-BE (storage) + AGENT-FE (editor) | 13 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-AI (detection) + AGENT-BE (job dispatch) + AGENT-FE (flag card) | 13 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-AI (generation) + AGENT-BE (Stripe + SOW update) + AGENT-FE (editor + PDF) | 13 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-FE (component) + AGENT-BE (real-time subscription) | 8 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-FE + AGENT-BE (DNS verification) | 10 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-FE (SVG canvas) + AGENT-BE (storage) | 13 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-FE (counter + modal) + AGENT-BE (real-time subscription) | 8 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-BE (BullMQ scheduler) + AGENT-AI worker (email dispatch) | 10 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-FE (form) + AGENT-BE (submission endpoint) + AGENT-AI (scoring job) | 10 SP |
| Agent Responsible | Story Points |
| --- | --- |
| AGENT-AI (scoring) + AGENT-BE (hold flow) + AGENT-FE (hold state UI) | 13 SP |
| Agent ID | Role | Authority | Can Block Merge? | SLA |
| --- | --- | --- | --- | --- |
| AGENT-LEAD | Lead Architect | Full architecture authority. Resolves agent conflicts. Signs off on all deviations. | YES — any PR | 24h review |
| AGENT-FE | Frontend Architect | All apps/web/* decisions. Component library. Responsive breakpoints. Accessibility. | YES — FE PRs | 8h review |
| AGENT-BE | Backend Architect | All apps/api/* decisions. Route design. Service layer. BullMQ dispatch. | YES — BE PRs | 8h review |
| AGENT-AI | AI Pipeline Engineer | All apps/ai/* decisions. Prompt versioning. Output schema. Latency SLAs. | YES — AI PRs | 8h review |
| AGENT-DB | Database Architect | All packages/db/* decisions. Schema changes. Migration approval. RLS policies. | YES — any PR touching DB | 4h review |
| AGENT-SEC | Security Auditor | Secret exposure scan. Auth flow review. Token security. Rate limiting. | YES — security violations | Immediate block |
| AGENT-UX | UX & Design Systems | Design token enforcement. Big tech pattern compliance. Responsiveness audit. | YES — UX regressions | 8h review |
| AGENT-TEST | QA Architect | Test coverage enforcement. E2E test authorship. CI gate management. | YES — P0 tests missing | Before merge |
| AGENT-IMPL | Implementation Planner | Sprint planning. Gate management. Behavioral test protocol enforcement. | YES — gate violations | Before sprint start |
| Step | File | Location | Agent |
| --- | --- | --- | --- |
| 1 | Drizzle table + types | packages/db/schema/[feature].schema.ts | AGENT-DB |
| 2 | Migration | packages/db/migrations/[timestamp].sql | AGENT-DB |
| 3 | Repository (DB queries) | apps/api/src/repositories/[feature].repository.ts | AGENT-BE |
| 4 | Service (business logic) | apps/api/src/services/[feature].service.ts | AGENT-BE |
| 5 | Zod schemas (req/res) | apps/api/src/routes/[feature].schemas.ts | AGENT-BE |
| 6 | Hono route handler | apps/api/src/routes/[feature].route.ts | AGENT-BE |
| 7 | Vitest unit tests | apps/api/src/services/[feature].service.test.ts | AGENT-TEST |
| 8 | AI Pydantic schema | apps/ai/app/schemas/[feature].py | AGENT-AI |
| 9 | AI BullMQ worker | apps/ai/app/workers/[feature].worker.py | AGENT-AI |
| 10 | React Query hook | apps/web/src/hooks/use[Feature].ts | AGENT-FE |
| 11 | React component | apps/web/src/components/[module]/[Feature].tsx | AGENT-FE |
| 12 | Playwright E2E | apps/web/tests/e2e/[feature]-flow.spec.ts | AGENT-TEST |
| Operation | SLA Target | Measurement | Alert Threshold |
| --- | --- | --- | --- |
| Bilateral scope flag notification (agency + client) | <5 seconds p95 | BullMQ job duration → Axiom | >7s triggers PagerDuty |
| AI brief clarity scoring | <10 seconds p95 | BullMQ job duration → Axiom | >15s triggers PagerDuty |
| Change order generation | <5 seconds p95 | BullMQ job duration → Axiom | >8s triggers PagerDuty |
| Portal page load | <2 seconds on 4G (LCP) | Vercel Analytics RUM p95 | >3s triggers Slack alert |
| API REST endpoints | <300ms p95 | Sentry performance monitoring | >500ms triggers Slack alert |
| Real-time flag push (DB write → dashboard) | <500ms | Supabase real-time latency | >1s triggers Slack alert |
| File upload 500MB | Async with progress — no page block | R2 multipart upload XHR progress | UI blocks = SEV-1 |
| System uptime (paid plans) | 99.5% monthly SLA | Vercel + Railway uptime monitors | <99.5% = SLA credit due |
| Requirement | Implementation | Enforcing Agent |
| --- | --- | --- |
| Portal tokens | UUID v4, 128-bit entropy, stored hashed, constant-time comparison | AGENT-SEC |
| File upload URL expiry | R2 presigned URLs expire after 15 minutes | AGENT-BE |
| Change order PDFs | Generated server-side, R2 private ACL, short-lived presigned URL only | AGENT-BE |
| Workspace isolation | Application-layer workspaceId filter + PostgreSQL RLS — both must pass independently | AGENT-DB |
| Rate limiting portal | 10 submissions/hour/IP at Cloudflare edge + Redis counter | AGENT-SEC |
| Email webhook validation | Resend-Signature header validated before any inbound message processing | AGENT-BE |
| Secret exposure | CI scan on every PR — immediate block on any non-NEXT_PUBLIC_ var in apps/web/src | AGENT-SEC |
| Stripe webhook | Stripe-Signature header validated before any billing event processing | AGENT-BE |
| Take-rate Stripe charge | Payment intent created server-side only — never from client bundle | AGENT-SEC + AGENT-BE |
| Feature | Why Excluded | Target Version |
| --- | --- | --- |
| Email forwarding as primary channel | Fragile. Creates false confidence in detection coverage. Replaced by client inbox. | Deprecated |
| Brief Builder at launch | Competes in established market without novel advantage. Launch only when demand proven. | Gate 3 — Q4 2026 |
| Monthly subscription model | Retention-alignment failure. Replaced by take-rate model. | Deprecated |
| Mobile native app | PWA covers MVP use cases | v1.5 — Q1 2027 |
| Project management (tasks, kanban) | Integrate with PM tools — don't compete | Not standalone |
| Multi-language support | i18n architecture from day one; content in English first | v2.0 |