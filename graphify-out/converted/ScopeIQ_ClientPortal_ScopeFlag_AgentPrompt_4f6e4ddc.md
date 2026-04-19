<!-- converted from ScopeIQ_ClientPortal_ScopeFlag_AgentPrompt.docx -->


ScopeIQ
Client Portal & Scope Flag
Comprehensive Agent Implementation Prompt
Screen-by-Screen Build Spec  ·  Scope Flag Flow  ·  Big Tech Best Practices  ·  Agent Prompt
Novabots Engineering  ·  v1.0  ·  2026  ·  Confidential


# 1. Purpose & Scope of This Document
This document is a fully structured agent implementation prompt for the ScopeIQ Client Portal and Scope Flag subsystems. It is designed to be provided verbatim as the system-level context to any AI coding agent (Claude, Cursor, Copilot) initiating development of these two features. The document synthesizes requirements from the PRD, Feature Breakdown, System Design, and Wireframes into a single authoritative build specification.


## 1.1 Feature Summary

## 1.2 User Personas Served


# 2. Real-World Implementation Comparisons
ScopeIQ's Client Portal and Scope Flag features draw directly from patterns established by best-in-class products. The following benchmarks define the quality bar every implementation decision must meet or exceed.

## 2.1 Client Portal — Benchmark Analysis

## 2.2 Scope Flag — Benchmark Analysis

## 2.3 Architectural Patterns from Big Tech
### Event-Driven Pipeline (adopted from Stripe, Shopify)
All AI operations are fire-and-forget BullMQ jobs — the API never awaits AI results synchronously. This pattern prevents API timeouts on slow AI responses and allows horizontal scaling of AI workers independently.

### Defense in Depth Authorization (adopted from AWS, Google Cloud)
Two independent authorization layers: application-layer workspaceId filter on every query AND PostgreSQL row-level security policy. Neither layer trusts the other. Both must pass.

### Presigned Upload URLs (adopted from S3, Cloudflare R2)
Files never pass through the API server. Client requests a presigned URL → uploads directly to R2 → confirms with the object key. Eliminates API memory bottleneck for 500MB deliverable uploads.

### Optimistic UI with Real-Time Sync (adopted from Figma, Linear)
Supabase real-time subscriptions push scope flags and approval events to the dashboard without polling. Client sees updates within milliseconds of database write without page refresh.


# 3. Client Portal Implementation
The Client Portal is a white-label, single-project-scoped review environment served at {workspace}.scopeiq.com or a custom domain. Clients access it via a unique portal token in the URL — no account creation required.

## Screen CP-01 — Portal Entry & Authentication


## Screen CP-02 — Brief Submission Flow


## Screen CP-03 — Deliverable Review Screen


## Screen CP-04 — Change Order Review Screen


# 4. Scope Flag System — Complete Flow
The Scope Flag system monitors all client communications in real-time against the active Statement of Work. Every message is analyzed by Claude API within 5 seconds. Flagged messages surface to the agency dashboard with full SOW context and three mutually exclusive response actions.

## 4.1 Message Ingestion Sources

## 4.2 Scope Flag Detection Pipeline — Step by Step
- Message arrives via any ingestion source → stored in messages table with status: pending_check.
- Core API dispatches BullMQ job: { job_type: 'check_scope', message_id, project_id }.
- AI Worker (FastAPI) picks up job from Redis queue; fetches message + all active sow_clauses for the project.
- Worker constructs scope analysis prompt with structured Claude tool_use output schema:
    { is_in_scope: bool, confidence: float, matching_clauses: [{ clause_id, clause_text, relevance }], severity: 'low'|'medium'|'high', suggested_response: string }
- Claude API returns structured JSON. Worker validates against Pydantic schema.
- If is_in_scope = false AND confidence > 0.60: create scope_flags record (status: pending); write to audit_log.
- Supabase real-time subscription pushes { type: 'NEW_SCOPE_FLAG', flag_id } to agency dashboard.
- Dashboard nav badge increments (red). ScopeFlagCard appears in priority feed.
- If agency has not viewed the flag in-app within 2 hours: Resend email dispatched with flag summary and direct action links.

## 4.3 Agency Dashboard — Scope Flag States

## 4.4 Scope Flag Card — Component Specification


## 4.5 Change Order Generation Pipeline
- scope_flags.status updated to confirmed → BullMQ job dispatched: { job_type: 'generate_change_order', flag_id }.
- AI Worker fetches: scope_flags record + original message + matching sow_clauses + workspace rate_card_items.
- Claude API generates change order prose. Output schema:
    { title: str, work_description: str, estimated_hours: float, pricing: { amount, currency, basis }, revised_timeline: str }
