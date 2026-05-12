ScopeIQ  ·  Feature Breakdown Document  ·  v2.0  
Complete Feature Inventory · Specs · Acceptance Criteria  
Novabots Engineering  ·  2026  ·  Confidential

═══════════════════════════════════════════════════════════════════════════════

SECTION 1 — MODULE OVERVIEW & PRIORITY FRAMEWORK

═══════════════════════════════════════════════════════════════════════════════

│ PRIORITY │ DEFINITION                          │ RELEASE TARGET        │  
├──────────┼─────────────────────────────────────┼──────────────────────┤  
│ P0       │ Core MVP. Cannot launch without.    │ Q3 2026              │  
│ P1       │ High-value. Committed to later.     │ Q4 2026              │  
│ P2       │ Enhancement. Deferred if capacity.  │ Q1 2027              │  
└──────────┴─────────────────────────────────────┴──────────────────────┘

Feature Distribution by Module:

│ MODULE              │ P0   │ P1  │ P2  │ TOTAL │  
├─────────────────────┼──────┼─────┼─────┼───────┤  
│ Scope Clarity       │ 6    │ 2   │ 1   │ 9     │  
│ Scope Evolution     │ 5    │ 2   │ 1   │ 8     │  
│ Team Governance     │ 3    │ 2   │ 1   │ 6     │  
│ Intelligence Layer  │ 2    │ 4   │ 2   │ 8     │  
│ Platform & Auth     │ 4    │ 2   │ 1   │ 7     │  
├─────────────────────┼──────┼─────┼─────┼───────┤  
│ TOTAL               │ 20   │ 12  │ 6   │ 38    │  
└─────────────────────┴──────┴─────┴─────┴───────┘

═══════════════════════════════════════════════════════════════════════════════

MODULE 1: SCOPE CLARITY (Pre-Project Ambiguity Elimination)

═══════════════════════════════════════════════════════════════════════════════

FEAT-SC-001 │ P0 │ Scope Clarity Interview Engine (AI-Guided)

│ Feature ID         │ FEAT-SC-001                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As an agency owner, I want AI to ask my client  │  
│                    │ specific questions based on their project type, │  
│                    │ so my SOW has zero ambiguity before work starts.│  
│ Technical Impl.    │ FastAPI Claude API integration. Project type    │  
│                    │ classification (brand, web, logo, etc.).        │  
│                    │ Type-specific question library (20–30 Qs per    │  
│                    │ type). Client answers stored in project record. │  
│                    │ Questions served via portal form (async) or     │  
│                    │ generated as kickoff script.                    │  
│ Acceptance Crit.   │ • 5+ project types supported (brand, web, logo,│  
│                    │   print, packaging)                             │  
│                    │ • 20–30 questions per type (specific, not gen.) │  
│                    │ • Client answers in \<15 min (async form)        │  
│                    │ • All answers stored in project record          │  
│                    │ • Questions adapt based on client input         │  
│                    │   (conditional logic)                           │  
│                    │ • Agency can review and adjust questions        │  
│                    │   per-project                                   │  
│ Dependencies       │ None (standalone entry point)                   │  
│ Story Points       │ 8–10 SP                                         │  
│ Big Tech Pattern   │ Typeform conversational flow \+ Notion AI guide  │

FEAT-SC-002 │ P0 │ AI SOW Generator (Detailed Scope Clause Creation)

