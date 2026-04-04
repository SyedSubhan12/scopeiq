# PHASE 4 — Approval Portal Module
## Cursor Agent Prompt | ScopeIQ by Novabots
### Estimated Duration: 5-7 days | Depends on: Phase 2
### Features: FEAT-AP-001 through FEAT-AP-005

---

## CONTEXT

The Approval Portal is where agencies deliver creative work and clients review it. This module includes deliverable upload (with presigned URLs), point-anchored annotations, revision round tracking, AI feedback summarization, and automated approval reminder sequences.

---

## FILES TO CREATE

### Backend

```
1.  apps/api/src/repositories/deliverable.repository.ts
2.  apps/api/src/repositories/feedback.repository.ts
3.  apps/api/src/repositories/approval-event.repository.ts
4.  apps/api/src/repositories/reminder-log.repository.ts
5.  apps/api/src/services/deliverable.service.ts
6.  apps/api/src/services/feedback.service.ts
7.  apps/api/src/services/reminder.service.ts
8.  apps/api/src/services/deliverable.service.test.ts
9.  apps/api/src/routes/deliverable.schemas.ts
10. apps/api/src/routes/deliverable.route.ts         — Full CRUD + upload-url + confirm-upload
11. apps/api/src/routes/feedback.schemas.ts
12. apps/api/src/routes/feedback.route.ts             — Submit feedback (portal), resolve (agency)
13. apps/api/src/routes/portal-deliverable.route.ts   — Portal-authenticated: submit feedback, approve
14. apps/api/src/jobs/summarize-feedback.job.ts        — Dispatch AI summarization job
15. apps/api/src/jobs/send-reminder.job.ts             — Cron-triggered reminder dispatch
```

### AI Service

```
16. apps/ai/app/workers/summarize_feedback_worker.py
17. apps/ai/app/services/feedback_summarizer.py
18. apps/ai/app/prompts/feedback_summary_prompt.py
19. apps/ai/app/schemas/feedback_schemas.py
```

### Frontend Components

```
20. apps/web/src/hooks/useDeliverables.ts
21. apps/web/src/hooks/useFeedback.ts
22. apps/web/src/components/approval/DeliverableList.tsx       — List of deliverables with status
23. apps/web/src/components/approval/DeliverableUploader.tsx   — Upload UI with progress bar (presigned URL flow)
24. apps/web/src/components/approval/DeliverableViewer.tsx     — Image/PDF/embed viewer with annotation overlay
25. apps/web/src/components/approval/AnnotationCanvas.tsx      — Click-to-place pin system with threaded comments
26. apps/web/src/components/approval/FeedbackPanel.tsx         — Side panel: list of pins/comments with resolve buttons
27. apps/web/src/components/approval/RevisionCounter.tsx       — Progress bar with color states (green→amber→red)
28. apps/web/src/components/approval/ReminderSettings.tsx      — Configure reminder schedule (hours/days per step)
29. apps/web/src/components/approval/FeedbackSummary.tsx       — AI-generated task list view
```

### Frontend Pages

```
30. apps/web/src/app/(dashboard)/projects/[id]/deliverables/page.tsx
```

### E2E Test

```
31. apps/web/tests/e2e/approval-flow.spec.ts
```

---

## CRITICAL IMPLEMENTATION DETAILS

### Presigned URL Upload Flow

NEVER accept file content in API request bodies. Use this three-step pattern:

```
Step 1: Client → API: POST /deliverables/:id/upload-url
        Body: { file_name: "logo-v3.pdf", content_type: "application/pdf", file_size: 2500000 }
        Response: { upload_url: "https://r2...", object_key: "deliverables/ws_xxx/del_xxx/logo-v3.pdf" }

Step 2: Client → R2/MinIO: PUT <upload_url>
        Body: raw file bytes
        Headers: Content-Type from step 1

Step 3: Client → API: POST /deliverables/:id/confirm-upload
        Body: { object_key: "deliverables/ws_xxx/del_xxx/logo-v3.pdf" }
        Response: { ...deliverable with file_url, status: "in_review" }
```

### Annotation Canvas

Point-anchored annotations use percentage-based coordinates (device-agnostic):

```typescript
interface AnnotationPin {
  id: string;
  x_pos: number;    // % of image width (0-100)
  y_pos: number;    // % of image height (0-100)
  page_number?: number;  // For PDFs
  pin_number: number;    // Sequential display number
  content: string;
  author_type: "client" | "agency";
  is_resolved: boolean;
  replies: AnnotationPin[];  // Threaded
}
```

Implementation:
- Canvas overlay (`position: absolute` over the deliverable image/PDF)
- Click to place → numbered circle pin appears
- Click pin → comment panel slides open at right
- Agency can resolve pins (hides from client, preserved in audit)
- Pins render correctly at all zoom levels using CSS `transform` with percentage positioning

### Revision Round Counter

```typescript
// From deliverables table:
// revision_round: current round number
// From projects table or sow_clauses:
// revision_limit: max rounds included

// Visual states:
// 0-50% used: green (#059669)
// 51-80% used: amber (#D97706)
// 81-100% used: red (#DC2626)

// At limit: client sees modal explaining additional rounds are billable
// Modal includes auto-generated add-on quote from rate card
```

### Automated Reminder Sequence

The reminder system uses a cron-based approach:

```typescript
// Cron runs hourly checking for overdue deliverables
// Reminder schedule stored in workspace settings (global default) or per-project override:
// Default: [48h, 96h, 168h] (2 days, 4 days, 7 days)

// Step 1 (gentle_nudge): "Hi [name], we'd love your feedback on [deliverable]."
// Step 2 (deadline_warning): "[deliverable] is awaiting your review. Please respond by [date]."
// Step 3 (silence_approval): "Per our agreement, [deliverable] will be marked as approved in 48 hours if no response is received."

// After step 3 expiry: auto-approve, create approval_events record, notify agency
```

### AI Feedback Summarizer Prompt

```python
FEEDBACK_SUMMARY_PROMPT = """You are a creative project manager. Analyze the raw client feedback
and convert it into a structured, prioritized revision task list.

For each task:
1. Extract the specific action needed
2. Estimate impact (high/medium/low)
3. Flag any contradictions between feedback items
4. Order tasks by estimated impact (highest first)

Return a JSON array of tasks. If feedback items contradict each other, flag both with
"contradiction": true and explain the conflict."""
```

---

## ACCEPTANCE CRITERIA

- [ ] 500MB file uploads complete within 3 minutes on standard broadband
- [ ] Upload progress bar accurate within 5%
- [ ] Figma embeds render in under 3 seconds
- [ ] Pins placeable anywhere on images and PDFs
- [ ] Coordinates display correctly at all zoom levels
- [ ] Revision counter updates in real time (no refresh)
- [ ] At-limit modal cannot be dismissed without explicit acknowledgment
- [ ] Reminder schedule configurable in hours/days
- [ ] Sent within 5 minutes of threshold crossing
- [ ] Silence-as-approval event appears in audit trail

## COMMIT

```
feat(approval): add deliverable upload, annotation canvas, revision tracking, and reminder sequence
```