- change_orders record created with status: draft; linked to scope_flag_id.
- Agency receives in-app notification; Change Order Editor opens inline (not modal) in Scope Flag detail view.
- Agency edits title, description, hours, pricing (overridable from rate card auto-calculation), timeline.
- Agency clicks 'Send to Client' → change_orders.status = sent; client email dispatched via Resend CHANGE-ORDER-01 template with Accept/Decline action links.
- Client accepts → PATCH /api/change-orders/:id/accept → sow_clauses updated with new scope items; revision_limit adjusted if applicable; scope_flags.status = resolved.


# 5. Complete Data Model for Client Portal & Scope Flag
## 5.1 Key Tables

## 5.2 Critical Query Patterns


# 6. Complete API Endpoint Specification
## 6.1 Client Portal Endpoints

## 6.2 Scope Flag Endpoints (Agency JWT Required)


# 7. Component Architecture
## 7.1 Portal Component Tree

## 7.2 Scope Guard Component Tree


# 8. Approval Reminder Sequence
The reminder system is implemented as a BullMQ delayed job pipeline. Each step is a separate job scheduled when the previous step completes without a client response. All steps are configurable per workspace and overridable per project.




# 9. Performance, Security & Scalability
## 9.1 Performance Targets

## 9.2 Security Requirements
- Portal tokens: UUID v4; minimum 128-bit entropy; stored hashed in DB; compared with constant-time comparison to prevent timing attacks.
- File uploads: R2 presigned URLs expire after 15 minutes; object keys include workspace_id prefix to prevent key enumeration.
- Change order PDFs: generated server-side, stored in R2 with private ACL; client accesses via short-lived presigned URL only.
- All scope_flags and change_orders queries include explicit workspace_id join — no direct flag_id access across workspaces.
- Rate limiting on public portal endpoints: 10 brief submissions per hour per IP (enforced at Cloudflare edge + Redis counter).
- Resend inbound email webhook: validate Resend-Signature header before processing; reject all unsigned requests.

## 9.3 Scalability Architecture


# 10. Test Coverage Requirements
All P0 features must have Vitest unit tests and at least one Playwright E2E test. No P0 feature PR can merge without passing tests in CI. The following test cases are mandatory minimum coverage.

## 10.1 Client Portal — Required Tests

## 10.2 Scope Flag — Required Tests


# 11. Structured Agent Prompt — Copy Verbatim as System Context




# 12. Design Tokens & Component Specifications
## 12.1 Color Tokens

## 12.2 Scope Flag Severity Mapping (Agent Use This Exactly)

## 12.3 Revision Counter Color States