│ Feature ID         │ FEAT-SC-002                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As an agency owner, I want AI to generate a     │  
│                    │ detailed SOW from client interview answers,     │  
│                    │ with ZERO ambiguous language.                   │  
│ Technical Impl.    │ Claude API with tool\_use mode outputs: {        │  
│                    │ deliverables: \[{name, description, examples,    │  
│                    │ exclusions}\], exclusions: \[{item, reason}\],     │  
│                    │ revisions: {limit, scope}, timeline: {...},     │  
│                    │ payment\_terms: {...}                            │  
│                    │ }. Stored in sow\_document table. Agency         │  
│                    │ reviews in clause editor before activation.     │  
│ Acceptance Crit.   │ • Generated within 30 seconds                   │  
│                    │ • \>85% specificity on standard project types    │  
│                    │ • Each deliverable includes examples            │  
│                    │ • Exclusions explicitly listed (not vague)      │  
│                    │ • Revision language specific (e.g., "2 rounds   │  
│                    │   of revisions; each round \= 5 major changes")  │  
│                    │ • Agency can edit every clause before           │  
│                    │   activation                                    │  
│                    │ • Client reviews generated SOW                  │  
│ Dependencies       │ FEAT-SC-001                                     │  
│ Story Points       │ 13 SP                                           │  
│ Big Tech Pattern   │ Notion database import \+ DocuSign envelope      │

FEAT-SC-003 │ P0 │ Scope Meter Creation & Tracking

│ Feature ID         │ FEAT-SC-003                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As a client, I want to see exactly what's       │  
│                    │ included in my project via a visual meter so    │  
│                    │ there are no surprises about scope boundaries.  │  
│ Technical Impl.    │ Scope meter \= (deliverables\_complete/total\_     │  
│                    │ deliverables) \* 0.6 \+ (revisions\_used/limit)    │  
│                    │ \* 0.4. Rendered as horizontal progress bar.     │  
│                    │ Color: green (0–50%), amber (51–80%), red       │  
│                    │ (80%+). Supabase real-time updates. Both        │  
│                    │ agency and client views.                        │  
│ Acceptance Crit.   │ • Meter visible on every project page           │  
│                    │ • Color indicates urgency correctly              │  
│                    │ • Breakdowns: X/Y deliverables, X/Y revisions   │  
│                    │ • Updates in real-time (no page refresh)        │  
│                    │ • Hover tooltip shows detailed breakdown        │  
│                    │ • At 100%: Pulsing animation, banner appears    │  
│ Dependencies       │ FEAT-SC-002                                     │  
│ Story Points       │ 5 SP                                            │  
│ Big Tech Pattern   │ Linear progress indicators \+ Harvest burndown   │

FEAT-SC-004 │ P0 │ White-Label Client Portal Configuration

│ Feature ID         │ FEAT-SC-004                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As a studio lead, I want to configure the       │  
│                    │ client portal with my logo and brand colors so  │  
│                    │ clients see my brand, not ScopeIQ's.            │  
│ Technical Impl.    │ Logo stored in R2 (PNG/SVG, ≤2MB). CSS vars    │  
│                    │ injected server-side per workspace: \--primary,  │  
│                    │ \--secondary, \--font. Default URL via            │  
│                    │ Cloudflare subdomain. Custom domain via CNAME   │  
│                    │ \+ Cloudflare Tunnels (auto SSL). "Powered by    │  
│                    │ ScopeIQ" removed on Studio+ tiers via CSS       │  
│                    │ class.                                          │  
│ Acceptance Crit.   │ • Logo upload (PNG/SVG/JPG, ≤2MB)               │  
│                    │ • Live preview of branding changes              │  
│                    │ • Default subdomain active within 5 min         │  
│                    │ • Custom domain active within 5 min of DNS      │  
│                    │   propagation                                   │  
│                    │ • Zero ScopeIQ branding on paid plans           │  
│                    │ • Validated by CI screenshot test               │  
│ Dependencies       │ Cloudflare API, Supabase R2 storage             │  
│ Story Points       │ 10 SP                                           │  
│ Big Tech Pattern   │ HoneyBook client hub, Dubsado white-label       │

═══════════════════════════════════════════════════════════════════════════════

MODULE 2: SCOPE EVOLUTION (Mid-Project Collaborative Additions)

═══════════════════════════════════════════════════════════════════════════════

FEAT-SE-001 │ P0 │ Client Inbox (Primary Communication Channel)

│ Feature ID         │ FEAT-SE-001                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As a client, I want to submit all project       │  
│                    │ questions and requests through a single inbox   │  
│                    │ so the agency has visibility into everything.   │  
│ Technical Impl.    │ Portal textarea \+ submit button. Messages        │  
│                    │ stored in messages table. Threaded display      │  
│                    │ (iMessage-style layout). Agency responses       │  
│                    │ include in-scope/flagged badge. Email           │  
│                    │ fallback: Resend MX forwarding (backup only).   │  
│                    │ All messages logged before analysis.            │  
│ Acceptance Crit.   │ • Submit message in \<3 taps (mobile)            │  
│                    │ • Thread renders correctly at all widths        │  
│                    │ • Agency response badge (In Scope/Flagged)      │  
│                    │   visible within 5 seconds                      │  
│                    │ • Email fallback: Messages ingested \+ labeled   │  
│                    │   "via email"                                   │  
│                    │ • No message lost (all stored before analysis)  │  
│                    │ • Client onboarding email sent \<60 sec after    │  
│                    │   project creation                              │  
│ Dependencies       │ None (standalone)                               │  
│ Story Points       │ 10 SP                                           │  
│ Big Tech Pattern   │ Intercom Conversations \+ Linear Issue Inbox     │

FEAT-SE-002 │ P0 │ Scope Request Handler (Multi-Option Framework)

│ Feature ID         │ FEAT-SE-002                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As an agency owner, when a client requests      │  
│                    │ out-of-scope work, I want AI to draft 3 pricing │  
│                    │ options (not an accusation) so the client feels │  
│                    │ like we're solving a problem together.          │  
│ Technical Impl.    │ Client message ingested. FastAPI analyzes:      │  
│                    │ is\_in\_scope, common\_addition?, fair\_price?,     │  
│                    │ client\_history?. Claude generates 3 options:    │  
│                    │ {option\_a: {desc, price}, option\_b: {...},     │  
│                    │ option\_c: {...}}. Agency reviews drafts. Sends  │  
│                    │ to client via portal \+ email.                   │  
│ Acceptance Crit.   │ • 3 options drafted within 5 seconds            │  
│                    │ • Prices auto-calculated from rate card         │  
│                    │ • Each option has distinct value prop           │  
│                    │ • Tone: collaborative, not accusatory           │  
│                    │ • Agency can edit all options before sending    │  
│                    │ • Client feedback tracked in convo thread       │  
│ Dependencies       │ FEAT-SE-001, FEAT-SC-003 (SOW context)          │  
│ Story Points       │ 13 SP                                           │  
│ Big Tech Pattern   │ PandaDoc smart fields \+ Bonsai proposals        │

FEAT-SE-003 │ P0 │ AI Negotiation Drafting

│ Feature ID         │ FEAT-SE-003                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As an agency owner, if a client pushes back on  │  
│                    │ pricing, I want AI to suggest counter-offers   │  
│                    │ based on their history so we can close the deal │  
│                    │ without endless email threads.                  │  
│ Technical Impl.    │ Client objection → AI predicts response options │  
│                    │ based on client history. Drafts 2 counter-      │  
│                    │ offers with rationale. Agency reviews \+ sends   │  
│                    │ (or edits). System tracks negotiation cycles.   │  
│                    │ Stops after 3 rounds (escalate to human).       │  
│ Acceptance Crit.   │ • Counter-offers drafted within 3 seconds       │  
│                    │ • 2 distinct options per objection              │  
│                    │ • Rationale shown for each option               │  
│                    │ • Based on client history (if available)        │  
│                    │ • Agency can edit/customize before sending      │  
│                    │ • Negotiation cycle logged (full audit trail)   │  
│                    │ • Stops after 3 rounds, escalates               │  
│ Dependencies       │ FEAT-SE-002, client\_behavior\_model              │  
│ Story Points       │ 10 SP                                           │  
│ Big Tech Pattern   │ Intercom Copilot \+ Front AI                     │

FEAT-SE-004 │ P0 │ Change Order Generation & Automation

│ Feature ID         │ FEAT-SE-004                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As an agency owner, when a client accepts a     │  
│                    │ scope addition, I want a professional change    │  
│                    │ order generated automatically so every scope    │  
│                    │ expansion is documented.                        │  
│ Technical Impl.    │ Client accepts option → BullMQ job triggered.   │  
│                    │ FastAPI generates CO: {title, description,      │  
│                    │ hours, price, timeline}. Stored in              │  
│                    │ change\_orders table (status: draft). Email      │  
│                    │ sent with Accept/Decline links (token auth).    │  
│                    │ Client types name \= signature. Stripe charge.   │  
│                    │ SOW updated atomically.                         │  
│ Acceptance Crit.   │ • Generated within 5 seconds (p95)              │  
│                    │ • All fields editable before sending            │  
│                    │ • Pricing auto-filled from rate card            │  
│                    │ • Client can accept via email or portal         │  
│                    │ • Typed name \+ timestamp \= legal signature      │  
│                    │ • Accepted CO updates SOW in same transaction    │  
│                    │ • PDF generated server-side on acceptance       │  
│                    │ • Full CO history per project                   │  
│ Dependencies       │ FEAT-SE-002, Stripe integration, PDF libs       │  
│ Story Points       │ 13 SP                                           │  
│ Big Tech Pattern   │ DocuSign \+ PandaDoc envelope workflows          │

═══════════════════════════════════════════════════════════════════════════════

MODULE 3: TEAM GOVERNANCE (Consistency & Accountability)

═══════════════════════════════════════════════════════════════════════════════

FEAT-TG-001 │ P0 │ Approval Workflow Routing (Confidence-Based)

│ Feature ID         │ FEAT-TG-001                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As a team lead, I want scope decisions routed   │  
│                    │ based on confidence level so junior staff don't │  
│                    │ give away scope without oversight.              │  
│ Technical Impl.    │ Flag confidence scoring: \>85% (auto-approve),   │  
│                    │ 60–85% (senior review), \<60% (founder).         │  
│                    │ Routing via BullMQ job: flags with approval     │  
│                    │ requirement routed to user inbox. 2-min SLA     │  
│                    │ on approvals. Escalate if overdue.              │  
│ Acceptance Crit.   │ • Confidence threshold configurable             │  
│                    │ • Auto-approval for high-confidence flags       │  
│                    │ • Route to team member based on role            │  
│                    │ • 2-minute approval SLA enforced                │  
│                    │ • Escalation if approval overdue                │  
│                    │ • Full audit: who approved, when, confidence    │  
│ Dependencies       │ FEAT-SE-002                                     │  
│ Story Points       │ 8 SP                                            │  
│ Big Tech Pattern   │ Linear issue triage \+ GitHub code review        │

FEAT-TG-002 │ P0 │ Decision Consistency Tracking

│ Feature ID         │ FEAT-TG-002                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P0 — Must Have                                  │  
│ User Story         │ As a founder, I want to see which team members  │  
│                    │ are too lenient or too strict on scope so I can │  
│                    │ provide targeted feedback.                      │  
│ Technical Impl.    │ Every approval decision tracked: team\_member,   │  
│                    │ flag\_id, decision (approved/rejected),          │  
│                    │ outcome (was the decision correct?). ML model:  │  
│                    │ member\_accuracy\_score. Visualized on dashboard. │  
│ Acceptance Crit.   │ • Per-member approval accuracy tracked          │  
│                    │ • Trends: improving/declining                   │  
│                    │ • Outliers flagged (too lenient/strict)         │  
│                    │ • Recommendations for training                  │  
│                    │ • Accuracy visible on dashboard                 │  
│ Dependencies       │ FEAT-TG-001                                     │  
│ Story Points       │ 5 SP                                            │  
│ Big Tech Pattern   │ Jira workflow analytics                         │

═══════════════════════════════════════════════════════════════════════════════

MODULE 4: INTELLIGENCE LAYER (Learning & Predictions)

═══════════════════════════════════════════════════════════════════════════════

FEAT-IL-001 │ P1 │ Client Behavior Model (Per-Client Predictions)

│ Feature ID         │ FEAT-IL-001                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P1 — Should Have                                │  
│ User Story         │ As an account manager, I want AI to predict     │  
│                    │ this client's CO acceptance rate and optimal    │  
│                    │ price point based on their history, so I can    │  
│                    │ close deals faster.                             │  
│ Technical Impl.    │ ML model trained on: client response times,     │  
│                    │ negotiation patterns, price acceptance rates,   │  
│                    │ communication preferences. Output: {accept\_prob: │  
│                    │ 0.85, optimal\_price: 1200, negotiation\_rounds:  │  
│                    │ 1.5, prefer\_channel: email}. Displayed on       │  
│                    │ dashboard when CO drafted.                      │  
│ Acceptance Crit.   │ • Prediction accuracy \>75% on 50+ customers     │  
│                    │ • Confidence intervals shown                    │  
│                    │ • Per-client model trains on interaction        │  
│                    │ • Displayed when drafting CO                    │  
│                    │ • Predictions improve with each interaction     │  
│ Dependencies       │ FEAT-SE-002, FEAT-SE-003                        │  
│ Story Points       │ 13 SP                                           │  
│ Big Tech Pattern   │ Stripe Radar predictions \+ Intercom AI          │

FEAT-IL-002 │ P1 │ Retainer Optimization Recommendations

│ Feature ID         │ FEAT-IL-002                                     │  
├────────────────────┼─────────────────────────────────────────────────┤  
│ Priority           │ P1 — Should Have                                │  
│ User Story         │ As a freelancer, I want to know when a retainer │  
│                    │ client consistently requests out-of-scope work, │  
│                    │ so I can increase the retainer instead of       │  
│                    │ fighting monthly.                               │  
│ Technical Impl.    │ Track retainer client monthly out-of-scope      │  
│                    │ requests. Aggregate 3-month trend. System       │  
│                    │ triggers recommendation: "Client ABC requests   │  
│                    │ $1,500/mo extra work. Increase retainer by $X   │  
│                    │ and include scope explicitly." One-click draft  │  
│                    │ retainer renegotiation.                         │  
│ Acceptance Crit.   │ • Tracks monthly OOS requests per retainer      │  
│                    │ • 3-month trend calculated                      │  
│                    │ • Recommendation shows estimated new retainer   │  
│                    │ • One-click draft renegotiation email           │  
│                    │ • Historical renegotiations tracked             │  
│ Dependencies       │ FEAT-SE-002, Stripe integration                 │  
│ Story Points       │ 10 SP                                           │  
│ Big Tech Pattern   │ HubSpot deal health scoring                     │

═══════════════════════════════════════════════════════════════════════════════

END OF FEATURES  
