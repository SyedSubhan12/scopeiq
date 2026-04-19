# ScopeIQ Redesign Specification
**AGENT-UX Output · UI/UX Design System & Screen Redesigns**
**Date:** 2026-04-10 | Inspired by: Figma, Stripe Radar, Intercom, PandaDoc, HoneyBook, Linear

---

## Design System Tokens (Authoritative)

```css
/* Primary Brand */
--primary-teal:       #0F6E56;   /* Buttons, links, active nav, accent borders */
--primary-teal-mid:   #1D9E75;   /* Hover states, badges, tag backgrounds */
--primary-teal-light: #E1F5EE;   /* Section backgrounds, info banners */

/* Status Colors */
--status-red:         #DC2626;   /* Scope flags, errors, critical alerts */
--status-amber:       #D97706;   /* Warnings, approaching limits, pending */
--status-green:       #059669;   /* Approvals, completions, success */
--status-blue:        #2563EB;   /* Informational, in-progress */

/* Text */
--text-primary:       #0D1B2A;   /* Headings, labels, high-emphasis */
--text-secondary:     #4B5563;   /* Body text, descriptions */
--text-muted:         #9CA3AF;   /* Placeholders, timestamps, metadata */

/* Surfaces */
--surface-white:      #FFFFFF;   /* Card + modal backgrounds */
--surface-subtle:     #F8FAFC;   /* Page backgrounds, alternate row fills */

/* Typography */
/* UI: Inter | Code/IDs: JetBrains Mono */
```

**Rule:** All component colors MUST use `rgb(var(--token-name))`. No hardcoded hex, no Tailwind palette classes (`bg-red-100`, `text-emerald-600`). Enforce via ESLint.

---

## Client Portal Redesign

### Screen CP-01 — Portal Entry
**Inspired by:** HoneyBook Client Hub, Dubsado Portals, Notion Guest Pages

**Current state:** Basic centered card with agency logo + CSS vars
**Target state:** Full-bleed branded experience

```
┌─────────────────────────────────────────────────────────────┐
│  [Full-bleed gradient header using --primary CSS var]        │
│                                                              │
│         [Agency Logo — 120px wide, centered]                 │
│         [Project Name — 24px Inter SemiBold, white]          │
│         [Client Name — 16px Inter Regular, white/80%]        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ● Brief ──── ○ Review ──── ○ Approved               │  │
│  │              Project Phase Progress                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
│                                                              │
│            [Main content area — white bg]                    │
│                                                              │
```

**Implementation notes:**
- Header: `style={{ background: 'linear-gradient(135deg, rgb(var(--primary-teal)) 0%, rgb(var(--primary-teal-mid)) 100%)' }}`
- Framer Motion entrance: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}`
- Phase progress: 3 dots connected by line — filled dot = complete, outlined = future
- Mobile: Full-screen brand splash, CTA button before entering form
- Dark mode: CSS vars adapt automatically if defined with `prefers-color-scheme`
- No ScopeIQ branding on Studio+ plans (plan-gated CSS class)

---

### Screen CP-02 — Brief Submission Flow
**Inspired by:** Typeform (conversational), Tally (clean), Notion Forms (minimal)

**Current state:** Paginated form, multiple questions per page
**Target state:** One question per screen on mobile (conversational)

```
Mobile (375px):
┌─────────────────────────────────┐
│  [Agency Logo — small, top-left] │
│  Step 2 of 5  ●●○○○  40%        │
│                                  │
│  What are your project goals?    │
│  [Large 18px question text]      │
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │  [Answer field]          │   │
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  [Autosave indicator: ✓ Saved]  │
│                                  │
│  [Previous]    [Continue →]      │
│                        [primary] │
└─────────────────────────────────┘
```

**Component specs:**
- Progress: Discrete step dots + percentage text (not just bar)
- Question text: `text-2xl font-semibold text-[rgb(var(--text-primary))]` at `>= 18px`
- Transitions between questions: `slide left 150ms ease-out`
- Single-choice: Large card options `min-h-[56px] rounded-xl border-2` with check-on-select
- Multi-choice: Checkbox cards with visual fill state on selection
- Date field: Native picker styled with brand primary color
- File upload: Drag-and-drop zone with file type icon preview, progress bar
- Error state: `border-[rgb(var(--status-red))]` + helper text below field
- Auto-save: Debounced 500ms, subtle badge `"✓ Saved"` bottom-right
- Review step before submit: Summary of all answers, editable

---

### Screen CP-03 — Deliverable Review
**Inspired by:** Figma comment mode, Markup.io, Frame.io video review

**Current state:** Split-pane viewer + feedback panel (static width)
**Target state:** Full-width viewer with sliding overlay panel

```
Desktop (1440px):
┌───────────────────────────────────────────────┬──────────────┐
│                                               │  FEEDBACK    │
│  [Full-width deliverable viewer]              │  ─────────── │
│                                               │  ① Pin 1     │
│  ①  ②                                        │  Comment...  │
│         ③                                     │  [Resolve]   │
│                                               │  ─────────── │
│  [Sticky header: Revision 2 of 3 ██████░ 67%]│  ② Pin 2     │
│                                               │  ...         │
│  [Approve ✓]  [Request Changes ↩]            │              │
└───────────────────────────────────────────────┴──────────────┘

