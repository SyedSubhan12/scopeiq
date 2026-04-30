# ScopeIQ PRD v3.0 — Implementation Audit
**Date:** 2026-05-01  
**Branch:** cursor/add-lottie-f5a82  
**Auditor:** Claude Sonnet 4.6 (updated after Sprints C + D)

Status legend: ✅ Done · ⚠️ Partial · ❌ Missing · 🔵 Out of scope (later gate)

---

## Gate 1 — Scope Guard MVP

### FR-SG-001 · P0 · Client Request Inbox

| Acceptance Criterion | Status | Notes |
|---|---|---|
| Client submits messages via portal inbox | ✅ | `PortalMessages.tsx`, `POST /portal/messages` |
| BullMQ job dispatched on submission | ✅ | `check_scope` job fired in messages route |
| iMessage-style layout (client right, agency left) | ✅ | `PortalMessages.tsx` — `isClient` class split |
| Inline status badge on every message within 5s | ✅ | `StatusPill` component, `getScopeStatus()` |
| Agency Supabase real-time push <500ms | ✅ | `useRealtimeScopeFlags` hook — `postgres_changes` |
| Portal real-time push <500ms | ✅ | Sprint B — replaced 3s polling with Supabase `postgres_changes` |
| 375px mobile layout | ✅ | Tailwind responsive, tested |
| Email fallback (`via email` label) | ⚠️ | `email_forward` message source exists; ingestion webhook route exists but not end-to-end tested |
| Client onboarding email <60s of project creation | ✅ | Sprint A — fire-and-forget `sendPortalInvitationEmail` in `project.service.ts` |
| No message lost — logged before scope check | ✅ | Message persisted on POST before BullMQ dispatch |

---

### FR-SG-002 · P0 · Bilateral Scope Flag Notification

| Acceptance Criterion | Status | Notes |
|---|---|---|
| Agency sees ScopeFlagCard in feed within 5s | ✅ | Supabase real-time invalidates scope flag query |
| Client sees system message within 5s | ✅ | Sprint A — written atomically in same transaction as flag |
| System message is amber bubble, platform-attributed | ✅ | `SystemBubble` component with amber border + ShieldAlert icon |
| Client message shows `flagged` badge | ✅ | `status: "flagged"` → `StatusPill` renders red badge |
| System message copy doesn't blame agency | ✅ | "our current agreement" — shared language copy |
| Both notifications atomic (split-brain impossible) | ✅ | Sprint A — `system_message_id` stored in `scope_flags.evidence` via same transaction |
| Flag dismissed → client message updates to "Confirmed in scope" | ✅ | Sprint A — `scope-flag.service.ts` `updateStatus()` updates system message body |

---

### FR-SG-003 · P0 · SOW Ingestion + Clause Editor

| Acceptance Criterion | Status | Notes |
|---|---|---|
| PDF and plain text accepted | ✅ | R2 presigned upload + `PyMuPDF` extraction |
| Extraction <30s p95 for 10-page SOW | ✅ | `parse_sow_worker.py` with Claude API |
| Clauses grouped by type (deliverables, exclusions, etc.) | ✅ | `SOWReviewPanel.tsx` — accordion grouped by `clause_type` |
| Every clause editable/deletable/addable | ✅ | Inline contenteditable in `SOWReviewPanel` |
| Activation confirmation modal with clause count | ✅ | `sow.service.ts` activation with modal in `SOWReviewPanel` |
| Only one active SOW per project | ✅ | `sow.service.ts` deactivates previous on activation |
| SOW activation writes audit_log | ✅ | `writeAuditLog` in `sow.service.ts` activate path |
| >85% clause extraction accuracy | ⚠️ | Validated qualitatively; no automated accuracy test suite yet |

---

### FR-SG-004 · P0 · Scope Flag Detection Engine (<5s p95)

