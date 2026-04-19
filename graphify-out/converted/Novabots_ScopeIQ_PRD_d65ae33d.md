<!-- converted from Novabots_ScopeIQ_PRD.docx -->



# 1. Document Control

# 2. Executive Summary
ScopeIQ is a B2B SaaS platform built by Novabots that eliminates the three highest-friction points in the creative agency engagement lifecycle: vague brief intake, unstructured approval workflows, and untracked scope change requests. The platform serves solo creative freelancers and small agencies of 2–20 people who lose an estimated 15–25% of annual revenue to these three recurring problems.

The product is organized around three tightly integrated modules — Brief Builder, Approval Portal, and Scope Guard — which together form a continuous AI-monitored project workflow layer that sits between the agency and its clients. Unlike existing tools that handle billing or generic project management, ScopeIQ is purpose-built for the brief-to-delivery loop and provides the only AI-native scope enforcement layer in this market segment.

## 2.1 Problem Statement
- 79% of creative agencies report over-servicing clients — the #1 profitability killer industry-wide
- Scope creep, vague briefs, and approval delays cost small agencies an estimated 15–25% of annual revenue
- 3–6 revision rounds per project on average when briefs are poorly defined at kickoff
- No purpose-built AI layer exists for the brief-to-approval-to-scope-enforcement workflow

## 2.2 Solution Overview
- Brief Builder: Guided AI-scored client intake forms that prevent vague briefs from reaching the agency. Briefs below a clarity threshold are auto-held and clients prompted to clarify before any work begins.
- Approval Portal: White-label, branded client review environment with revision round tracking, AI-generated feedback summaries, and automated reminder sequences — no more chasing approvals over Slack.
- Scope Guard: Real-time monitoring of all client communications against the original Statement of Work. Out-of-scope requests flagged in under 5 seconds, with one-click change order generation.

## 2.3 Success Metrics

# 3. User Personas







# 4. User Stories & Acceptance Criteria

## 4.1 Brief Builder







## 4.2 Approval Portal







## 4.3 Scope Guard







# 5. Functional Requirements

## 5.1 Brief Builder


## 5.2 Approval Portal


## 5.3 Scope Guard


## 5.4 Platform-Wide


# 6. Non-Functional Requirements

## 6.1 Performance

## 6.2 Security & Compliance
- All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- Row-level security enforced at the PostgreSQL database layer — no cross-workspace data access possible
- SOC 2 Type I compliance targeted by Month 18; Type II by Month 30
- GDPR-compliant: data deletion on request within 30 days; data processing agreements available
- Penetration testing conducted before public launch and annually thereafter
- API key management with configurable permission scopes and per-key rate limiting

## 6.3 Out of Scope — v1.0