Mobile (375px):
┌───────────────────────────────────────┐
│  [Full-width viewer]                  │
│                                       │
│  ①  ②                               │
│                                       │
│  [▲ Feedback (3 pins)]               │  ← Bottom sheet trigger
└───────────────────────────────────────┘
[Bottom sheet slides up from bottom — 70% screen height]
[Feedback list with resolve actions]
```

**Pin design (Figma-style):**
```tsx
// Numbered circles — 24×24px, filled, white number
<div
  className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 
             cursor-pointer items-center justify-center rounded-full 
             bg-[rgb(var(--primary-teal))] text-xs font-bold text-white
             shadow-md transition-transform hover:scale-110"
  style={{ left: `${pin.xPos}%`, top: `${pin.yPos}%` }}
  onClick={() => setActivePin(pin.id)}
>
  {pin.number}
</div>
```

**Crosshair cursor for new pin placement:**
```tsx
// On annotation mode active:
<div
  className="relative"
  style={{ cursor: annotationMode ? 'crosshair' : 'default' }}
  onClick={handleCanvasClick}
>
```

**Revision counter urgency states:**
```tsx
const revisionColor = useMemo(() => {
  const ratio = currentRound / maxRevisions;
  if (ratio < 0.67) return 'var(--status-green)';
  if (ratio < 1.0)  return 'var(--status-amber)';
  return 'var(--status-red)';
}, [currentRound, maxRevisions]);
```

**At-limit modal:** Blurred backdrop `backdrop-blur-sm`, cannot scroll behind, centered dialog.

---

### Screen CP-04 — Change Order Review
**Inspired by:** PandaDoc, DocuSign, HelloSign, Stripe payment confirmation

**Current state:** Form-like display with typed name
**Target state:** Document-style layout feeling like a real contract

```
┌─────────────────────────────────────────────────────────────┐
│  [Agency Logo]          CHANGE ORDER                        │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Issued to: [Client Name]          Date: [Date]             │
│  Project: [Project Name]           CO #: [ID]               │
│                                                              │
│  SCOPE OF ADDITIONAL WORK                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ "[Work description — verbatim from AI, editable by   │  │
│  │   agency before sending]"                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  PRICING                                                     │
│  ┌────────────────┬───────┬──────────┬──────────────────┐  │
│  │ Service        │ Hours │ Rate     │ Total            │  │
│  ├────────────────┼───────┼──────────┼──────────────────┤  │
│  │ [Item 1]       │ 8h    │ $150/hr  │ $1,200           │  │
│  ├────────────────┴───────┴──────────┼──────────────────┤  │
│  │                        TOTAL      │ $1,200           │  │
│  └───────────────────────────────────┴──────────────────┘  │
│                                                              │
│  ┌─ TIMELINE IMPACT ─────────────────────────────────────┐ │
│  │ ⚠ This work extends delivery by approximately 5 days  │ │
│  └────────────────────────────────────────────────────────┘ │
│                      (amber background)                      │
│                                                              │
│  ACCEPTANCE                                                  │
│  By typing your full name below, you agree to authorize      │
│  the additional work and associated cost.                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Type your full name here...                          │  │
│  │                                    _ _ _ _ _ _ _ _  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Accept & Authorize]  [← Decline]                          │
│  (disabled until name entered)  (triggers reason modal)     │
└─────────────────────────────────────────────────────────────┘
```

**Accept button activation:**
```tsx
<Button
  disabled={!signatureName.trim()}
  onClick={handleAccept}
  className="bg-[rgb(var(--status-green))] disabled:opacity-40"