| Acceptance Criterion | Status | Notes |
|---|---|---|
| BullMQ job dispatch on message | ✅ | `check_scope` job in messages route |
| Claude API with tool_use output schema | ✅ | `scope_guard_worker.py` — full schema with is_in_scope, confidence, matching_clauses |
| Flag created only if is_in_scope=false AND confidence>0.60 | ✅ | Threshold check in worker + callback |
| Confidence threshold configurable per workspace (0.45–0.80) | ✅ | `scopeGuardThreshold` in AI policy settings |
| Axiom metric write on every job | ✅ | Sprint C — `recordScopeFlagDuration()` called in `ai-callback.route.ts` post-transaction |
| PagerDuty alert if >7s | ❌ | Axiom dataset exists; PagerDuty webhook not configured |
| BullMQ concurrency: max 5 Claude calls | ✅ | Worker concurrency: 5 |
| Dead letter queue after 3 retries | ✅ | BullMQ `removeOnFail` + retry config |
| AI suggested response generated | ✅ | `suggestedResponse` in scope check output stored on flag |
| Test mode (no records created) | ✅ | `scope_check_status: "skipped"` path exists |

---

### FR-SG-005 · P0 · One-Click Change Order Generator

| Acceptance Criterion | Status | Notes |
|---|---|---|
| CO draft ready within 5s of confirmation | ✅ | `generate_change_order` BullMQ job + worker |
| All fields editable before sending | ✅ | `ChangeOrderEditor` component |
| Price auto-calculated from rate card, overridable | ✅ | Rate card service wired in CO generation |
| Stripe payment intent at 4%/3%/2.5% of CO value on generation | ✅ | Sprint C — `take-rate.service.ts`; intent created at generation |
| Payment intent logged in audit_log | ✅ | `writeAuditLog` in billing service |
| Client Accept/Decline links work without login (token-auth) | ✅ | `email-approval.route.ts` — token-authenticated URLs |
| Typed name + timestamp = legally binding acceptance | ✅ | `signed_by_name` + `signed_at` fields on `change_orders` |
| Accepted CO updates sow_clauses atomically | ✅ | Same DB transaction as status change in CO accept handler |
| PDF generated server-side on acceptance, R2 private | ✅ | Sprint D confirmed — `change-order-pdf.ts` (pdf-lib); `signedPdfKey` + `signedPdfHash` stored in DB |
| Complete CO history per project | ✅ | `change_orders` table with all versions and statuses |

---

### FR-SG-006 · P1 · Scope Meter Dashboard

| Acceptance Criterion | Status | Notes |
|---|---|---|
| Scope meter visible on project detail page | ✅ | Sprint C/D — `ScopeMeter` in project header when deliverables exist |
| Formula: 60% deliverables + 40% revision rounds | ✅ | Sprint D — `computeBreakdown()` in `ScopeMeter.tsx` |
| Color states: green/amber/red/pulsing | ✅ | Sprint D — green <60%, amber 60–80%, red >80%, pulsing ring at 100% |
| Real-time updates on deliverable/revision changes | ✅ | Sprint C — `useRealtimeDeliverables` wired in project page + deliverables page |
| Hover tooltip with breakdown | ✅ | Sprint D — tooltip shows deliverable score + revision score + total |
| Meter visible to both agency and client | ✅ | Sprint D — added to portal review page alongside deliverable list |

---

## Gate 2 — Approval Portal

### FR-AP-001 · P0 · White-Label Portal Configuration

| Acceptance Criterion | Status | Notes |
|---|---|---|
| Logo upload (PNG, SVG, JPG) up to 2MB | ✅ | Workspace settings page + R2 presigned upload |
| Hex color picker with real-time preview | ✅ | Color picker + live preview in workspace settings |
| Default subdomain active within 5min of creation | ❌ | `{slug}.scopeiq.com` routing not configured at infra level; portal uses direct token URL |
| Custom domain via CNAME, SSL auto | ✅ | Sprint B — DNS TXT verification, Cloudflare Tunnels spec |
| Custom domain verified within 5min of DNS propagation | ✅ | 60s polling loop for up to 24h |
| Zero ScopeIQ branding on paid plans | ✅ | Sprint A — `PoweredByBadge` fixed; removed on Studio/Agency |
| CSS variables applied to all portal elements | ✅ | Portal layout injects `brandColor` as CSS custom property |