Novabots Engineering — ScopeIQ — Confidential — 2026
| ScopeIQ
Product Requirements Document
Novabots Engineering Team  |  Version 2.0  |  Confidential  |  2026 |
| --- |
| Document | ScopeIQ PRD v2.0 |
| --- | --- |
| Company | Novabots |
| Product | ScopeIQ — AI-Powered Client Ops Platform |
| Version | 2.0 |
| Status | Approved — Active Development |
| Owner | Novabots Product & Engineering |
| Last Updated | 2026 |
| Target Release | Q3 2026 (MVP v1.0)  ·  Q1 2027 (v1.5 Mobile PWA) |
| Audience | Engineering, Design, QA, Investors, Stakeholders |
| KPI | Baseline | Target — Month 6 | Target — Month 12 |
| --- | --- | --- | --- |
| Activation rate | Unknown | >60% within 48h of signup | >75% within 48h |
| Time to first value | >2 hours | <30 minutes | <20 minutes |
| Feature engagement | Unknown | >70% use all 3 modules/mo | >80% monthly |
| NPS score | Not measured | >40 | >55 |
| Monthly churn | Unknown | <5% | <4% |
| Scope flags/user/month | N/A | >2 avg flags generated | >4 avg flags generated |
| Persona 1 — Maya: The Independent Creative Freelancer |
| --- |
| Role | Brand Designer — Solo Freelancer |
| --- | --- |
| Team Size | 1 person — all client operations self-managed |
| Active Clients | 5–8 simultaneous project-based engagements |
| Annual Revenue | $80,000 – $150,000 |
| Primary Tools | Figma, Notion, Gmail, Stripe, Google Drive |
| Core Pain | Clients request small changes continuously that erode project margins. Approval delays stall projects for 1–2 weeks. No standardized process means every project starts from scratch. |
| Jobs To Be Done | Protect billable time; look professional to enterprise clients; stop scope expansion before it starts; automate administrative follow-up |
| WTP | Up to $100/month for a tool that demonstrably saves billable hours |
| Persona 2 — James: The Studio Lead |
| --- |
| Role | Creative Director — 3–5 person brand studio |
| --- | --- |
| Team Size | 2–5 people — mix of full-time and freelancers |
| Active Clients | 10–20 simultaneous, mix of retainers and projects |
| Annual Revenue | $300,000 – $600,000 |
| Primary Tools | Asana, Slack, FigJam, HoneyBook, Xero |
| Core Pain | No standard intake process. Team over-services because nobody tracks scope collectively. Retainer clients request work outside contracted scope regularly. |
| Jobs To Be Done | Standardize operations; give team authority to reference scope; provide clients a professional portal experience |
| WTP | $130–200/month for multi-user platform with team features |
| Persona 3 — Priya: The Agency Ops Manager |
| --- |
| Role | Operations Manager at a 10–20 person creative agency |
| --- | --- |
| Active Clients | 20–50 concurrent, mostly retainer-based |
| Annual Revenue | $1M – $3M |
| Primary Tools | Monday.com, HubSpot, Harvest, Xero, Zoom |
| Core Pain | Account managers spend 30–40% of their week on admin — chasing approvals, documenting scope changes, formatting change orders. No single system of record for scope decisions. |
| Jobs To Be Done | Reduce admin overhead; create audit trail for all client decisions; integrate with existing PM stack |
| WTP | $200+/month; would evaluate enterprise custom pricing |
| US-BB-001 — Configure a Custom Intake Form |
| --- |
| As a... | Agency owner setting up ScopeIQ for the first time |
| --- | --- |
| I want to... | Build a custom client intake questionnaire with drag-and-drop field ordering, tailored to my service type |
| So that... | Every new client engagement starts with consistent, structured information before kickoff |
| Priority | P0 — Must Have |
| Acceptance Criteria | Supports text, multi-choice, single-choice, date, file upload, and conditional logic fields; drag-reorder works on all devices; form saves on every change (debounced 500ms); mobile-responsive at 375px; live client-view preview available before publishing |
| US-BB-002 — AI Brief Clarity Scoring |
| --- |
| As a... | Freelancer receiving a submitted client brief |
| --- | --- |
| I want to... | See an AI-generated clarity score (0–100) within 10 seconds of submission, with specific flags for ambiguous or missing sections |
| So that... | I never begin work on a brief that will cause revision spirals and scope disputes downstream |
| Priority | P0 — Must Have |
| Acceptance Criteria | Score generated within 10 seconds p95; each flag links to the specific field that triggered it; briefs scoring below threshold (default 70) automatically held; client-facing clarification request auto-generated; agency can override hold with reason logging |
| US-BB-003 — Brief Version History |
| --- |
| As a... | Agency owner managing a long-running client relationship |
| --- | --- |
| I want to... | View a full version history of all brief submissions with a side-by-side diff view |
| So that... | I have a reliable audit trail of how project scope was originally defined and how it evolved |
| Priority | P1 — Should Have |
| Acceptance Criteria | All submissions versioned with timestamp and submitter; diff highlights added/changed/removed content; any version restorable; exports to PDF on request |
| US-AP-001 — Branded Client Portal Setup |
| --- |
| As a... | Studio lead setting up a portal for a new client |
| --- | --- |
| I want to... | Configure the portal with my agency logo, brand colors, and a custom domain so the client experience looks like a proprietary agency product |
| So that... | My agency projects a polished presence that builds client confidence and distinguishes my service from competitors |
| Priority | P0 — Must Have |
| Acceptance Criteria | Logo upload (PNG/SVG/JPG up to 2MB), hex color picker, font preference; default URL {agency}.scopeiq.com; custom domain on Studio+ plans with DNS verification; no ScopeIQ branding visible on paid plans |
| US-AP-002 — Deliver Work & Collect Structured Feedback |
| --- |
| As a... | Freelancer delivering a design mockup for client review |
| --- | --- |
| I want to... | Upload or link a deliverable and have the client leave contextual, annotated feedback anchored to the exact location on the work |
| So that... | Feedback is specific, organized, and attached to the correct version — eliminating ambiguous email threads |
| Priority | P0 — Must Have |
| Acceptance Criteria | Supports file upload (images, PDFs, video up to 500MB), Figma embed, Loom/YouTube preview; clients annotate directly on images/PDFs with point-anchored comments; feedback threaded per deliverable; complete log downloadable as PDF |
| US-AP-003 — Automated Approval Reminder Sequence |
| --- |
| As a... | Freelancer waiting on client approval for a deliverable submitted 3 days ago |
| --- | --- |
| I want to... | Have the system automatically send a configurable escalating reminder sequence until a response is received or silence-as-approval is triggered |
| So that... | I never manually chase approvals and my project timeline is protected even when clients are unresponsive |
| Priority | P0 — Must Have |
| Acceptance Criteria | Configurable reminder schedule per project; minimum 3 escalation steps; reminders via email + in-portal notification; final step includes silence-as-approval clause; full audit log of all reminders; client can approve/decline directly from email |
| US-SG-001 — SOW Ingestion & AI Parsing |
| --- |
| As a... | Agency owner starting a new project with a signed Statement of Work |
| --- | --- |
| I want to... | Upload or paste my SOW and have AI automatically extract key deliverables, revision limits, timeline milestones, and exclusions |
| So that... | The platform has a structured, queryable representation of the project boundaries used to evaluate all incoming client requests |
| Priority | P0 — Must Have |
| Acceptance Criteria | Accepts PDF and plain text; extraction accuracy >85% on standard creative SOWs; agency reviews and edits all extracted terms before activation; each clause tagged by type; extraction failure shows clear error with manual fallback |
| US-SG-002 — Real-Time Scope Flag Detection |
| --- |
| As a... | Freelancer receiving a client message containing a request not covered in the signed SOW |
| --- | --- |
| I want to... | Receive an immediate in-platform notification that the request has been flagged as potentially out of scope, with the specific SOW clause it contradicts |
| So that... | I can address the out-of-scope request professionally before it becomes unbilled work |
| Priority | P0 — Must Have |
| Acceptance Criteria | Flag within 5 seconds p95 of message receipt; includes confidence score, SOW clause reference, severity level, suggested response; agency can confirm (→ change order) or dismiss (trains AI); false positive rate <15% |
| US-SG-003 — One-Click Change Order Generation |
| --- |
| As a... | Studio lead who has confirmed a client request is out of scope |
| --- | --- |
| I want to... | Generate a professional formatted change order in a single click, pre-priced from my rate card, with a digital signature field |
| So that... | Every scope expansion becomes a documented, billable conversation with a professional paper trail |
| Priority | P0 — Must Have |
| Acceptance Criteria | Generated within 5 seconds of confirmation; includes work description, pricing from rate card (editable), revised timeline, signature field; sent via portal + email; accepted orders auto-update active SOW scope; full change order history per project |
| Req ID | Priority | Requirement | Dependency |
| --- | --- | --- | --- |
| FR-BB-001 | P0 | Configurable form builder with field types: text, textarea, single/multi-choice, date, file upload, conditional logic | None |
| FR-BB-002 | P0 | AI clarity scorer — 0–100 score + per-field flags within 10 seconds of submission | Claude API |
| FR-BB-003 | P0 | Auto-hold + client clarification email for briefs scoring below configurable threshold (default: 70) | FR-BB-002 |
| FR-BB-004 | P0 | Agency override capability for held briefs with mandatory reason logging | FR-BB-003 |
| FR-BB-005 | P1 | Brief version history with full diff view and PDF export | FR-BB-001, FR-BB-002 |
| FR-BB-006 | P1 | Embeddable form via iframe and direct shareable link | FR-BB-001 |
| FR-BB-007 | P2 | Brief template library — agency-specific and community templates | FR-BB-001 |
| Req ID | Priority | Requirement | Dependency |
| --- | --- | --- | --- |
| FR-AP-001 | P0 | White-label portal — logo, brand colors, custom domain (Studio+), no ScopeIQ branding on paid plans | Cloudflare DNS |
| FR-AP-002 | P0 | Multi-format deliverable delivery: image/PDF/video upload (500MB), Figma embed, Loom/YouTube preview | S3/R2 storage |
| FR-AP-003 | P0 | Point-anchored annotation tool on images and PDFs; threaded feedback per deliverable | FR-AP-002 |
| FR-AP-004 | P0 | Revision round counter visible to both agency and client; color-coded; configurable limit from SOW | FR-SG-001 |
| FR-AP-005 | P0 | Configurable automated reminder sequence with silence-as-approval trigger and full audit log | Email service |
| FR-AP-006 | P0 | Client access via unique link — no account creation required; optional email authentication | Auth system |
| FR-AP-007 | P1 | AI feedback summarizer: converts raw client annotations into structured, prioritized revision task list | Claude API |
| FR-AP-008 | P1 | Export revision summary to Notion, Linear, or email | FR-AP-007 |
| Req ID | Priority | Requirement | Dependency |
| --- | --- | --- | --- |
| FR-SG-001 | P0 | SOW ingestion from PDF + plain text; AI extracts deliverables, revision limits, timeline, exclusions | Claude API |
| FR-SG-002 | P0 | Agency review and edit of all extracted SOW terms before activation | FR-SG-001 |
| FR-SG-003 | P0 | Real-time scope monitoring across portal messages, email forwarding, and manual input; flag in <5s | FR-SG-001 |
| FR-SG-004 | P0 | Scope flag with confidence score, SOW clause reference, severity level, and suggested response text | FR-SG-003 |
| FR-SG-005 | P0 | One-click change order generation from confirmed flag with rate card pricing and digital signature field | FR-SG-004 |
| FR-SG-006 | P0 | Client change order delivery and digital acceptance/decline via portal | FR-AP-001 |
| FR-SG-007 | P0 | Auto-update of active SOW scope upon accepted change order | FR-SG-006 |
| FR-SG-008 | P1 | Scope meter dashboard — visual project scope consumption vs. contracted scope | FR-SG-003 |
| Req ID | Priority | Requirement | Category |
| --- | --- | --- | --- |
| FR-PL-001 | P0 | Multi-workspace support: full data isolation per agency account (row-level security) | Security |
| FR-PL-002 | P0 | Stripe billing integration: subscription management, plan changes, usage-based add-ons | Billing |
| FR-PL-003 | P0 | Email notification system via Resend with customizable templates per agency | Notifications |
| FR-PL-004 | P0 | Complete project audit trail: all actions logged with actor identity and timestamp | Audit |
| FR-PL-005 | P1 | Slack integration for scope flag and approval status notifications | Integrations |
| FR-PL-006 | P1 | Figma deliverable embedding in approval portal | Integrations |
| FR-PL-007 | P2 | REST API with API key auth for Agency plan customers | API |
| Metric | Target | Notes |
| --- | --- | --- |
| Page load time (key pages) | <2 seconds on 4G connection | Dashboard, portal, brief form |
| AI brief scoring | <10 seconds p95 | From submission to score display |
| Scope flag detection | <5 seconds p95 | From message receipt to flag on dashboard |
| Change order generation | <5 seconds p95 | From confirm to document ready for sending |
| File upload 500MB | Async with progress bar — no page block | Background upload, never proxied through API server |
| API response time | <300ms p95 all REST endpoints | Monitored via APM |
| System uptime | 99.5% monthly SLA for paid plans | Excludes scheduled maintenance windows |
| Feature | Status | Target Version |
| --- | --- | --- |
| Mobile native app (iOS/Android) | Deferred — PWA covers MVP use cases | v1.5 — Q1 2027 |
| Time tracking & resource management | Deferred — covered by integrations | Year 2 |
| Project management (tasks, kanban) | Excluded — integrate with PM tools instead | Not standalone |
| Multi-language support | Deferred — i18n architecture from day one | v2.0 |
| Financial reporting and P&L | Deferred — accounting integrations instead | Year 2 |