Novabots Engineering  ·  ScopeIQ Client Portal & Scope Flag Implementation Plan  ·  Confidential  ·  2026
| SECTION 1 — INTRODUCTION & CONTEXT |
| --- |
| AGENT INSTRUCTION — HOW TO USE THIS DOCUMENT
Read this document in full before writing a single line of code. Every section contains binding constraints. Sections marked [AGENT: EXECUTE] contain ordered implementation steps you must follow sequentially. Deviating from the specified tech stack, naming conventions, or data patterns requires explicit architect sign-off. |
| --- |
| Feature | Module | Priority | Target Sprint |
| --- | --- | --- | --- |
| White-Label Portal Configuration | Approval Portal | P0 — Must Have | Sprint 1 |
| Multi-Format Deliverable Delivery | Approval Portal | P0 — Must Have | Sprint 1 |
| Point-Anchored Annotation | Approval Portal | P0 — Must Have | Sprint 2 |
| Revision Round Tracker | Approval Portal | P0 — Must Have | Sprint 2 |
| Automated Approval Reminder Sequence | Approval Portal | P0 — Must Have | Sprint 3 |
| Real-Time Scope Flag Detection | Scope Guard | P0 — Must Have | Sprint 3 |
| One-Click Change Order Generator | Scope Guard | P0 — Must Have | Sprint 4 |
| Persona | Role | Primary Need from These Features |
| --- | --- | --- |
| Maya | Solo Freelancer | Professional portal without building one; automated reminders to stop manual chasing |
| James | Studio Lead (3–5 person) | Branded client portal; change orders that protect team revenue from scope creep |
| Priya | Agency Ops Manager (10–20) | Audit trail on every decision; scope flags that reduce account manager admin overhead |
| SECTION 2 — BIG TECH BENCHMARKS & BEST PRACTICES |
| --- |
| Product | Feature Borrowed | ScopeIQ Implementation Target |
| --- | --- | --- |
| Notion (Client Portal) | Clean, minimal client-facing view with zero UI noise | Client portal: max 3 actions per screen, plain English only, no agency-dashboard complexity exposed |
| Figma (Multiplayer Annotation) | Click-to-pin comments anchored to exact canvas coordinates | Point-anchored feedback: x_pos/y_pos as % of image dims, device-agnostic, numbered pins, threaded replies |
| HoneyBook (Client Hub) | White-label branding with custom domain for every client engagement | CSS variable injection per workspace; CNAME → Cloudflare Tunnel; zero ScopeIQ branding on paid plans |
| DocuSign (E-Signature UX) | Single primary action per screen; progress shown clearly; legally binding acceptance trail | Approve/Request Changes as only 2 client actions; typed name + timestamp = legal acceptance on change orders |
| Loom (Async Review) | Video-first deliverable review with timestamped comments | Loom oEmbed with thumbnail preview; inline HTML5 player for video deliverables |
| Linear (Notification System) | Smart notification batching; no alert fatigue; action-first email design | Reminder sequences via BullMQ delayed jobs; silence-as-approval after configurable sequence; Resend templates |
| Product | Pattern Adopted | ScopeIQ Implementation Target |
| --- | --- | --- |
| Intercom (Conversation AI) | Real-time message classification with confidence scoring surfaced to support agents | Claude API analysis within 5s p95; confidence % with color coding; flag includes SOW clause reference |
| Salesforce (Opportunity Alerts) | Contextual risk flags inside the deal workflow with suggested next action | Scope flag card: left-border severity indicator, clause reference, 3 mutually exclusive action buttons |
| GitHub (PR Review Bots) | Automated inline comments on code that violate policy, with direct links to the rule | Scope flag references the specific SOW clause violated with section number and verbatim text |
| Stripe Radar (Fraud Rules) | Confidence score on each flagged transaction; dismiss / escalate / automate flow | Dismiss trains AI; Confirm generates change order; Snooze defers 24h — identical 3-action pattern |
| Jira (Change Management) | Full audit trail on every status transition with actor + timestamp + reason | audit_log write on every scope_flags status change; override reason mandatory; actor identity always captured |
| Slack (Urgency System) | Red badge = urgent action required; amber = pending; green = good | Nav badge: red = confirmed scope flags pending action; amber = deliverables awaiting approval |
| SECTION 3 — CLIENT PORTAL: SCREEN-BY-SCREEN BUILD SPEC |
| --- |
| Property | Specification |
| --- | --- |
| Route | /portal/[token] — dynamic route per project |
| Auth | Token-based — portal_token in clients table; no Supabase Auth session required |
| Branding | Logo from R2 (PNG/SVG/JPG ≤2MB); CSS vars: --primary, --secondary, --font injected server-side per workspace |
| ScopeIQ Branding | Hidden via plan-gated CSS class on Studio+ plans; verified by automated screenshot test in CI |
| Optional Email Auth | If workspace setting requires_email_auth=true: ask client to verify email before viewing portal |
| Error States | Expired token → 'This link has expired. Please contact [agency name].' Revoked token → same message. |
| AGENT: EXECUTE — CP-01 Implementation Steps
1. Generate packages/db/schema/clients.schema.ts with portal_token (uuid), token_expires_at, requires_email_auth fields.
2. Generate apps/api/src/repositories/portal.repository.ts — getProjectByToken(token) with workspace isolation.
3. Generate apps/web/src/app/portal/[token]/layout.tsx — Server Component that fetches workspace branding and injects CSS variables via <style> tag in <head>.
4. Generate apps/web/src/app/portal/[token]/page.tsx — renders PortalShell with project state.
5. Unit test: token lookup returns null for expired/revoked tokens; CSS vars correctly injected. |
| --- |
| Property | Specification |
| --- | --- |
| Trigger | Project status = awaiting_brief — portal shows Brief tab as active step |
| Layout | Paginated: max 4–5 questions per step; progress bar shows % complete at bottom |
| Field Types | Text, Textarea, Single Choice, Multi Choice, Date, File Upload — all from brief_templates.fields_json |
| Conditional Logic | if/show rules evaluated client-side in React; hidden fields excluded from submission payload |
| File Upload | Presigned R2 URL pattern — client uploads directly; confirms with object key to API |
| Submission | POST /api/briefs/:templateId/submit — triggers BullMQ score_brief job; shows 'We are reviewing your brief' state |
| Hold State | If brief.status = clarification_needed: portal shows 'A few more details needed' screen with numbered clarification questions from AI flags |
| Re-Submission | Client edits and resubmits — full scoring cycle re-runs; version incremented in briefs table |
| Mobile | Responsive at 375px; form auto-saves to localStorage every change as draft |
| AGENT: EXECUTE — CP-02 Implementation Steps
1. Generate apps/web/src/components/portal/BriefForm.tsx — controlled multi-step form using React Hook Form + Zod.
2. Implement conditional logic engine: evaluateShowRules(fieldSchema, currentValues) → boolean.
3. Generate apps/web/src/hooks/usePortalBriefSubmit.ts — React Query mutation that calls POST /api/briefs/:templateId/submit.
4. Generate apps/api/src/routes/briefs.route.ts with POST /submit handler that dispatches score_brief job.
5. Playwright E2E: happy path submission → clarification_needed state → re-submission → scored state. |
| --- |
| Property | Specification |
| --- | --- |
| Revision Counter | Prominent header bar: 'Revision round: X of Y — Z remaining'; color: green (0–50%) / amber (51–80%) / red (80%+) |
| Deliverable Viewer | Image: <img> with object-fit:contain; PDF: React-PDF page viewer; Video: HTML5 <video>; Figma: oEmbed iframe; Loom/YouTube: oEmbed thumbnail + iframe on play |
| Annotation Canvas | SVG overlay on top of deliverable viewer; click places numbered pin at (x%, y%) of image; opens CommentPanel component on right |
| Comment Panel | Threaded replies per pin; 3-char minimum; agency can resolve (hidden from client, preserved in DB) |
| PDF Multi-Page | Page navigator at bottom; annotation stores page_number alongside coordinates |
| Primary Actions | Two buttons only: 'Approve This Version' (primary teal) and 'Request Changes' (secondary outlined). No other actions. |
| At Revision Limit | Client sees modal: 'You have used all included revision rounds. Additional rounds are billable.' Modal shows pre-generated add-on quote. Cannot dismiss without explicit acknowledgment. |
| Optional General Note | Textarea for overall feedback — not pinned; stored as feedback_items with x_pos=null, y_pos=null |
| AGENT: EXECUTE — CP-03 Implementation Steps
1. Generate apps/web/src/components/portal/DeliverableViewer.tsx — switch on deliverable.type (file|figma|loom|youtube) to render correct viewer.
2. Generate apps/web/src/components/portal/AnnotationCanvas.tsx — SVG overlay with click handler; stores pins in local state until submitted.
3. Generate apps/web/src/components/portal/CommentPanel.tsx — threaded comment display; POST /api/feedback-items on submit.
4. Generate apps/api/src/routes/feedback.route.ts — POST creates feedback_items record + writes to audit_log in same transaction.
5. Implement at-limit modal: fetch revision_limit from sow_clauses; compare to current_round on deliverable; block submission if exceeded. |
| --- |
| Property | Specification |
| --- | --- |
| Trigger | Agency sends change order from Scope Flag flow; client receives email with portal link + in-portal notification |
| Display | Work description, estimated hours, pricing, revised timeline — all read-only for client |
| Signature | Text input: 'Type your full name to accept' — name + timestamp stored as change_orders.signed_at, signed_by_name |
| Primary Actions | Accept (primary green) and Decline (secondary red) — no other actions |
| On Accept | PATCH /api/change-orders/:id/accept — updates status, triggers SOW scope update, notifies agency in real-time |
| On Decline | PATCH /api/change-orders/:id/decline — agency notified; change_orders.status = declined; scope_flags.status reverts to pending |
| PDF Download | Client can download PDF copy of accepted change order at any time |
| SECTION 4 — SCOPE FLAG: END-TO-END FLOW SPECIFICATION |
| --- |
| Source | Mechanism | Implementation |
| --- | --- | --- |
| Portal Submit | Client sends message via portal Messages tab | POST /api/messages — synchronous storage, async BullMQ job dispatch |
| Email Forwarding | Agency forwards client email to project-specific inbox | Resend MX route → webhook → POST /api/messages/inbound |
| Manual Paste | Agency pastes message into Scope Guard input box | POST /api/messages/manual — same pipeline as portal submit |
| State | DB Value | Visual Treatment | Available Actions |
| --- | --- | --- | --- |
| Pending | status: pending | Red left-border card in priority feed; red nav badge | Confirm Out-of-Scope / Mark In-Scope / Snooze |
| Confirmed | status: confirmed | Amber — change order being generated | View Change Order (auto-opened) |
| Change Order Sent | status: co_sent | Blue — awaiting client response | View / Resend / Void Change Order |
| Resolved (CO Accepted) | status: resolved | Green — scope updated | View History / Download PDF |
| Dismissed (In-Scope) | status: dismissed | Gray — trains AI model | View Reason (audit only) |
| Snoozed | status: snoozed | Amber pulse — deferred 24h | Un-snooze / Confirm / Dismiss |
| Element | Specification |
| --- | --- |
| Container | Left border: 4px solid #DC2626 (high) / #D97706 (medium) / #2563EB (low); bg: severity-appropriate light color |
| Header Row | Red 🔴 icon + 'SCOPE FLAG — {SEVERITY}' label; project + client name; received timestamp |
| Client Message | Full message text in bordered blockquote; truncated to 3 lines with 'Show more' if >3 lines |
| SOW Clause | Section reference + verbatim exclusion text; background: #F8FAFC; monospace font |
| Confidence Bar | Progress bar 0–100%; color: green <60%, amber 60–79%, red 80%+; percentage shown |
| AI Suggested Response | Editable textarea pre-filled with Claude suggestion; 'Edit' and 'Copy' buttons |
| Action Row | 3 buttons: 'Confirm & Generate Change Order' (primary red), 'Mark In-Scope' (secondary green), 'Snooze 24h' (tertiary gray) |
| AGENT: EXECUTE — Scope Flag Card Implementation Steps
1. Generate apps/web/src/components/scope-guard/ScopeFlagCard.tsx — props: ScopeFlag & SowClause & onConfirm & onDismiss & onSnooze.
2. Implement severity-to-color mapping: high=#DC2626, medium=#D97706, low=#2563EB.
3. Generate apps/web/src/hooks/useScopeFlags.ts — React Query with Supabase real-time subscription for live badge updates.
4. Generate apps/api/src/routes/scope-flags.route.ts — PATCH /:id/confirm | /dismiss | /snooze handlers.
5. All PATCH handlers must write to audit_log in same DB transaction as status update.
6. Confirm action dispatches generate_change_order BullMQ job immediately. |
| --- |
| SECTION 5 — DATA MODEL & DATABASE SCHEMA |
| --- |
| Table | Key Columns | Purpose |
| --- | --- | --- |
| clients | id, workspace_id, name, email, portal_token (uuid), token_expires_at, requires_email_auth | One record per client; portal_token is the authentication credential for the portal URL |
| deliverables | id, project_id, title, type (file|figma|loom|youtube), file_url, status, revision_round | A deliverable is a single piece of work sent for review |
| feedback_items | id, deliverable_id, author_type (client|agency), content, x_pos (%), y_pos (%), page_number, resolved, created_at | Annotation pins on deliverables; x/y as % of image dimensions |
| approval_events | id, deliverable_id, event_type (approved|changes_requested|reminder_sent|silence_approved), actor_id, timestamp | Full audit trail of all approval interactions |
| reminder_logs | id, project_id, deliverable_id, sequence_step (1|2|3), sent_at, delivery_status, opened_at | Tracks each reminder in the escalation sequence |
| scope_flags | id, project_id, sow_clause_id, message_text, confidence, severity (low|medium|high), status, suggested_response, created_at | Core scope flag record; links message to violated SOW clause |
| change_orders | id, scope_flag_id, title, work_description, estimated_hours, price, currency, revised_timeline, status, signed_at, signed_by_name, pdf_url | Change order from flag confirmation to client acceptance |
| RULE: Every query must include workspaceId — RLS alone is not sufficient
// CORRECT: application-layer + database-layer both enforce workspace isolation
const flags = await db.select().from(scope_flags)
  .where(and(
    eq(scope_flags.project_id, projectId),
    eq(projects.workspace_id, workspaceId)  // Always join to projects to verify workspace
  ));