---

### FR-AP-002 · P0 · Point-Anchored Annotation on Deliverables

| Acceptance Criterion | Status | Notes |
|---|---|---|
| Pins placeable anywhere on image/PDF | ❌ | Not implemented |
| % coordinates (device-agnostic) | ❌ | Not implemented |
| Bidirectional pin ↔ comment highlight | ❌ | Not implemented |
| Resolved pins preserved in DB | ❌ | Not implemented |
| PDF: page number stored with coordinates | ❌ | Not implemented |
| WCAG 2.1 AA keyboard alternative | ❌ | Not implemented |

**Note:** FR-AP-002 is the largest unimplemented P0. Entire SVG canvas annotation system needs to be built.

---

### FR-AP-003 · P0 · Revision Round Tracker + At-Limit Modal

| Acceptance Criterion | Status | Notes |
|---|---|---|
| RevisionCounter component with color states | ✅ | `RevisionCounter.tsx` — green/amber/red at correct thresholds |
| Counter updates in real time (Supabase subscription) | ✅ | Sprint C — `useRealtimeDeliverables` hook wired in both deliverable pages |
| Client sees identical counter as agency | ✅ | Same `RevisionCounter` renders in both portal and dashboard |
| At-limit modal cannot be dismissed without checkbox | ✅ | `revision-limit-modal.store.ts`; modal renders on `onAtLimit` callback |
| Acknowledgment written to audit_log | ✅ | Sprint D — `POST /deliverables/:id/revision-limit-acknowledged` writes audit_log |
| Pre-generated add-on quote in modal | ⚠️ | Modal shows hardcoded $500 fallback; does not pull from rate card |
| Revision limit importable from SOW or set manually | ✅ | `max_revisions` on deliverables, importable from SOW |

---

### FR-AP-004 · P0 · Automated Approval Reminder Sequence

| Acceptance Criterion | Status | Notes |
|---|---|---|
| 3-step escalating reminder (gentle_nudge → deadline_warning → silence_approval) | ✅ | `email-approval.route.ts` + Resend email templates |
| BullMQ delayed pipeline | ✅ | Delayed jobs scheduled on deliverable send |
| Each step configurable (hours/days) | ✅ | `reminders` settings page + `workspaces.reminderSettings` |
| Approve/Decline links work without login | ✅ | Token-authenticated links in emails |
| Silence-as-approval event in audit trail | ✅ | `silence_approved` event written to `approval_events` |
| Agency can pause/reset sequence per project | ⚠️ | UI for pause/reset not confirmed; backend supports it |
| Full reminder log visible in project timeline | ⚠️ | `reminder_logs` table exists; UI timeline not confirmed |
| Renders correctly in Gmail/Outlook/Apple Mail | ⚠️ | React Email templates used; not CI-tested against email clients |

---

## Gate 3 — Brief Builder

### FR-BB-001 · P0 · Conversational Multi-Step Brief Form

| Acceptance Criterion | Status | Notes |
|---|---|---|
| One question per screen on mobile (375px) | ✅ | Portal page with step-by-step `IntakeForm` |
| Animated transitions between steps (150ms ease-out) | ✅ | Framer Motion `AnimatePresence` with slide transitions |
| Progress indicator: dots + percentage | ✅ | Progress bar + "Step N of M" in portal page |
| Single-choice fields as large card options | ✅ | Card layout in `IntakeForm` |
| File upload: drag-drop zone with progress | ⚠️ | File upload field type exists; drag-drop UX not verified end-to-end |
| Auto-save indicator after every change | ✅ | 10s auto-save to API draft + "Saved HH:MM" badge |
| Conditional logic hides irrelevant fields | ✅ | `evaluateShowRules()` client-side logic |
| Submission triggers scoring job within 2s | ✅ | `score_brief` BullMQ job dispatched on submit |