>
  Accept & Authorize
</Button>
```

**Post-acceptance:** Animated success state + PDF download button.

---

## Agency Dashboard Redesign

### Dashboard Overview
**Inspired by:** Linear home, Stripe Dashboard, Intercom Inbox

```
┌─────────────────────────────────────────────────────────────┐
│ Good morning, James ☀                                       │
│ ─────────────────────────────────────────────────────────── │
│ [🔴 Alert banner: 3 scope flags need your attention →]      │
│                                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│ │  Active  │ │ Awaiting │ │  Pending │ │     MRR      │   │
│ │Projects  │ │ Approval │ │  Flags   │ │              │   │
│ │    12    │ │    3     │ │  🔴 5   │ │  $18,400/mo  │   │
│ │ [chart]  │ │ [chart]  │ │ [chart]  │ │  [chart]     │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                                                              │
│ SCOPE FLAGS                      UPCOMING DEADLINES         │
│ [ScopeFlagCard #1 — HIGH]        ┌────────────────────────┐ │
│ [ScopeFlagCard #2 — MEDIUM]      │ Project A — 2 days     │ │
│ [ScopeFlagCard #3 — LOW]         │ Project B — 5 days     │ │
│ [View all flags →]               │ Project C — 8 days     │ │
│                                  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Greeting:** `Good morning/afternoon/evening, [firstName]` based on `new Date().getHours()`

**KPI cards with sparkline trend:**
```tsx
import { LineChart, Line, ResponsiveContainer } from 'recharts';

<MetricCard
  label="Active Projects"
  value={12}
  trend={+2}
  sparkData={[8, 9, 10, 11, 12, 12]}
/>
```

---

### Scope Flag Card — Premium Design
**Inspired by:** Stripe Radar fraud alert, Intercom conversation, Linear issue card

```tsx
// ScopeFlagCard.redesigned.tsx
export function ScopeFlagCard({ flag }: { flag: ScopeFlag }) {
  const severityColor = {
    high:   'var(--status-red)',
    medium: 'var(--status-amber)',
    low:    'var(--status-blue)',
  }[flag.severity];

  return (
    <div
      className="relative rounded-xl border border-[rgb(var(--border-default))] 
                 bg-[rgb(var(--surface-white))] shadow-sm overflow-hidden"
      style={{ borderLeft: `4px solid rgb(${severityColor})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={flag.severity} />
          <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {flag.clientName} / {flag.projectName}
          </span>
        </div>
        <span className="text-xs text-[rgb(var(--text-muted))]">
          {formatDistanceToNow(flag.createdAt)} ago
        </span>
      </div>

      {/* Client Message */}
      <div className="mx-4 mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))] mb-1">
          Client Message
        </p>
        <div className="rounded-lg bg-[rgb(var(--surface-subtle))] px-3 py-2">
          <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-3">
            "{flag.messageText}"
          </p>
        </div>
      </div>

      {/* SOW Clause */}
      <div className="mx-4 mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))] mb-1">
          SOW Exclusion — {flag.clauseReference}
        </p>
        <div className="rounded-lg border border-[rgb(var(--border-default))] 
                        bg-[rgb(var(--surface-subtle))] px-3 py-2">
          <p className="text-sm italic text-[rgb(var(--text-secondary))]">
            "{flag.clauseText}"
          </p>
        </div>
      </div>

      {/* Confidence + Severity */}
      <div className="mx-4 mb-3 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-[rgb(var(--text-muted))] mb-1">
            Confidence {Math.round(flag.confidence * 100)}%
          </p>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${flag.confidence * 100}%`,
                backgroundColor: `rgb(${severityColor})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* AI Suggested Response */}
      <div className="mx-4 mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))] mb-1">
          AI Suggested Response
        </p>
        <div className="rounded-lg border border-[rgb(var(--border-default))] 
                        bg-[rgb(var(--surface-subtle))] px-3 py-2">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {flag.suggestedResponse}
          </p>
          <div className="mt-2 flex gap-2 justify-end">
            <button className="text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
              ✏ Edit
            </button>
            <button className="text-xs text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]">
              📋 Copy
            </button>
          </div>
        </div>
      </div>

      {/* 3 Actions */}
      <div className="flex gap-2 border-t border-[rgb(var(--border-default))] px-4 py-3">
        <button
          onClick={() => onConfirm(flag.id)}
          className="flex-1 rounded-lg bg-[rgb(var(--status-red))] px-3 py-2 
                     text-xs font-semibold text-white hover:opacity-90"
        >
          Confirm & Generate Change Order
        </button>
        <button
          onClick={() => onDismiss(flag.id)}
          className="rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 
                     text-xs font-semibold text-[rgb(var(--text-secondary))]"
        >
          ✓ In-Scope
        </button>
        <button
          onClick={() => onSnooze(flag.id)}
          className="rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 
                     text-xs font-semibold text-[rgb(var(--text-secondary))]"
        >
          ⏰ Snooze
        </button>
      </div>
    </div>
  );
}
```

---

## Accessibility Checklist (WCAG 2.1 AA)

| Check | Status | Fix Required |
|---|---|---|
| Color contrast 4.5:1 for body | ⚠️ Needs audit | --text-secondary (#4B5563) on white = 7.0:1 ✅; amber status color needs check |
| Focus states 2px outline | ❌ Not verified | Add `focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-teal))]` to all interactive elements |
| Touch targets min 44×44px | ⚠️ Partial | Scope flag action buttons may be <44px on mobile |
| ARIA labels on icon-only buttons | ❌ Missing | Add `aria-label` to copy, edit, snooze icon buttons |
| Form field `<label>` association | ✅ RHF handles | Verify all portal form fields |
| AnnotationCanvas keyboard alternative | ❌ Missing | Add "Add comment at position" form as keyboard alternative to click-to-pin |
| Error messages via aria-describedby | ⚠️ Partial | RHF error messages need explicit `aria-describedby` linkage |
| Loading states announced | ❌ Missing | Add `aria-live="polite"` to loading/pending states |

---

## Component Naming Convention

All redesigned components should use these exact names to match PRD spec:

| PRD Name | Current Name | Target Name |
|---|---|---|
| `BriefScoreDisplay` | `ClarityScoreRing` | Keep current, export as both names |
| `AuditLogTimeline` | `ActivityLogTab` | Rename to `AuditLogTimeline`, connect to audit_log API |
| `PortalBrandingConfig` | Inline in settings page | Extract to standalone `PortalBrandingConfig.tsx` |
| `NavigationBadge` | Inline sidebar code | Extract to `NavigationBadge.tsx` with count prop |
| `StatusBadge` | `briefs/shared/status-badge` | Create `shared/StatusBadge.tsx` as design-system component |