// WRONG: Missing workspaceId — relies on RLS alone
const flags = await db.select().from(scope_flags)
  .where(eq(scope_flags.project_id, projectId)); |
| --- |
| SECTION 6 — API ENDPOINT REFERENCE |
| --- |
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /api/portal/:token | Token (no JWT) | Fetch project + branding for portal; validates token, returns workspace CSS vars + project state |
| POST | /api/portal/:token/brief/submit | Token | Submit brief; dispatches score_brief BullMQ job; returns brief_id |
| GET | /api/portal/:token/deliverables | Token | List deliverables for review; includes revision_round and status |
| POST | /api/portal/:token/feedback | Token | Submit annotated feedback pins + general note; increments revision_round |
| POST | /api/portal/:token/approve | Token | Approve deliverable; creates approval_events record; notifies agency |
| GET | /api/portal/:token/change-orders/:id | Token | Fetch change order details for client review |
| POST | /api/portal/:token/change-orders/:id/accept | Token | Accept change order; signed_at = NOW(); triggers SOW update |
| POST | /api/portal/:token/change-orders/:id/decline | Token | Decline change order; agency notified; status reverted |
| Method | Path | Description |
| --- | --- | --- |
| GET | /api/scope-flags?projectId=&status= | List flags with optional filters; includes SOW clause reference |
| POST | /api/messages | Ingest new message for scope checking; dispatches check_scope job |
| POST | /api/messages/inbound | Resend MX webhook receiver for email forwarding |
| PATCH | /api/scope-flags/:id/confirm | Confirm flag as out-of-scope; dispatches generate_change_order job; writes audit_log |
| PATCH | /api/scope-flags/:id/dismiss | Dismiss as in-scope with reason; trains AI; writes audit_log |
| PATCH | /api/scope-flags/:id/snooze | Snooze 24h; schedules BullMQ delayed re-surface job |
| GET | /api/change-orders?projectId= | List change orders per project with status |
| PATCH | /api/change-orders/:id | Update draft change order before sending (title, price, timeline) |
| POST | /api/change-orders/:id/send | Send change order to client; dispatches Resend email |
| SECTION 7 — FRONTEND COMPONENT TREE |
| --- |
| Component File | Responsibility |
| --- | --- |
| app/portal/[token]/layout.tsx | Server Component; injects workspace CSS variables; renders PortalShell |
| components/portal/PortalShell.tsx | Top-level portal layout: logo, project name, tab navigation (Brief / Review Work / Messages) |
| components/portal/BriefForm.tsx | Multi-step intake form with conditional logic; React Hook Form + Zod; progress bar |
| components/portal/BriefHoldState.tsx | Shown when brief.status = clarification_needed; displays numbered clarification questions |
| components/portal/DeliverableViewer.tsx | Switch on deliverable.type; renders correct viewer (image/PDF/video/Figma/Loom) |
| components/portal/AnnotationCanvas.tsx | SVG overlay on deliverable; click-to-pin; stores pins in local state until submitted |
| components/portal/CommentPanel.tsx | Right sidebar; threaded comments per pin; general note textarea; Approve/Request Changes buttons |
| components/portal/RevisionCounter.tsx | Progress bar with color states; at-limit modal with acknowledgment gate |
| components/portal/ChangeOrderReview.tsx | Read-only change order display; typed-name acceptance input; Accept/Decline buttons |
| Component File | Responsibility |
| --- | --- |
| components/scope-guard/ScopeFlagFeed.tsx | Real-time list of active scope flags; subscribes to Supabase channel; sorts by severity + recency |
| components/scope-guard/ScopeFlagCard.tsx | Individual flag card; severity border color; message, SOW clause, confidence bar, action buttons |
| components/scope-guard/ScopeFlagDetail.tsx | Expanded view with full message, all matching clauses, AI suggested response editor |
| components/scope-guard/ChangeOrderEditor.tsx | Inline editor for draft change order; rate card auto-pricing; all fields editable before send |
| components/scope-guard/ChangeOrderPDF.tsx | React-PDF renderer for change order; consistent with brand colors; footer with project ID |
| components/scope-guard/MessageIngestor.tsx | Manual paste UI; text area + submit; dispatches to POST /api/messages/manual |
| components/scope-guard/ScopeMeterBar.tsx | Visual scope consumption bar; % used = deliverables complete / contracted; color-coded |
| SECTION 8 — AUTOMATED REMINDER SYSTEM SPECIFICATION |
| --- |
| Step | Template ID | Trigger | Subject Line (Default) | Silence Action |
| --- | --- | --- | --- | --- |
| Step 1 | REMIND-01 | Configurable hours after deliverable sent (default: 48h) | '[Agency Name] is waiting on your feedback — [Project]' | Schedules Step 2 |
| Step 2 | REMIND-02 | Configurable hours after Step 1 (default: 72h) | 'Deadline approaching — your feedback is needed on [Project]' | Schedules Step 3 |
| Step 3 | REMIND-03 | Configurable hours after Step 2 (default: 48h) | 'Final notice — silence will be treated as approval on [Date]' | Creates approval_events record (silence_approved) |
| AGENT: EXECUTE — Reminder System Implementation
1. Generate apps/api/src/services/reminder.service.ts — scheduleReminderSequence(projectId, deliverableId, schedule) dispatches Step 1 as BullMQ delayed job.
2. Generate apps/ai/app/workers/reminder.worker.py — processes reminder jobs; dispatches Resend email; schedules next step or creates silence approval.
3. Email templates must render correctly in Gmail, Outlook, Apple Mail — use React Email inline-CSS components.
4. Each email includes: direct Approve link (/api/portal/:token/approve?deliverableId=) and Decline link — no portal login required.
5. All reminder sends logged to reminder_logs table with sent_at and delivery_status from Resend webhook. |
| --- |
| SECTION 9 — NON-FUNCTIONAL REQUIREMENTS & PERFORMANCE TARGETS |
| --- |
| Operation | Target | Measurement Method |
| --- | --- | --- |
| Portal page load | <2s on 4G | Vercel Analytics RUM p95 |
| AI brief scoring | <10s p95 | BullMQ job duration metric in Axiom |
| Scope flag detection | <5s p95 | BullMQ job duration metric in Axiom |
| Change order generation | <5s p95 | BullMQ job duration metric in Axiom |
| 500MB file upload | Async with progress bar — no page block | R2 multipart upload; progress via XHR upload event |
| API REST endpoints | <300ms p95 | Sentry performance monitoring on all routes |
| Real-time flag push | <500ms from DB write to dashboard | Supabase real-time latency measurement |
| Bottleneck | Mitigation Strategy |
| --- | --- |
| AI API rate limits | BullMQ concurrency config: max 5 concurrent Claude API calls per AI worker; exponential backoff on 429 errors |
| Large file deliverables | R2 presigned multipart upload; never proxied through API server; CDN-served from NEXT_PUBLIC_R2_PUBLIC_URL |
| Real-time subscriptions | Supabase real-time channels scoped to workspace_id — prevents fanout to unrelated clients |
| Reminder job volume | BullMQ delayed jobs with 24h TTL; Upstash Redis serverless scales to millions of jobs automatically |
| Portal load spikes | Vercel Edge Network CDN for static assets; portal routes SSR at edge for sub-100ms TTFB globally |
| SECTION 10 — TESTING REQUIREMENTS |
| --- |
| Test ID | Type | Scenario |
| --- | --- | --- |
| T-CP-001 | E2E | Client opens portal via token → sees agency branding (no ScopeIQ logo) → submits brief → sees scoring pending state |
| T-CP-002 | E2E | Brief scores below threshold → portal shows clarification screen → client resubmits → scores above threshold → portal advances to review step |
| T-CP-003 | E2E | Client opens deliverable review → places 3 annotation pins → submits feedback → agency receives real-time notification |
| T-CP-004 | E2E | Client reaches revision limit → sees at-limit modal → cannot submit without acknowledgment → change order generated |
| T-CP-005 | E2E | Client receives change order email → clicks Accept link → signed_at populated → agency notified → SOW updated |
| T-CP-006 | Unit | portal_token lookup: valid token returns project; expired token returns null; wrong workspace token returns null |
| T-CP-007 | Unit | Annotation coordinate normalization: pin at (x, y) renders at correct position at 375px, 768px, and 1440px widths |
| Test ID | Type | Scenario |
| --- | --- | --- |
| T-SF-001 | E2E | Out-of-scope message submitted via portal → flag appears on dashboard within 5s → agency sees red nav badge |
| T-SF-002 | E2E | Agency confirms flag → change order draft auto-generated → agency edits pricing → sends to client → client accepts → SOW updated |
| T-SF-003 | E2E | Agency dismisses flag as in-scope → status = dismissed → reason logged in audit_log → nav badge decrements |
| T-SF-004 | Unit | Confidence threshold: flag created only when confidence > 0.60; message with confidence 0.58 does not create flag |
| T-SF-005 | Unit | audit_log write: every scope_flags status transition creates audit record with actor_id, entity_id, old_status, new_status |
| T-SF-006 | Unit | False positive rate: run 20-message test corpus against active SOW; assert <15% false positive rate |
| T-SF-007 | E2E | Reminder sequence: deliverable sent → Step 1 sent at 48h → Step 2 at 72h after → Step 3 at 48h after → silence approval created |
| SECTION 11 — MASTER AGENT IMPLEMENTATION PROMPT |
| --- |
| PURPOSE OF THIS SECTION
The following prompt block is designed to be pasted verbatim as the system prompt or project context file for any AI coding agent beginning work on the Client Portal or Scope Flag features. It is the distillation of this entire document into a binding directive format. |
| --- |
| SYSTEM CONTEXT — SCOPEIQ CLIENT PORTAL & SCOPE FLAG AGENT PROMPT
You are a senior full-stack engineer at Novabots working on ScopeIQ, a B2B SaaS platform for creative agency scope enforcement. Your task is to implement the Client Portal and Scope Flag subsystems as defined below. All decisions must follow the architecture, naming conventions, and rules in this prompt exactly.

