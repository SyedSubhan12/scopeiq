---
name: Sprint 3 Components
description: Patterns and decisions from Sprint 3 (Approval Portal) implementation — ChangeOrderPDF, FormBuilder DnD, BriefVersionHistory
type: project
---

Sprint 3 (Approval Portal) implemented 2026-04-11.

**ChangeOrderPDF** (`apps/web/src/components/portal/ChangeOrderPDF.tsx`):
- Pure React print layout (not @react-pdf/renderer) — uses `window.print()`
- GSAP timeline on mount via dynamic `import("gsap/dist/gsap")` with `// @ts-expect-error`
- Framer Motion `whileHover={{ scale: 1.01 }}` on sign button
- Props: `changeOrder`, `agencyLogoUrl?`, `brandColor?` (defaults #1D9E75), `signatureName?`, `onSigned?`
- Signed state: cursive serif display; unsigned state: typed name input + checkbox + sign button

**ChangeOrderView** (`apps/web/src/components/portal/ChangeOrderView.tsx`) updated:
- Added `pdfOpen` state + Dialog wrapping ChangeOrderPDF
- "Download PDF" ghost button added to the view-mode action row
- "Download signed copy" button in accepted state now opens the PDF dialog
- exactOptionalPropertyTypes fix: use `{...(signatureName ? { signatureName } : {})}` not `signatureName={signatureName || undefined}`

**FormBuilder** (`apps/web/src/components/brief/FormBuilder.tsx`) — full DnD rewrite:
- Replaced ArrowUp/ArrowDown buttons with `@dnd-kit/core` + `@dnd-kit/sortable`
- `SortableFieldCard` uses `useSortable({ id: field.key })` with `CSS.Transform.toString(transform)`
- GripVertical icon as drag handle (`...attributes, ...listeners` on the handle button, NOT the card)
- `handleDragEnd` uses `arrayMove` + re-assigns `order` from index
- Framer Motion `AnimatePresence` with `layout` prop on each card
- PointerSensor with `activationConstraint: { distance: 4 }` to prevent accidental drags on click

**BriefVersionHistory** (`apps/web/src/components/briefs/submissions/BriefVersionHistory.tsx`):
- Standalone component — manages its own version selector state (doesn't lift to parent)
- `diffWords(before, after)` implements LCS algorithm returning `{word, type: 'added'|'removed'|'unchanged'}[]`
- Before column filters out `added` tokens; After column filters out `removed` tokens
- Framer Motion staggered opacity animation on each diff token
- Integrated into `submission-review-view.tsx` replacing the inline version comparison Card
- Removed `selectedBaseVersionId`, `selectedCompareVersionId`, `diffRows` useMemo, and `useMemo` import from submission-review-view.tsx after extraction