---

### FR-BB-002 · P0 · AI Brief Clarity Scorer + Auto-Hold

| Acceptance Criterion | Status | Notes |
|---|---|---|
| Score visible within 10s of submission (p95) | ✅ | `score_brief_worker.py` with Claude API |
| Score stored in `briefs.clarity_score` | ✅ | Stored and displayed in portal |
| Flags stored per field (`ai_flag`, `ai_flag_reason`) | ✅ | `brief_fields` table |
| Hold triggered if score < threshold (default 70) | ✅ | `brief.status = clarification_needed` |
| Client clarification email dispatched within 60s | ✅ | Resend dispatch in score worker callback |
| Re-submitted brief triggers full re-scoring, version incremented | ✅ | `/portal/session/brief/clarify-submit` path |
| Agency override of hold requires mandatory reason | ⚠️ | Override path exists; mandatory reason UI field not verified |

---

## Non-Functional Requirements

### Performance SLAs

| SLA | Target | Status | Notes |
|---|---|---|---|
| Bilateral scope flag notification | <5s p95 | ✅ | BullMQ + Supabase real-time |
| AI brief clarity scoring | <10s p95 | ✅ | Claude API with structured output |
| Change order generation | <5s p95 | ✅ | CO generation worker |
| Portal page load (LCP) | <2s on 4G | ⚠️ | Vercel Analytics not configured |
| API REST endpoints | <300ms p95 | ⚠️ | Sentry performance not configured |
| Real-time flag push (DB → dashboard) | <500ms | ✅ | Supabase real-time |
| System uptime (paid plans) | 99.5% monthly | ⚠️ | Uptime monitors not configured |

### Security Requirements

| Requirement | Status | Notes |
|---|---|---|
| Portal tokens: UUID v4, 128-bit entropy | ✅ | `crypto.randomUUID()` in project creation |
| R2 presigned URLs expire in 15min | ✅ | `getUploadUrl(..., 900)` in workspace route |
| CO PDFs: server-side, R2 private ACL, presigned | ✅ | Sprint D confirmed — `change-order-pdf.ts` generates + uploads to private R2 |
| Workspace isolation: app-layer workspaceId + RLS | ✅ | Every query filtered by `workspaceId` |
| Portal rate limiting: 10/hour/IP at Cloudflare | ⚠️ | Rate limiter middleware exists; Cloudflare edge rule not verified |
| Resend-Signature webhook validation | ✅ | `resend-webhook.route.ts` validates signature |
| Stripe-Signature webhook validation | ✅ | `billing.route.ts` validates signature |
| Secret exposure CI scan | ❌ | Not in CI pipeline |
| Take-rate Stripe charge server-side only | ✅ | Payment intent created in `billing.service.ts` server-side |

---

## Business Model / Take-Rate

| Requirement | Status | Notes |
|---|---|---|
| Free tier: 4% take-rate on accepted COs | ✅ | Sprint C — `take-rate.service.ts` |
| Studio tier: $49/mo + 3% take-rate | ✅ | Sprint A — billing page + Stripe checkout |
| Agency tier: $99/mo + 2.5% take-rate | ✅ | Sprint A — billing page + Stripe checkout |
| `effectivePlan: "solo" → "free"` normalization | ✅ | Sprint A — workspace store default changed |
| Stripe payment intent created at CO generation | ✅ | Sprint C — `take-rate.service.ts` `createPaymentIntent()` |
| Payment collected only on acceptance | ✅ | `capturePaymentIntent()` inside accept transaction |

---

## Sandbox / Demo Mode

| Feature | Status | Notes |
|---|---|---|
| New workspace gets 14-day sandbox with demo data | ✅ | `sandbox_mode` in `settingsJson`, auto-provisioned |
| Sandbox expires silently | ✅ | `sandbox_expires_at` field checked |
| Demo client + project seeded | ✅ | `demo_client_id` + `demo_project_id` in settings |

