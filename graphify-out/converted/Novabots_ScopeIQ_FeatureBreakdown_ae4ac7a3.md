<!-- converted from Novabots_ScopeIQ_FeatureBreakdown.docx -->



# 1. Overview & Priority Framework
This document provides granular specifications for every feature in ScopeIQ v1.0. Each entry includes a unique feature ID, priority, user story, technical implementation notes, acceptance criteria, dependencies, and story point estimates. This is the authoritative sprint-planning and test-case reference.



# 2. Brief Builder Features











# 3. Approval Portal Features











# 4. Scope Guard Features








Novabots — ScopeIQ — Confidential — 2026
| ScopeIQ
Feature Breakdown Document
Novabots Engineering  |  Complete Feature Inventory · Specs · Acceptance Criteria  |  v1.0  |  2026 |
| --- |
| Priority | Definition | Release Target |
| --- | --- | --- |
| P0 — Must Have | Core MVP feature. Product cannot launch without it. | v1.0 — Q3 2026 |
| P1 — Should Have | High-value. Significantly improves product. Deferrable but committed. | v1.1 — Q4 2026 |
| P2 — Nice to Have | Valuable enhancement. Deferred if sprint capacity is constrained. | v1.5 — Q1 2027 |
| Module | P0 | P1 | P2 | Total |
| --- | --- | --- | --- | --- |
| Brief Builder | 4 | 3 | 2 | 9 |
| Approval Portal | 6 | 3 | 2 | 11 |
| Scope Guard | 7 | 2 | 2 | 11 |
| Platform / Auth / Billing | 4 | 3 | 2 | 9 |
| Total | 21 | 11 | 8 | 40 |
| FEAT-BB-001 | P0 | Custom Form Builder |
| --- |
| Feature ID | FEAT-BB-001 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As an agency owner, I want to build a custom intake form with drag-and-drop field ordering so every client starts with structured information tailored to my service type. |
| Technical Implementation | React DnD Kit (drag-and-drop); form schema stored as JSON in brief_templates table; real-time preview via controlled component rendering; conditional logic implemented as if/show rules on field schema; form published at portal.scopeiq.com/{workspace}/{template_id} |
| Acceptance Criteria | Min. 6 field types: text, textarea, single-choice, multi-choice, date, file upload; drag reorder works on desktop and mobile; conditional logic rules can chain; form autosaves on every change (debounced 500ms); mobile-responsive at 375px; live client-view preview available before publishing; iframe embed code generated automatically |
| Dependencies | None — standalone module entry point |
| Story Points | 8–10 SP |
| FEAT-BB-002 | P0 | AI Brief Clarity Scorer |
| --- |
| Feature ID | FEAT-BB-002 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a freelancer receiving a submitted brief, I want an AI clarity score (0–100) within 10 seconds so I can identify ambiguous sections before investing project time. |
| Technical Implementation | Brief scoring job dispatched to BullMQ Redis queue on submission; FastAPI AI service calls Claude API with tool_use mode for structured JSON output: { score: int, flags: [{field_key, reason, severity}] }; stored in brief_fields table; Supabase real-time subscription pushes update to dashboard; Resend email dispatched if score < threshold |
| Acceptance Criteria | Score visible within 10 seconds p95; minimum 3 actionable flags for briefs scoring below 70; each flag references the specific field that triggered it; suggested clarification question generated per flag; score persists and is visible in project brief tab permanently; flag history preserved for audit |
| Dependencies | FEAT-BB-001; Claude API integration; BullMQ + Redis |
| Story Points | 13 SP |
| FEAT-BB-003 | P0 | Auto-Hold Flow for Low-Score Briefs |
| --- |
| Feature ID | FEAT-BB-003 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a freelancer, I want briefs scoring below my threshold automatically held and the client sent specific clarification questions, so I never receive a brief I cannot act on. |
| Technical Implementation | Threshold stored in workspace settings (default 70, range 50–90); on score < threshold: brief.status = clarification_needed; Resend email BRIEF-CLARIFY-01 dispatched with numbered question list; client portal shows 'Your brief needs a few more details' screen; agency dashboard shows brief in Held state with manual override button; re-submission triggers full re-scoring cycle |
| Acceptance Criteria | Hold triggered within 2 seconds of score generation; client email dispatched within 60 seconds; clarification email lists each flag as a numbered question; re-submitted brief goes through full scoring cycle; agency override logs actor, reason, and timestamp; override event visible in project audit log |
| Dependencies | FEAT-BB-002; Resend email integration |
| Story Points | 8 SP |
| FEAT-BB-004 | P0 | Embeddable Brief Form |
| --- |
| Feature ID | FEAT-BB-004 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a freelancer, I want to embed my brief intake form on my website or share it as a direct link so clients can submit briefs from my existing online presence. |
| Technical Implementation | Published forms served from portal.scopeiq.com/{workspace}/{template_id}; iframe embed code generated with configurable dimensions; CORS headers allow embedding from any domain; form works without third-party cookies; submissions include source domain for analytics; rate-limited public endpoint — 10 submissions per hour per IP |
| Acceptance Criteria | Iframe snippet and direct link available from form settings; form loads in under 2 seconds when embedded externally; responsive at any iframe width down to 300px; submissions correctly attributed to the workspace and logged; no account required for client to submit |
| Dependencies | FEAT-BB-001; portal routing infrastructure |
| Story Points | 5 SP |
| FEAT-BB-005 | P1 | Brief Version History with Diff |
| --- |
| Feature ID | FEAT-BB-005 |
| --- | --- |
| Priority | P1 — Should Have |
| User Story | As an agency owner, I want a version history of all brief submissions with a diff view showing exactly what changed between versions, giving me an audit trail for scope disputes. |
| Technical Implementation | Each submission creates a new version record in briefs table with auto-incremented version column; diff computed client-side using diffWords on field content strings; added content rendered green, removed content rendered red with strikethrough; versions listed in sidebar with timestamp and submitter email; any version exportable to PDF via React-PDF |
| Acceptance Criteria | All versions in reverse chronological order; diff loads within 1 second; added/removed content clearly highlighted; any version restorable with confirmation dialog; PDF export preserves diff coloring; brief ID and version number shown in PDF footer |
| Dependencies | FEAT-BB-001, FEAT-BB-002 |
| Story Points | 8 SP |
| FEAT-AP-001 | P0 | White-Label Portal Configuration |
| --- |
| Feature ID | FEAT-AP-001 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a studio lead, I want to configure the client portal with my agency logo and brand colors and a custom domain so every client interaction reinforces our brand identity. |
| Technical Implementation | Logo stored in Cloudflare R2 as PNG/SVG; CSS variables injected server-side per workspace: --primary, --secondary, --font; default URL: {slug}.scopeiq.com via Cloudflare subdomain routing; custom domain: agency adds CNAME → Cloudflare Tunnels handles SSL automatically; DNS verification polling via Cloudflare API (checks every 60s for up to 24h); 'Powered by ScopeIQ' watermark removed via plan-gated CSS class on Studio+ |
| Acceptance Criteria | Logo uploads (PNG, SVG, JPG) up to 2MB; hex color picker with live portal preview; default subdomain active within 5 minutes of workspace creation; custom domain active within 5 minutes of DNS propagation; zero ScopeIQ branding visible on paid plans — validated by automated screenshot test |
| Dependencies | Cloudflare API access; Supabase storage for logo files |
| Story Points | 10 SP |
| FEAT-AP-002 | P0 | Multi-Format Deliverable Delivery |
| --- |
| Feature ID | FEAT-AP-002 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a freelancer, I want to upload files, embed Figma links, and add Loom/YouTube videos as deliverables so I can deliver any type of creative work through one consistent interface. |
| Technical Implementation | Files uploaded via presigned R2 URLs (never proxied through app server); async upload with progress via R2 multipart upload API; deliverable type enum: file | figma | loom | youtube; Figma embed via oEmbed API; Loom/YouTube via oEmbed metadata fetch + iframe; images and PDFs rendered inline via browser-native viewer; video files played via HTML5 player |
| Acceptance Criteria | 500MB file uploads complete within 3 minutes on standard broadband; upload progress bar accurate within 5%; Figma embeds render in under 3 seconds; Loom/YouTube show thumbnail with play button before load; failed uploads show clear error with one-click retry; all upload events logged to audit_log |
| Dependencies | Cloudflare R2; Figma oEmbed endpoint |
| Story Points | 13 SP |
| FEAT-AP-003 | P0 | Point-Anchored Annotation |
| --- |
| Feature ID | FEAT-AP-003 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a client reviewing a design, I want to click anywhere on an image or PDF and leave a comment anchored to that exact location so my feedback is unambiguous. |
| Technical Implementation | Canvas overlay renders click-to-place pins; coordinates stored as x_pos/y_pos as % of image dimensions (device-agnostic); pins rendered as numbered circles; clicking opens comment panel; threaded replies per pin; agency can resolve individual pins (hides from client, preserved in audit); PDF annotation stores page_number alongside coordinates |
| Acceptance Criteria | Pins placeable anywhere; coordinates display correctly at all zoom levels and screen sizes; 3-character minimum on comment text; agency can resolve pins; resolved pins hidden from client but accessible in feedback history; works across all PDF pages |
| Dependencies | FEAT-AP-002; deliverable must be type image or PDF |
| Story Points | 13 SP |
| FEAT-AP-004 | P0 | Revision Round Tracker |
| --- |
| Feature ID | FEAT-AP-004 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a studio lead, I want a visible revision round counter shown to both agency and client so clients understand when additional rounds will incur a charge. |
| Technical Implementation | revision_limit stored in sow_clauses when SOW parsed; current_round incremented each time client submits feedback on a deliverable; displayed in portal header for both views; color states: green (0–50% used) → amber (51–80%) → red (80%+); at limit: client sees modal explaining additional rounds are billable with auto-generated add-on quote pre-populated from rate card |
| Acceptance Criteria | Counter updates in real time (no refresh); client sees identical counter value as agency; at-limit modal cannot be dismissed without explicit client acknowledgment; all revision events logged with timestamp and actor |
| Dependencies | FEAT-AP-002; FEAT-SG-001 for SOW-based revision limit import |
| Story Points | 8 SP |
| FEAT-AP-005 | P0 | Automated Approval Reminder Sequence |
| --- |
| Feature ID | FEAT-AP-005 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a freelancer, I want an automated configurable reminder sequence for unresponsive clients so my timelines are protected without manual chasing. |
| Technical Implementation | Reminder schedules in workspace settings (global default) and per-project (override); cron job hourly checks deliverables past first reminder threshold; Resend templates: REMIND-01 (gentle nudge), REMIND-02 (deadline warning), REMIND-03 (final — silence = approval); BullMQ delayed job schedules each step; silence-as-approval creates approval_events record and notifies agency; client can approve/decline directly from email via action links |
| Acceptance Criteria | Reminder schedule configurable in hours/days; minimum 3 configurable steps; sent within 5 minutes of threshold crossing; renders correctly in Gmail, Outlook, Apple Mail; full log visible in project timeline; silence-as-approval event appears in audit trail |
| Dependencies | Resend integration; BullMQ Redis; FEAT-AP-002 |
| Story Points | 10 SP |
| FEAT-SG-001 | P0 | SOW Ingestion & AI Parsing |
| --- |
| Feature ID | FEAT-SG-001 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As an agency owner, I want to upload my SOW and have AI automatically extract all scope boundaries so the platform knows exactly what is and is not included. |
| Technical Implementation | PDF parsed via PyMuPDF; text sent to FastAPI AI service; Claude API output schema: { deliverables[], revision_limits[], timeline_milestones[], exclusions[], payment_terms[] }; each clause stored in sow_clauses table with clause_type enum; agency reviews in structured editor before activation; activation sets sow.status = active |
| Acceptance Criteria | PDF and plain text accepted; extraction under 30 seconds for 10-page SOW; >85% accuracy on standard creative SOW formats (validated against 20-SOW test corpus); agency editor groups clauses by type; individual clauses editable, deletable, addable; activation confirmation shows clause count by type |
| Dependencies | Claude API; PyMuPDF |
| Story Points | 13 SP |
| FEAT-SG-002 | P0 | Real-Time Scope Flag Detection |
| --- |
| Feature ID | FEAT-SG-002 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a freelancer, I want every client message analyzed against the SOW in real time so I never miss an out-of-scope request before it becomes unbilled work. |
| Technical Implementation | Message ingestion: portal submit (direct), email forwarding (Resend MX route), manual paste; BullMQ job dispatched on ingestion: { job_type: 'scope_check', message_id }; FastAPI fetches active sow_clauses + message; Claude returns: { is_in_scope, confidence, matching_clauses[], severity, suggested_response }; if !is_in_scope && confidence > 0.6: create scope_flags record; Supabase real-time push to dashboard; email sent if not viewed within 2 hours |
| Acceptance Criteria | Flag within 5 seconds p95; confidence shown as % with color coding; false positive rate <15% against test message corpus; test mode available (no effect on real project); dashboard nav badge shows unread flag count |
| Dependencies | FEAT-SG-001 (active SOW required); Claude API; BullMQ; Resend |
| Story Points | 13 SP |
| FEAT-SG-003 | P0 | One-Click Change Order Generator |
| --- |
| Feature ID | FEAT-SG-003 |
| --- | --- |
| Priority | P0 — Must Have |
| User Story | As a studio lead who confirmed an out-of-scope request, I want a professional change order generated with one click, pre-priced from my rate card, so every scope expansion becomes a documented billable conversation. |
| Technical Implementation | Triggered on scope_flags.status = confirmed; Claude generates change order prose from flag context + SOW + rate card; output: { title, work_description, estimated_hours, pricing, revised_timeline }; agency edits in inline editor; rendered as React-PDF; sent via portal + email with Accept/Decline action buttons; accepted: change_orders.status = accepted, sow_clauses updated, revision limits adjusted if applicable |
| Acceptance Criteria | Generated within 5 seconds of confirmation; all fields editable before sending; pricing auto-calculated from rate card but overridable; typed name + timestamp = legal acceptance; client Accept/Decline email links work; accepted COs update SOW scope immediately; complete history per project; PDF export available |
| Dependencies | FEAT-SG-001, FEAT-SG-002; rate card setup; React-PDF; Resend |
| Story Points | 13 SP |