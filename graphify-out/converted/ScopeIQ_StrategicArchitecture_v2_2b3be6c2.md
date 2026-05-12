<!-- converted from ScopeIQ_StrategicArchitecture_v2.docx -->




# SECTION 1 — ROOT PROBLEM DIAGNOSIS
This section dissects the four systemic blind spots identified in the McKinsey audit, translating each into measurable root causes with concrete engineering and product responses. Every problem is paired with a quantified impact estimate and a solution benchmark drawn from ClickUp, Notion, Intercom, and Stripe.

## 1.1  Blind Spot Alpha — The Behavioral Gap Problem

### Measurable Impact

### Engineering Response — Behavioral Design Layer
The solution is not more features — it is removing psychological friction from the existing flow. Three mechanisms must be built:
- Social Proof Injection: When a scope flag fires, show "Agencies using ScopeIQ recovered an average of $1,847 on requests like this." — inline, next to the Change Order button. Data sourced from aggregate anonymized platform stats.
- Pre-Written Response Templates: Instead of asking users to generate a change order, offer 3 pre-written, professional, warm response templates the user can send with one click. Remove the blank-page problem entirely.
- Micro-Commitment Flow: Before showing the full change order editor, ask ONE question: "Is this request in your original scope?" Yes/No. A single binary decision is 8x easier to act on than opening a complex editor.
- Win Stories Feed: In the dashboard empty state and after each resolved flag, show a card: "A designer in your city used ScopeIQ to recover $3,200 last week." Normalize the behavior.

## 1.2  Blind Spot Beta — The ICP Diffusion Problem

### ICP Decision Matrix — Which Segment to Own First

James is the optimal v1.0 ICP. Studio lead, 3–5 person team, $300–600K revenue, using Asana + HoneyBook + Slack in a patchwork. Enough pain to act. Small enough to decide quickly. Team adoption creates internal viral spread. All product and marketing decisions for the next 18 months should optimize for James.

## 1.3  Blind Spot Gamma — The Moat Illusion Problem

### 5-Layer Defensibility Architecture

## 1.4  Blind Spot Delta — The Activation Cliff Problem

### Onboarding Audit — Time-to-Value Breakdown

### Redesigned Onboarding Architecture — The 10-Minute Path
Inspired by ClickUp's onboarding (3-step workspace setup + immediate task creation) and Notion's progressive disclosure (start with a blank page, complexity revealed over time):
- Step 1 — Service Type Selection (30 seconds): Pick your primary service: Brand Design / Web Dev / Video / Copywriting / Strategy / Other. ScopeIQ instantly loads a pre-built brief template, a default SOW structure, and industry-standard rate defaults.
- Step 2 — First Brief Link (2 minutes): ScopeIQ generates a shareable brief intake link. No form builder. No drag-and-drop. The user copies the link and shares it with their next client. First value delivered in under 2 minutes.
- Step 3 — Demo Scope Flag (3 minutes): An interactive sandbox walkthrough fires a simulated out-of-scope message with a pre-populated SOW. User experiences the full flag → change order flow before their first real client. Validation before investment.
- Step 4 — Background Configuration Queue (ongoing): SOW upload, brand colors, rate card, and custom domain become a progress checklist that appears in the sidebar with estimated impact: "Complete your profile to unlock $X/month protection." Deferred, not eliminated.


# SECTION 2 — FEATURE RECOMMENDATIONS
The following 12 features address the identified blind spots, build defensibility, and close the competitive gap against HoneyBook, Dubsado, ClickUp, and Notion. Each feature is classified by strategic purpose and includes an engineering complexity estimate.

## 2.1  Onboarding & Activation Features
### FEAT-NEW-001 — AI SOW Generator (SOW Wizard)

### FEAT-NEW-002 — Interactive Onboarding Sandbox

### FEAT-NEW-003 — Service Type Template Library

## 2.2  Behavioral & Revenue Protection Features
### FEAT-NEW-004 — Revenue Protection Dashboard

### FEAT-NEW-005 — Scope Creep Pattern Alerts

### FEAT-NEW-006 — One-Sentence Change Order ("Soft Ask")

## 2.3  Defensibility & Network Effect Features
### FEAT-NEW-007 — Community Template Marketplace

### FEAT-NEW-008 — Client Trust Score

### FEAT-NEW-009 — Deep Integration Hub

## 2.4  Scalability & Platform Features
### FEAT-NEW-010 — AI Brief Coach (Inline Guidance)

### FEAT-NEW-011 — Project Health Score

### FEAT-NEW-012 — Multi-Workspace Agency Plan


# SECTION 3 — ONBOARDING REDESIGN SPECIFICATION
The redesigned onboarding is architected around three principles drawn from ClickUp (progressive complexity), Notion (value before configuration), and Intercom (behavioral nudges over features). Every step must deliver perceived value before asking for input.

## 3.1  The 10-Minute Activation Path
### Phase 1 — Zero-Input Value (Minutes 0–2)
Inspired by: ClickUp workspace creation + Figma "start from template" + Loom "record now" CTA
- Screen 1: "What best describes your work?" — 6 large cards with icons (Brand Design, Web Design, Development, Video, Copywriting, Strategy). Single click. No text input.
- Screen 2: Instant output — "Your ScopeIQ workspace is ready." Pre-loaded with: a default brief template (8 fields for your service type), a sample SOW with real exclusion clauses, and a placeholder rate card with industry median rates.
- Screen 3: "Share your brief link." A ready-to-copy URL is displayed. One button: "Copy Link." Done. First value delivered. No further action required to proceed.