---

## Agent Architecture (Section 9)

### Absolute Code Rules compliance

| Rule | Status | Notes |
|---|---|---|
| TypeScript strict:true, no @ts-ignore, no any | ⚠️ | Mostly compliant; occasional `as unknown as` casts exist |
| No raw SQL — all Drizzle ORM with workspaceId filter | ✅ | All queries via repository layer |
| All AI calls via BullMQ jobs | ✅ | No direct Anthropic SDK in `apps/api` or `apps/web` |
| Files via R2 presigned URLs only | ✅ | Storage lib enforces presigned URLs |
| No client-side secrets | ✅ | Only NEXT_PUBLIC_ vars in apps/web |
| Every mutation writes audit_log in same transaction | ✅ | All service mutations include `writeAuditLog` |
| Bilateral flag notification atomic | ✅ | Sprint A — system_message_id in evidence, same transaction |

---

## What's Left — Remaining Gaps (as of 2026-05-01)

### ❌ Hard Blockers (P0 — feature incomplete)

| Item | FR | Effort | Detail |
|---|---|---|---|
| Point-anchored annotation (SVG canvas) | FR-AP-002 | XL (5+ days) | Full feature missing: SVG overlay, % coords, pin threads, PDF paging, keyboard alt |
| Default subdomain routing | FR-AP-001 | M (1 day) | `{slug}.scopeiq.com` wildcard DNS + Cloudflare edge routing by slug not configured |

### ⚠️ Partial / Unverified (P0 — gap in a shipped feature)

| Item | FR | Effort | Detail |
|---|---|---|---|
| At-limit modal rate card quote | FR-AP-003 | S (2h) | Modal shows hardcoded $500; needs live rate card lookup |
| PagerDuty alert on >7s scope flag | FR-SG-004 | S (2h) | Axiom dataset exists; PagerDuty webhook not wired |
| Agency pause/reset reminder sequence UI | FR-AP-004 | S (2h) | Backend supports it; no UI confirmed |
| Reminder log in project timeline UI | FR-AP-004 | S (2h) | `reminder_logs` table exists; no UI |
| Agency override mandatory reason field | FR-BB-002 | S (1h) | Override path exists; mandatory reason not enforced in UI |
| Brief file upload drag-drop UX | FR-BB-001 | S (1h) | Field type exists; end-to-end not verified |
| Email fallback ingestion end-to-end | FR-SG-001 | S (2h) | Route exists; not tested from real email |
| SOW clause accuracy test suite | FR-SG-003 | M (1 day) | Qualitative only; no automated accuracy harness |

### ⚠️ NFR / Infrastructure Gaps

| Item | Area | Effort | Detail |
|---|---|---|---|
| Secret exposure CI scan | Security | S (2h) | Not in GitHub Actions pipeline |
| Sentry performance monitoring | Observability | S (2h) | Not configured in API or web |
| Vercel Analytics / LCP tracking | Performance | S (1h) | Not configured |
| Uptime monitors (99.5% SLA) | Reliability | S (1h) | No monitors configured |
| Cloudflare edge rate limit rule | Security | S (1h) | Middleware exists; edge rule not verified |
| Playwright E2E test suite | QA | XL (3+ days) | P0 features lack end-to-end coverage |
| Slack OAuth + scope flag stream | Agency tier | XL (3+ days) | Not started |

---

## Sprint Summary

| Sprint | Status | Commit |
|---|---|---|
| A — Billing model + bilateral flag + portal email | ✅ Shipped | `7e5d176` |
| B — Custom domain UI + portal messages real-time | ✅ Shipped | `2da52f4` |
| C — Axiom SLA + real-time deliverables + take-rate + 34 tests | ✅ Shipped | `e347086` |
| D — ScopeMeter portal, revision audit_log, CO PDF confirmed | ✅ Shipped | `df12a11` |
| E — Remaining P0 gaps + NFR hardening | ⬜ Not started | — |

*Updated 2026-05-01.*