TECH STACK (NON-NEGOTIABLE)
Frontend: Next.js 14 App Router + TypeScript strict + Tailwind CSS + Radix UI + React Hook Form + Zod + React Query v5 + DnD Kit + React-PDF + Zustand
Backend API: Node.js 20 + Hono v4 + Drizzle ORM v0.30 + BullMQ + Resend + Zod validation
AI Service: Python 3.12 + FastAPI 0.110 + Anthropic SDK (claude-sonnet-4-6) + Pydantic v2 + PyMuPDF + structlog
Storage: Cloudflare R2 via presigned URLs only | Database: Supabase PostgreSQL 15 with RLS | Queue: Upstash Redis + BullMQ
ABSOLUTE RULES
1. TypeScript strict:true + noUncheckedIndexedAccess:true on all TS files. No @ts-ignore, no any cast.
2. No raw SQL. All DB access via Drizzle ORM. Every query includes explicit workspaceId filter (RLS alone is insufficient).
3. All AI calls dispatched as BullMQ jobs to Redis. No direct Anthropic SDK import in web or api apps.
4. Files uploaded only via R2 presigned URLs. File content never in API request bodies.
5. No secrets in client bundle. Only NEXT_PUBLIC_ vars in apps/web/src.
6. Every create/update/delete must write to audit_log in same DB transaction via writeAuditLog() helper.
IMPLEMENTATION ORDER
For each feature, generate files in this exact order: (1) Drizzle schema → (2) Migration → (3) Repository → (4) Service → (5) Zod schemas → (6) Hono route → (7) Vitest unit tests → (8) React Query hook → (9) React component → (10) Playwright E2E test.
Generate complete files only. No TODOs, no placeholders, no 'you would add X here' comments. Every file must be immediately runnable.
CLIENT PORTAL — KEY CONSTRAINTS
• Portal auth uses portal_token (uuid) from URL — no Supabase Auth JWT for clients.
• Workspace branding (logo, --primary, --secondary, --font) injected as CSS variables server-side in layout.tsx.
• Annotation pins stored as x_pos/y_pos as % of image dimensions (device-agnostic). Never store pixel values.
• Revision counter must update in real-time (Supabase subscription). At-limit modal requires explicit acknowledgment — cannot be dismissed.
• Client portal: max 3 actions per screen. Plain English only. No agency-dashboard complexity exposed to client.
SCOPE FLAG — KEY CONSTRAINTS
• Flag only when is_in_scope=false AND confidence > 0.60. Do not flag if confidence ≤ 0.60.
• Three mutually exclusive actions: Confirm (→ change order) | Dismiss (→ trains AI) | Snooze (→ 24h delay). No other actions.
• Change order generation is async (BullMQ job). Show loading state with estimated 5s completion. Do not block UI.
• Accepted change orders must update sow_clauses immediately (same DB transaction as status update). Do not defer.
• Performance SLAs are product features, not aspirational: score flag within 5s p95; change order generated within 5s p95. Write Axiom metrics for both. |
| --- |
| SECTION 12 — DESIGN SYSTEM REFERENCE |
| --- |
| Token | Hex | Usage |
| --- | --- | --- |
| primary-teal | #0F6E56 | Buttons, links, active nav states, accent borders |
| primary-teal-mid | #1D9E75 | Hover states, badges, tag backgrounds |
| primary-teal-light | #E1F5EE | Section backgrounds, info banners |
| status-red | #DC2626 | Scope flags, errors, critical alerts, out-of-scope |
| status-amber | #D97706 | Warnings, approaching revision limits, pending items |
| status-green | #059669 | Approvals, completions, success confirmations |
| status-blue | #2563EB | Informational notices, in-progress indicators |
| text-primary | #0D1B2A | Headings, labels, high-emphasis content |
| text-secondary | #4B5563 | Body text, descriptions, secondary labels |
| text-muted | #9CA3AF | Placeholders, timestamps, metadata |
| Severity | Border Color | Background | Badge Text Color | Nav Badge |
| --- | --- | --- | --- | --- |
| HIGH | #DC2626 (4px left) | #FEF2F2 | #DC2626 | Red 🔴 |
| MEDIUM | #D97706 (4px left) | #FFFBEB | #D97706 | Amber 🟡 |
| LOW | #2563EB (4px left) | #EFF6FF | #2563EB | Blue 🔵 |
| Usage % | Bar Color | Text | Action |
| --- | --- | --- | --- |
| 0–50% | #059669 (green) | X of Y rounds used | None — all good |
| 51–80% | #D97706 (amber) | Getting close — X remaining | Subtle prompt to consolidate feedback |
| 80–99% | #DC2626 (red) | Final round remaining! | Strong visual warning |
| 100% | #DC2626 (red, pulsing) | Revision limit reached | At-limit modal blocks submission |