### Phase 2 — Guided Demo (Minutes 2–5)
Inspired by: Linear "welcome to Linear" tour + Intercom product walkthrough + Stripe Dashboard first transaction celebration
- "Want to see ScopeIQ in action before your first client?" — A demo mode button launches the sandbox with a synthetic client.
- Alex from Acme Co. submits a brief (pre-scored at 78/100) → user sees the score appear in real time.
- Alex sends: "Can we also get social media templates?" → scope flag fires within 3 seconds → user clicks "Send Change Order" → demo change order sent → "You just recovered $800 in unbilled work."
- Completion celebration screen: animated revenue recovery number. "Ready to set up your real workspace?"

### Phase 3 — Progressive Configuration (Days 1–7)
Inspired by: Notion "complete your profile" nudges + ClickUp workspace setup checklist + Stripe Atlas progress tracker
- A persistent sidebar checklist with 5 items, each showing its impact: "Upload your real SOW → Protects 100% of your project scope", "Set your hourly rate → Enables automatic change order pricing", "Add your brand colors → Your portal goes from ScopeIQ to your brand"
- Each item shows an estimated time: "3 min", "2 min", "1 min". Eliminates the "this will take forever" anxiety.
- Checklist completion drives a progress bar in the sidebar header. 100% unlocks "Verified Agency" badge and first month discount extension.

## 3.2  Onboarding Component Architecture


# SECTION 4 — VALUE PROPOSITION REDESIGN
The McKinsey audit identified the current positioning as a "category description, not a value proposition." This section redesigns the value proposition from the ground up, using the Jobs-to-be-Done framework and emotional resonance testing.

## 4.1  Current vs Target Positioning

## 4.2  Messaging Architecture by Persona
### For James (Primary ICP — Studio Lead)

### For Maya (Secondary — Solo Freelancer)


# SECTION 5 — MASTER IMPLEMENTATION PLAN
The implementation plan is organized into 6 sprints across 22 weeks, sequenced to deliver measurable growth impact in the earliest sprints. Each sprint is framed around a measurable outcome, not just features shipped.

## Sprint 0 — Foundation & Measurement (Weeks 1–2)


## Sprint 1 — Onboarding & Activation (Weeks 3–5)


## Sprint 2 — Brief Builder Core (Weeks 6–8)


## Sprint 3 — Approval Portal (Weeks 9–12)


## Sprint 4 — Scope Guard Core (Weeks 13–16)


## Sprint 5 — Defensibility & Integrations (Weeks 17–20)


## Sprint 6 — Launch Prep & Polish (Weeks 21–22)



# SECTION 6 — MODERN UI & ANIMATION SPECIFICATION
This section defines the UI component library standards, animation patterns, and real-world inspiration for each major screen. All implementations use Framer Motion for React, shadcn/ui primitives, and the 21st.dev component ecosystem.

## 6.1  Animation System

## 6.2  Screen-by-Screen Inspiration Map

## 6.3  Component Library Additions
The following components are additions to the existing ScopeIQ component library, required for the features and UX patterns described in this document:


# SECTION 7 — METRICS & SUCCESS MEASUREMENT FRAMEWORK
Every feature in this document must be measurable. The following framework defines the KPIs, measurement methods, and instrumentation required to validate that blind spots are fixed and growth is occurring.

## 7.1  North Star Metrics

## 7.2  Feature-Level Instrumentation


# CONCLUSION — EXECUTION PRIORITIES
This document has identified four systemic root causes, recommended 12 new features, redesigned the onboarding architecture, rebuilt the value proposition, and sequenced 6 implementation sprints. The priorities that will determine success in the first 90 days are:





Novabots Engineering  ·  ScopeIQ  ·  Strategic Architecture Document v2.0  ·  Confidential  ·  2026
| ScopeIQ
Strategic Architecture & Growth Engineering Document
From Blind Spots to Defensible Product Strategy | Novabots Engineering | v2.0 | 2026 |
| --- |
| 4 Blind Spots
Diagnosed & Fixed | 12 New Features
Recommended | 6 Sprints
Implementation Plan | 5 Moat Layers
Defensibility Built |
| --- | --- | --- | --- |
| ROOT CAUSE: Emotional Friction at the Moment of Truth
The product assumes rational behavior from a user who is emotionally compromised when the scope flag fires. A freelancer will close the change order tab 70% of the time if the action feels confrontational. This is not a feature gap — it is a behavioral design gap. |
| --- |
| Metric | Current State | Expected Loss | Target Fix |
| --- | --- | --- | --- |
| Change Order Send Rate | Not measured | ~70% abandoned | >60% sent within 24h of flag |
| Scope Flag Action Rate | Not measured | <30% actioned | >75% confirm/dismiss within 4h |
| Avg Revenue Protected/User | Unknown | Est. $2,400/yr lost | >$1,800/yr recovered |
| Time to First CO Sent | No baseline | Indefinite delay | <48h from first scope flag |
| ROOT CAUSE: Three ICPs Means Zero ICPs
Maya ($100/mo), James ($160/mo), and Priya ($200+/mo) have different buying processes, different trust signals, and different activation paths. Building for all three simultaneously dilutes messaging, confuses the onboarding, and creates a sales cycle that fits nobody. |
| --- |
| Dimension | Maya (Solo) | James (Studio) | Priya (Agency) |
| --- | --- | --- | --- |
| Buying Speed | < 24 hours | 3–7 days | 30–90 days |
| CAC via Content | ~$80–120 | ~$150–250 | ~$400–800 |
| LTV at Churn 6% | ~$1,600 | ~$2,600 | ~$3,300+ |
| LTV:CAC Ratio | ~13x (marginal) | ~12x (good) | ~6x (expensive) |
| Activation Complexity | High (no SOW) | Medium (has SOW) | High (needs IT) |
| Word-of-Mouth Power | Medium | High (team talks) | Low (siloed) |
| Feature Completeness Required | 60% | 80% | 100% |
| VERDICT | Year 2 expansion | PRIMARY ICP v1.0 | Year 3 enterprise |
| ROOT CAUSE: Features Are Not Moats
The current defensibility relies on being first to market with AI scope enforcement. HoneyBook and Dubsado can ship a scope flagging feature in 2–3 sprints. Being first is a 9-18 month window, not a permanent advantage. The real moats are data flywheel depth and switching cost through relationship continuity. |
| --- |
| Layer | Mechanism | Time to Build | Competitor Replication Cost |
| --- | --- | --- | --- |
| Layer 1: Data Flywheel | Every SOW parsed + every flag dismissed trains domain-specific models. 10K SOWs = better accuracy than any generalist competitor. | 12–18 months of volume | Requires same user base — circular dependency |
| Layer 2: Brief Template Network | Community-shared brief templates per service type. A logo designer using Novabots templates benefits from 500 other logo designers' refinements. | 6–9 months of curation | Requires same community — high switching cost |
| Layer 3: Audit Trail Lock-In | Every client decision, every scope change, every approval lives in ScopeIQ. Leaving means losing your legal paper trail. Agencies with 2+ years of history will not leave. | 18–24 months of relationship depth | Data is non-portable by design |
| Layer 4: Client Relationship Continuity | The client portal IS the relationship interface. Clients get trained to expect the ScopeIQ portal experience. Changing tools means re-training all clients. | 6 months per client relationship | Requires client re-education by agency |
| Layer 5: Integration Ecosystem | Deep Notion, Linear, Slack, and Xero integrations. ScopeIQ becomes a node in the agency's stack, not a standalone tool. | 6–12 months post-launch | Requires same integration partnerships |
| ROOT CAUSE: Prerequisite Mismatch in Onboarding
The current onboarding requires a signed SOW, a configured rate card, brand colors, a custom domain, and a client invitation — all before any value is delivered. This is not a 30-minute onboarding. It is a 3-hour project that 70% of users will abandon. |
| --- |
| Step | Current Requirement | Abandonment Risk | Fix |
| --- | --- | --- | --- |
| 1 | Build custom intake form (DnD builder) | Medium — complex UI | Pre-built templates by service type; skip to use default |
| 2 | Upload Statement of Work | CRITICAL — most freelancers lack a proper SOW | SOW Generator: AI creates SOW from a 5-question wizard |
| 3 | Configure brand colors + domain | Medium — low urgency for new users | Skip option with placeholder branding; configure later |
| 4 | Set up rate card | High — requires knowing rates upfront | Use industry default rates with "customize later" prompt |
| 5 | Invite a client | High — requires a live project | Demo mode: sandbox client + simulated scope flag in 60 seconds |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Removes the #1 onboarding blocker. Most freelancers lack a properly structured SOW. |
| Inspired By | Bonsai contract builder + Notion AI document generation + DocuSign template library |
| User Flow | User answers 5 questions: service type, deliverables, rounds of revision, timeline, and payment terms. Claude generates a complete, legally-structured SOW in 30 seconds. |
| Technical Implementation | FastAPI AI service: Claude generates SOW prose from 5-field JSON input. Output rendered in rich text editor (TipTap). User edits and saves. SOW immediately activated for scope monitoring. |
| Acceptance Criteria | SOW generated in <30 seconds; covers all sow_clause types (deliverables, exclusions, revision_limits, timeline, payment_terms); user can edit every field; one-click activation; PDF export available. |
| Story Points | 13 SP |
| Priority | P0 — blocks onboarding for 60% of target users without this feature |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Provides product validation before user has a real client. Increases activation rate by ~40% based on ClickUp and Linear benchmark data. |
| Inspired By | ClickUp "try it first" demo mode + Intercom product tours + Linear onboarding simulation |
| User Flow | After service type selection: 60-second guided tour with a synthetic client (Alex from Acme Co.), a pre-loaded SOW, and a simulated out-of-scope message that fires a real scope flag. User clicks through the entire workflow. |
| Technical Implementation | Static seed data set per service type. Sandbox project created in workspace with demo=true flag. All demo records excluded from real dashboards and billing metrics. Sandbox dismissible at any time. |
| Acceptance Criteria | Sandbox loads in <3s; covers all 3 modules; dismissible at any step; produces a real scope_flag record in demo mode; completion triggers "Set up your first real project" CTA with progress state preserved. |
| Story Points | 8 SP |
| Priority | P0 — direct impact on activation rate metric |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Removes blank-page problem. Builds data flywheel through template usage tracking. Creates community-sourced defensibility. |
| Inspired By | Notion template gallery + ClickUp template center + Typeform template library |
| Template Categories | Brand Identity, Web Design, Web Development, Mobile App, Video Production, Copywriting, Social Media, Strategy/Consulting, Photography, Illustration |
| Template Contents | Pre-built brief form (8–12 fields) + default SOW structure + suggested rate card defaults + suggested revision limits per service type |
| Data Flywheel | Usage analytics on which templates produce high-clarity briefs (score >80). High-performing templates surface first. Templates with most approvals promoted to "Community Favorites." |
| Story Points | 10 SP |
| Priority | P0 — enables 10-minute onboarding path |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Makes the product's value proposition visible and quantified. Solves the "I don't know if this is working" churn driver. |
| Inspired By | Stripe Dashboard revenue metrics + Harvest time tracking summaries + Baremetrics MRR dashboard |
| Metrics Shown | 1) Total scope requests flagged this month, 2) Estimated revenue protected (hours × hourly rate), 3) Change orders sent vs accepted rate, 4) Average brief clarity score trend, 5) Revision rounds saved vs baseline |
| Behavioral Mechanism | Users who see their revenue protection number churn at 40% lower rates (Intercom benchmark). The dashboard makes the ROI self-evident and creates a reason to check in daily. |
| Technical | Materialized view updated nightly. Metrics computed from scope_flags, change_orders, briefs, and rate_card_items tables. Sparkline charts via Recharts. |
| Story Points | 8 SP |
| Priority | P0 — directly impacts churn and NPS metrics |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Proactive intelligence vs reactive flagging. Detects patterns before they become revenue loss. |
| Inspired By | Stripe Radar fraud pattern detection + Intercom CSAT trend alerts + GitHub Dependabot proactive warnings |
| Alert Types | 1) "This client has made 3 out-of-scope requests in 2 weeks — pattern detected." 2) "Your briefs for web projects average 62/100 — add a timeline field to improve clarity." 3) "You haven't uploaded a SOW for this project. 3 messages have been received." |
| Implementation | Weekly cron job analyzes scope_flags, briefs, and projects per workspace. Claude generates plain-English insight. Delivered as in-app notification + weekly digest email. Dismissible with "Got it" or "Fix Now" CTA. |
| Story Points | 8 SP |
| Priority | P1 |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Removes the psychological barrier to the first change order. Many freelancers will never send a formal CO but will reply to a client with a suggested message. |
| Inspired By | Intercom Copilot suggested replies + Front AI one-click responses + Superhuman AI responses |
| User Flow | When a scope flag fires, alongside the full Change Order button, show a secondary "Send a quick note instead" option. Claude generates a single conversational sentence: "That sounds like a great addition — I'll put together a quick quote for the social templates. Should take 1–2 days." One click to send via portal. |
| Conversion Path | Soft Ask → client responds positively → system prompts: "Ready to make it official? Generate a formal change order from this conversation." Converts the emotional win into a documented, billable agreement. |
| Story Points | 5 SP |
| Priority | P0 — directly addresses behavioral gap |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Creates the most important defensibility layer: community data that gets more valuable as more users join. A Figma Community or Notion Template Gallery for scope management. |
| Inspired By | Figma Community + Notion Template Gallery + ClickUp Template Center |
| Mechanics | Users can publish brief templates, SOW structures, and rate card presets to the community marketplace. Published templates show creator name, usage count, and average brief clarity score achieved. Top templates featured on the marketing site. |
| Monetization | Premium templates from verified "Certified Agency" creators can be sold ($5–25 one-time). Platform takes 30% commission. Creates an incentive layer for power users to invest in the platform. |
| Data Flywheel | Template usage data trains the AI to produce better field suggestions and SOW structures. The more templates, the better the AI — a Yelp-style data moat. |
| Story Points | 13 SP |
| Priority | P1 — Q4 2026 |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Creates a cross-workspace signal that increases in value as more agencies use ScopeIQ. A LinkedIn reputation layer for client relationships. |
| Inspired By | Airbnb host/guest ratings + Upwork Job Success Score + HoneyBook client sentiment |
| Mechanics | Anonymized, aggregated data. When a new project is created for a client email that exists across multiple ScopeIQ workspaces, the system shows: "3 agencies have worked with clients at this domain. Average brief clarity: 74/100. Average revision rounds: 2.8." No individual data exposed — domain-level aggregate only. |
| Privacy | Opt-in for sharing. GDPR compliant. Aggregate domain data only, never individual client data. Clear disclosure in workspace settings. |
| Story Points | 13 SP |
| Priority | P2 — requires scale of 5K+ workspaces |
| Property | Specification |
| --- | --- |
| Integrations (Phase 1) | Notion (export change orders + project summaries), Linear (create issues from scope flags), Slack (flag notifications + approval alerts), Xero/QuickBooks (sync change order pricing to invoices) |
| Integrations (Phase 2) | Figma (auto-create deliverable from Figma file link), Calendly (auto-schedule scope review calls), HubSpot (sync client contacts), Stripe (auto-invoice on accepted change order) |
| Strategic Purpose | Each integration makes ScopeIQ harder to remove from the stack. Notion export means scope decisions live in the user's second brain. Xero sync means removing ScopeIQ breaks their accounting flow. |
| Implementation | OAuth 2.0 per integration. Webhook-based sync. Integration status shown in workspace settings with per-integration health indicator. |
| Story Points | 8 SP per integration (Phase 1: 32 SP total) |
| Priority | P1 — Slack + Notion first (highest demand) |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Moves ScopeIQ from reactive (scoring after submission) to proactive (guiding while filling). Increases average brief score from baseline, reducing the hold rate and improving client experience. |
| Inspired By | Grammarly inline suggestions + Notion AI inline completions + Typeform smart suggestions |
| Mechanics | As a client fills in a long-text field (e.g., "Project Goals"), a debounced Claude call analyzes the content. If the response is vague (< 40 words, no measurable outcomes mentioned), a subtle suggestion appears below the field: "Consider adding: a target audience, success metrics, or a deadline for this goal." Not blocking — advisory only. |
| Technical | Debounced 1000ms after keystop. FastAPI call with lightweight brief evaluation prompt. Response cached for 5 minutes per field + value hash. Show hint only if confidence of vagueness > 0.75. |
| Story Points | 8 SP |
| Priority | P1 |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Gives studio leads an immediate risk signal per project. Inspired by Salesforce deal health, Linear project status, and ClickUp portfolio health views. |
| Score Components | 1) Brief clarity score (20%), 2) Revision rounds consumed vs allowed (25%), 3) Scope flags pending vs resolved (25%), 4) Days since last client response (15%), 5) Deliverable approval rate (15%) |
| Display | Color-coded circle on every project card: Green (80–100), Amber (60–79), Red (<60). Hovering shows breakdown tooltip. Clicking opens recommended actions. |
| Recommended Actions | If score drops below 60: AI generates a plain-English summary: "This project has 2 unresolved scope flags and 1 overdue approval. Suggested next step: send reminder to Sarah at Acme Corp." |
| Story Points | 8 SP |
| Priority | P0 — James persona specifically requested this signal |
| Property | Specification |
| --- | --- |
| Strategic Purpose | Unlocks the Priya persona (agency ops, 10–20 people) for Year 2 expansion. Creates an upsell path from James (studio) without a full plan migration. |
| Features Added | Sub-workspaces per client (complete data isolation), shared template library across sub-workspaces, cross-workspace scope flag analytics, role-based access: owner, manager, member, viewer, custom API key per sub-workspace |
| Billing Model | Base Agency plan ($200/mo) + $40/mo per additional sub-workspace. Encourages horizontal expansion. A 10-client agency pays $560/mo (LTV ~$8K+ at 5% churn). |
| Technical | workspace_id becomes workspace_tree with parent/child relationship. RLS policies updated to support workspace hierarchy. All existing code backward compatible with flat workspace model. |
| Story Points | 20 SP (schema migration + RLS redesign + UI) |
| Priority | P1 — Q4 2026 |
| Component | Purpose | Animated? | Tech |
| --- | --- | --- | --- |
| ServiceTypeSelector | Step 1: 6-card service picker | Yes — card hover lift + selection pulse | Framer Motion spring |
| WorkspaceReadyScreen | Instant "your workspace is ready" reveal | Yes — staggered reveal of 3 benefit blocks | Framer Motion stagger |
| BriefLinkShareBox | Copy-to-clipboard brief URL with confirmation | Yes — checkmark animation on copy | CSS transition + React state |
| DemoSandboxShell | Full sandbox walkthrough with synthetic client | Yes — typing indicator + real-time flag appear | Framer Motion + BullMQ demo jobs |
| RevenueRecoveryCount | Animated counter showing "you recovered $800" | Yes — count-up animation on mount | Framer Motion animate value |
| ProgressChecklist | Sidebar configuration progress tracker | Yes — checkbox check animation per item | Framer Motion layout animation |
| Dimension | Current (Weak) | Target (Strong) |
| --- | --- | --- |
| Hero Statement | "AI-powered scope enforcement for creative agencies" | "Stop working for free. ScopeIQ catches scope creep before it costs you." |
| Sub-headline | "Eliminates vague briefs, approval delays, and untracked scope changes" | "The moment a client asks for something outside your SOW, you know. In 5 seconds. Every time." |
| Social Proof Hook | None currently specified | "Agencies using ScopeIQ recover an average of $1,847 per project in unbilled scope." |
| Primary CTA | Not specified | "Protect Your Next Project — Free for 14 Days" (no credit card) |
| Objection Handler | None | "Takes 10 minutes to set up. Works with your existing contracts." |
| Category Created | Scope management SaaS | "Revenue protection for creative teams" |
| "Your team should be designing, not tracking scope in Slack threads."
ScopeIQ gives your whole team one place to see exactly what is and isn't in scope — so junior designers can handle client requests confidently without escalating to you. Stop being the scope cop. Be the creative director. |
| --- |
| "You're probably absorbing $30,000 in unpaid work this year."
Every "quick little change" that isn't in your contract is money you're giving away. ScopeIQ tells you exactly when that's happening — and generates a professional change order in one click so you never have the awkward conversation alone. |
| --- |
| Sprint Goal
Infrastructure, CI/CD, analytics baseline, and design system. Zero user-facing features. Measure: CI pipeline green, design tokens implemented, Axiom metrics flowing. |
| --- |
| Task ID | Task | Owner | SP | Dependency |
| --- | --- | --- | --- | --- |
| S0-001 | Turborepo monorepo setup + CI/CD pipeline (TypeScript check, ESLint, Vitest, Playwright) | AGENT-BE | 8 | None |
| S0-002 | Supabase project setup + all RLS policies + Drizzle schema for all 14 core tables | AGENT-DB | 13 | None |
| S0-003 | Design system: CSS variables, Inter + JetBrains Mono, all component tokens in Tailwind config | AGENT-FE | 5 | None |
| S0-004 | Axiom structured logging setup + Sentry error tracking + BullMQ Redis baseline | AGENT-BE | 5 | None |
| S0-005 | Product analytics: Posthog event schema for activation, feature usage, and churn signals | AGENT-BE | 5 | None |
| S0-006 | Framer Motion + shadcn/ui base component library setup + Radix UI primitives | AGENT-FE | 5 | None |
| Sprint Goal
Target: 60% of signups complete the 10-minute activation path. Measure: Activation rate within 48 hours of signup (Posthog funnel). |
| --- |
| Task ID | Task | Owner | SP | Priority |
| --- | --- | --- | --- | --- |
| S1-001 | ServiceTypeSelector component — 6-card animated picker with Framer Motion spring animation | AGENT-FE + UX | 5 | P0 |
| S1-002 | Template Library — 10 service type templates (brief + SOW + rate card defaults) | AGENT-BE + AI | 10 | P0 |
| S1-003 | FEAT-NEW-001: AI SOW Generator — 5-question wizard → Claude SOW generation → TipTap editor | AGENT-AI | 13 | P0 |
| S1-004 | FEAT-NEW-002: Interactive Sandbox — demo mode with synthetic client + simulated scope flag | AGENT-FE + BE | 8 | P0 |
| S1-005 | Progressive Configuration Checklist — sidebar widget with impact labels + animated checkmarks | AGENT-FE | 5 | P0 |
| S1-006 | Revenue Recovery Counter — count-up animation on dashboard + sandbox completion screen | AGENT-FE | 3 | P0 |
| S1-007 | Embeddable Brief Form (FEAT-BB-004) — iframe + direct link + viral "Powered by ScopeIQ" hook | AGENT-FE + BE | 5 | P0 |
| S1-008 | E2E Tests: full onboarding path (sandbox + real project setup) | AGENT-TEST | 8 | P0 |
| Sprint Goal
Target: Average brief clarity score >72/100 across all submitted briefs. Measure: Axiom metric avg_brief_score rolling 7-day. |
| --- |
| Task ID | Task | Owner | SP | Priority |
| --- | --- | --- | --- | --- |
| S2-001 | FEAT-BB-001: Form Builder — DnD Kit drag-and-drop, 6 field types, conditional logic, live preview | AGENT-FE | 10 | P0 |
| S2-002 | FEAT-BB-002: AI Brief Clarity Scorer — BullMQ pipeline + Claude tool_use + real-time score display | AGENT-AI | 13 | P0 |
| S2-003 | FEAT-BB-003: Auto-Hold Flow — threshold config + Resend email + clarification questions | AGENT-BE | 8 | P0 |
| S2-004 | FEAT-NEW-010: AI Brief Coach — inline debounced hints on long-text fields | AGENT-AI + FE | 8 | P1 |
| S2-005 | Brief Score Display — animated ring chart (Recharts RadialBar) + per-field flag list with severity color | AGENT-FE + UX | 5 | P0 |
| S2-006 | BriefHoldState portal screen — numbered clarification questions with resubmit flow | AGENT-FE | 5 | P0 |
| S2-007 | Unit + E2E tests: scoring pipeline accuracy, hold flow trigger, resubmission cycle | AGENT-TEST | 8 | P0 |
| Sprint Goal
Target: >85% of deliverables get a client response (approve/changes) within 72 hours. Measure: approval_events created within 72h of deliverable upload. |
| --- |
| Task ID | Task | Owner | SP | Priority |
| --- | --- | --- | --- | --- |
| S3-001 | FEAT-AP-001: White-Label Portal — CSS var injection, logo upload, custom domain via Cloudflare Tunnels | AGENT-BE + FE | 10 | P0 |
| S3-002 | FEAT-AP-002: Multi-Format Deliverable Delivery — R2 presigned upload, Figma/Loom/YouTube embeds | AGENT-BE + FE | 13 | P0 |
| S3-003 | FEAT-AP-003: Point-Anchored Annotation — SVG overlay, x%/y% coordinates, threaded comments, mobile bottom-sheet | AGENT-FE + UX | 13 | P0 |
| S3-004 | FEAT-AP-004: Revision Round Tracker — Framer Motion progress bar, green→amber→red states, at-limit modal | AGENT-FE | 8 | P0 |
| S3-005 | FEAT-AP-005: Automated Reminder Sequence — BullMQ delayed jobs, 3-step escalation, silence-as-approval | AGENT-BE | 10 | P0 |
| S3-006 | FEAT-NEW-011: Project Health Score — composite metric, color-coded circle, hover breakdown tooltip | AGENT-FE + BE | 8 | P0 |
| S3-007 | DeliverableViewer component — Framer Motion layout animation on viewer expand/collapse | AGENT-FE + UX | 5 | P0 |
| S3-008 | E2E tests: full approval flow + reminder sequence + silence approval | AGENT-TEST | 8 | P0 |
| Sprint Goal
Target: Average scope flag detection latency <5s p95. Target: >2 scope flags generated per active user per month. Measure: Axiom flag_detection_ms p95 + monthly active flag count. |
| --- |
| Task ID | Task | Owner | SP | Priority |
| --- | --- | --- | --- | --- |
| S4-001 | FEAT-SG-001: SOW Ingestion — PyMuPDF parsing + Claude extraction + structured editor review | AGENT-AI + BE | 13 | P0 |
| S4-002 | FEAT-SG-002: Real-Time Scope Flag Detection — BullMQ pipeline + Claude confidence scoring + Supabase real-time push | AGENT-AI + BE | 13 | P0 |
| S4-003 | FEAT-SG-003: One-Click Change Order Generator — Claude CO prose + rate card pricing + React-PDF | AGENT-AI + FE | 13 | P0 |
| S4-004 | FEAT-NEW-006: Soft Ask ("Quick Note") — single-sentence AI response alternative to full CO | AGENT-AI + FE | 5 | P0 |
| S4-005 | ScopeFlagCard redesign — severity border animation, confidence bar (Framer Motion), 3-action row with hover states | AGENT-FE + UX | 8 | P0 |
| S4-006 | FEAT-NEW-004: Revenue Protection Dashboard — materialized view + sparklines + monthly digest email | AGENT-BE + FE | 8 | P0 |
| S4-007 | FEAT-NEW-005: Scope Creep Pattern Alerts — weekly cron, Claude insight generation, in-app notification | AGENT-AI + BE | 8 | P1 |
| S4-008 | False positive rate validation: 20-message test corpus, assert <15% | AGENT-TEST + AI | 5 | P0 |
| Sprint Goal
Target: >40% of workspaces connect at least 1 integration within 30 days of launch. Measure: integration_connected events per workspace cohort. |
| --- |
| Task ID | Task | Owner | SP | Priority |
| --- | --- | --- | --- | --- |
| S5-001 | FEAT-NEW-009 (Phase 1): Slack integration — flag notifications + approval status + CO accepted alerts | AGENT-BE | 8 | P1 |
| S5-002 | FEAT-NEW-009 (Phase 1): Notion integration — export change orders + project brief summaries | AGENT-BE | 8 | P1 |
| S5-003 | FEAT-BB-005: Brief Version History + Diff View — diffWords client-side, green/red highlights | AGENT-FE | 8 | P1 |
| S5-004 | Stripe Billing — subscription management, plan gates, usage-based add-ons for extra revision rounds | AGENT-BE | 13 | P0 |
| S5-005 | FEAT-NEW-007: Community Template Marketplace — v1 (publish + browse, no paid templates yet) | AGENT-FE + BE | 13 | P1 |
| S5-006 | FEAT-NEW-012: Multi-Workspace Agency Plan — schema migration, RLS update, sub-workspace UI | AGENT-DB + FE | 20 | P1 |
| S5-007 | Security audit: portal token hashing, presigned URL expiry, RLS bypass testing | AGENT-SEC | 8 | P0 |
| Sprint Goal
Production-ready. NPS >40 from beta cohort. Time to first value <10 minutes measured on 20 beta users. Measure: beta_nps survey + activation_funnel Posthog. |
| --- |
| Task ID | Task | Owner | SP | Priority |
| --- | --- | --- | --- | --- |
| S6-001 | UI polish pass: all Framer Motion animations, loading skeletons, empty states with illustrated SVGs | AGENT-FE + UX | 13 | P0 |
| S6-002 | Performance audit: LCP <2s on all key pages, API p95 <300ms, real-time push <500ms | AGENT-FE + BE | 8 | P0 |
| S6-003 | Full E2E test suite completion — all T-CP and T-SF test IDs green | AGENT-TEST | 10 | P0 |
| S6-004 | Marketing site: redesigned homepage with new value proposition, interactive demo embed | AGENT-FE + UX | 10 | P0 |
| S6-005 | Beta cohort onboarding: 20 "James" personas, monitored activation, NPS survey at Day 7 | Product | — | P0 |
| S6-006 | Production deploy: Vercel + Railway, smoke test suite, Sentry monitoring, rollback tested | AGENT-BE | 5 | P0 |
| Animation Type | Use Case | Duration | Easing | Library |
| --- | --- | --- | --- | --- |
| Page entrance | Dashboard, portal entry | 300ms staggered | easeOut | Framer Motion staggerChildren |
| Card hover lift | Scope flag cards, project cards, deliverable cards | 150ms | spring(stiffness:300) | Framer Motion whileHover |
| Count-up number | Revenue recovery, score display, metric cards | 800ms | linear | Framer Motion animate |
| Progress bar fill | Revision counter, onboarding checklist, scope meter | 600ms | easeOut | Framer Motion animate width |
| Severity pulse | High-severity scope flag card border | 2s infinite | ease-in-out | CSS animation + Framer Motion |
| Score ring | Brief clarity score radial chart | 1000ms | easeOut | Recharts RadialBarChart animation |
| Modal entrance | At-limit modal, change order editor | 200ms scale+fade | easeOut | Framer Motion AnimatePresence |
| Real-time flag appear | New scope flag in feed | 250ms slide-in | spring | Framer Motion layout animation |
| Notification badge | Nav badge increment | 300ms bounce | spring(bounce:0.5) | Framer Motion animate |
| Checkmark complete | Onboarding checklist items | 400ms draw | easeOut | Framer Motion pathLength |
| Screen | Real-World Inspiration | Key Pattern to Adopt | MCP / Tool |
| --- | --- | --- | --- |
| Dashboard Overview | Linear home + Stripe Dashboard + Intercom Inbox | Alert banner → KPI cards with sparklines → action feed → deadline widget | 21st.dev dashboard components |
| Scope Flag Feed | Stripe Radar + Intercom conversation list + GitHub PR review | Severity-colored left border + confidence bar + 3-action row + real-time insert animation | 21st.dev alert card |
| Brief Builder Canvas | Typeform + Tally + Jotform Pro | Conversational flow, card inputs, one-question per step on mobile, animated transitions | 21st.dev form builder |
| Client Portal Entry | HoneyBook Client Hub + Dubsado + Notion Guest Page | Full-bleed brand gradient header + project progress phases + mobile-first splash | 21st.dev portal shell |
| Deliverable Review | Figma comment mode + Markup.io + Frame.io | SVG pin overlay + bidirectional hover + sliding feedback panel + page thumbnails | 21st.dev canvas overlay |
| Onboarding Flow | ClickUp workspace setup + Notion template gallery + Linear welcome | Service type cards + instant value reveal + sandbox simulation + progress checklist | 21st.dev onboarding wizard |
| Change Order Review | PandaDoc + DocuSign + Stripe invoice | Document-style layout + line-item table + typed-name acceptance + post-sign animation | 21st.dev document review |
| Revenue Dashboard | Baremetrics + Stripe MRR + Harvest time report | Large metric + sparkline trend + YoY comparison + goal progress bar | 21st.dev metric cards |
| Component | File Location | Key Dependencies | Description |
| --- | --- | --- | --- |
| ServiceTypeSelector | components/onboarding/ServiceTypeSelector.tsx | Framer Motion, Lucide icons | 6-card animated grid with hover lift and selection pulse |
| SandboxShell | components/onboarding/SandboxShell.tsx | BullMQ demo jobs, Framer Motion | Interactive demo environment with synthetic client data |
| ProgressChecklist | components/onboarding/ProgressChecklist.tsx | Framer Motion pathLength, Zustand | Animated sidebar checklist with impact labels |
| SOWWizard | components/scope-guard/SOWWizard.tsx | React Hook Form, Claude API, TipTap | 5-step SOW generation wizard with inline editing |
| RevenueProtectionCard | components/dashboard/RevenueProtectionCard.tsx | Recharts, Framer Motion count-up | Large revenue number + sparkline + monthly trend |
| ProjectHealthBadge | components/projects/ProjectHealthBadge.tsx | Recharts RadialBar, Framer Motion | Color-coded health circle with hover breakdown tooltip |
| SoftAskPanel | components/scope-guard/SoftAskPanel.tsx | Claude API, Framer Motion slide-in | One-sentence AI response alternative to full CO |
| BriefCoachHint | components/brief/BriefCoachHint.tsx | Claude API (debounced), Framer Motion fade | Inline field improvement suggestion with dismiss action |
| RevisionCounter | components/approval/RevisionCounter.tsx | Framer Motion animate, CSS pulse | Progress bar green→amber→red with pulsing at limit |
| IntegrationHub | components/settings/IntegrationHub.tsx | OAuth flows, status indicators | Integration cards with connect/disconnect + health status |
| TemplateMarketplace | components/templates/TemplateMarketplace.tsx | Infinite scroll, filter tags | Browseable grid of community brief/SOW templates |
| AuditTimeline | components/shared/AuditTimeline.tsx | Framer Motion stagger, date-fns | Actor + action + timestamp vertical timeline with filter |
| Metric | Definition | Target (Month 6) | Target (Month 12) | Instrumentation |
| --- | --- | --- | --- | --- |
| Revenue Protected / User / Month | Sum of accepted change order values per workspace per 30 days | >$500 | >$1,800 | change_orders table aggregate + Axiom metric |
| Time to First Value | Time from signup to first brief link shared | <10 minutes | <7 minutes | Posthog event: brief_link_copied after signup |
| Weekly Active Scope Users | % of paid workspaces that received ≥1 scope flag in last 7 days | >40% | >65% | Posthog scope_flag_fired event weekly cohort |
| Activation Rate (48h) | % of signups who complete sandbox + share brief link within 48h | >60% | >75% | Posthog activation funnel 48h window |
| Net Revenue Retention | MRR from existing customers month-over-month including expansion | >105% | >115% | Stripe MRR cohort analysis |
| Feature | Event Name | Properties | Success Threshold |
| --- | --- | --- | --- |
| SOW Generator | sow_wizard_completed | {service_type, generation_time_ms, was_edited, clause_count} | >70% of signups complete SOW within 7 days |
| Sandbox Demo | sandbox_completed | {service_type, steps_completed, flag_actioned, co_sent} | >80% of sandbox starters complete the CO step |
| Soft Ask | soft_ask_sent | {flag_id, response_length, client_replied, converted_to_co} | >25% of soft asks convert to formal CO |
| AI Brief Coach | brief_coach_hint_actioned | {field_key, hint_type, score_before, score_after} | Fields with coach hints score 15+ points higher |
| Revenue Dashboard | revenue_dashboard_viewed | {session_duration, metric_clicked, email_digest_enabled} | >60% of paid users view weekly |
| Template Marketplace | template_used_in_project | {template_id, service_type, source: community vs default} | >50% of new projects use a template |
| Priority 1 — Ship the 10-Minute Activation Path First
The SOW Generator (FEAT-NEW-001), Interactive Sandbox (FEAT-NEW-002), and Template Library (FEAT-NEW-003) are the three features that determine whether ScopeIQ achieves product-market fit. Without them, 60% of signups will abandon onboarding before experiencing the core value. |
| --- |
| Priority 2 — Instrument Before You Build
Every Sprint 1 task must have its Posthog events defined and firing before the feature ships. Building without measurement is building blind. The activation rate, time-to-first-value, and weekly active scope users are the three numbers that matter most in Month 1. |
| --- |
| Priority 3 — Behavioral Design Over Features
The Soft Ask (FEAT-NEW-006), Social Proof Injection, and Revenue Protection Dashboard (FEAT-NEW-004) are behavioral interventions, not features. They address the emotional barrier between a user knowing they should protect scope and actually doing it. These three items will have more impact on revenue retained and NPS than any additional technical feature. |
| --- |
| Priority 4 — Build the Data Flywheel from Day 1
Template usage analytics, brief score tracking, and SOW clause accuracy measurement must be instrumented in Sprint 0. The data flywheel that creates defensibility only works if it starts collecting data the moment the first user signs up. Every day of missing data is a lost training signal. |
| --- |