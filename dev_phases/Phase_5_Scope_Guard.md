# PHASE 5 — Scope Guard Module
## Cursor Agent Prompt | ScopeIQ by Novabots
### Estimated Duration: 5-7 days | Depends on: Phase 2
### Features: FEAT-SG-001, FEAT-SG-002, FEAT-SG-003

---

## CONTEXT

Scope Guard is the core differentiator of ScopeIQ. It parses uploaded SOW documents into structured clauses, monitors every client message in real-time against those clauses, and generates change orders with one click when out-of-scope requests are detected.

---

## FILES TO CREATE

### Backend

```
1.  apps/api/src/repositories/sow.repository.ts
2.  apps/api/src/repositories/sow-clause.repository.ts
3.  apps/api/src/repositories/scope-flag.repository.ts
4.  apps/api/src/repositories/change-order.repository.ts
5.  apps/api/src/services/sow.service.ts
6.  apps/api/src/services/scope-flag.service.ts
7.  apps/api/src/services/change-order.service.ts
8.  apps/api/src/services/scope-flag.service.test.ts
9.  apps/api/src/routes/sow.schemas.ts
10. apps/api/src/routes/sow.route.ts                   — POST upload, GET parsed, PATCH clauses, POST activate
11. apps/api/src/routes/scope-flag.schemas.ts
12. apps/api/src/routes/scope-flag.route.ts             — GET flags, POST confirm, POST dismiss, POST snooze
13. apps/api/src/routes/change-order.schemas.ts
14. apps/api/src/routes/change-order.route.ts           — GET list, PATCH edit, POST send
15. apps/api/src/routes/portal-change-order.route.ts    — Portal: POST accept, POST decline
16. apps/api/src/routes/message-ingest.route.ts         — POST /messages/ingest (manual input)
17. apps/api/src/jobs/parse-sow.job.ts
18. apps/api/src/jobs/check-scope.job.ts
19. apps/api/src/jobs/generate-change-order.job.ts
```

### AI Service

```
20. apps/ai/app/workers/parse_sow_worker.py
21. apps/ai/app/workers/check_scope_worker.py
22. apps/ai/app/workers/generate_change_order_worker.py
23. apps/ai/app/services/sow_parser.py
24. apps/ai/app/services/scope_analyzer.py
25. apps/ai/app/services/change_order_generator.py
26. apps/ai/app/prompts/sow_parsing_prompt.py
27. apps/ai/app/prompts/scope_analysis_prompt.py
28. apps/ai/app/prompts/change_order_prompt.py
29. apps/ai/app/schemas/sow_schemas.py
30. apps/ai/app/schemas/scope_schemas.py
31. apps/ai/tests/test_scope_analyzer.py              — Test with 3 SOW + message combos
```

### Frontend Components

```
32. apps/web/src/hooks/useSow.ts
33. apps/web/src/hooks/useScopeFlags.ts
34. apps/web/src/hooks/useChangeOrders.ts
35. apps/web/src/components/scope-guard/SowUploader.tsx          — Upload SOW (PDF or paste text)
36. apps/web/src/components/scope-guard/SowClauseEditor.tsx      — Review parsed clauses grouped by type, edit before activation
37. apps/web/src/components/scope-guard/ScopeFlagList.tsx         — List of pending/resolved flags
38. apps/web/src/components/scope-guard/ScopeFlagCard.tsx         — Flag detail with message, SOW clause, confidence, 3 actions
39. apps/web/src/components/scope-guard/ScopeFlagDetail.tsx       — Full-page flag detail (modal or sheet)
40. apps/web/src/components/scope-guard/ScopeMeter.tsx            — Semi-circular arc showing overall scope utilization
41. apps/web/src/components/scope-guard/ChangeOrderEditor.tsx     — Edit draft CO: title, description, pricing, timeline
42. apps/web/src/components/scope-guard/ChangeOrderList.tsx       — List with status badges
43. apps/web/src/components/scope-guard/MessageIngestInput.tsx    — Manual message input for scope checking
```

### Frontend Pages

```
44. apps/web/src/app/(dashboard)/projects/[id]/scope-guard/page.tsx
45. apps/web/src/app/(dashboard)/projects/[id]/change-orders/page.tsx
46. apps/web/src/app/(dashboard)/scope-flags/page.tsx             — All flags across projects
```

### E2E Test

```
47. apps/web/tests/e2e/scope-flag-flow.spec.ts
```

---

## CRITICAL IMPLEMENTATION DETAILS

### SOW Parsing Prompt

```python
SOW_PARSING_SYSTEM_PROMPT = """You are a contract parsing assistant for creative agencies.
Extract structured clause information from the Statement of Work text.

Categorize each clause into one of these types:
- deliverable: Specific work product included (e.g., "Logo system with 3 variations")
- revision_limit: Number of revision rounds included (e.g., "3 rounds of revisions")
- timeline: Milestone dates and deadlines
- exclusion: Work explicitly NOT included (e.g., "Social media management is excluded")
- payment_term: Payment schedule, rates, late fees
- other: Any other contractually significant clause

For each clause, extract:
- clause_type: One of the types above
- content: The exact clause text (cleaned up, not truncated)
- section_reference: Original section number if present (e.g., "Section 2.2")

Be thorough. Missing an exclusion clause means scope creep won't be caught."""

SOW_PARSING_TOOL = {
    "name": "parse_sow",
    "description": "Extract structured clauses from a Statement of Work",
    "input_schema": {
        "type": "object",
        "properties": {
            "deliverables": {"type": "array", "items": {"$ref": "#/definitions/clause"}},
            "revision_limits": {"type": "array", "items": {"$ref": "#/definitions/clause"}},
            "timeline_milestones": {"type": "array", "items": {"$ref": "#/definitions/clause"}},
            "exclusions": {"type": "array", "items": {"$ref": "#/definitions/clause"}},
            "payment_terms": {"type": "array", "items": {"$ref": "#/definitions/clause"}}
        },
        "definitions": {
            "clause": {
                "type": "object",
                "properties": {
                    "content": {"type": "string"},
                    "section_reference": {"type": "string"}
                },
                "required": ["content"]
            }
        },
        "required": ["deliverables", "exclusions"]
    }
}
```

### Scope Analysis Prompt

```python
SCOPE_ANALYSIS_SYSTEM_PROMPT = """You are a contract scope enforcement assistant for creative agencies.
Given a client message and the active SOW clauses, determine if the request falls within scope.

Analyze the message against ALL active clauses. Consider:
1. Is the request explicitly covered by a deliverable clause? → In scope
2. Is the request explicitly excluded? → Out of scope (high confidence)
3. Is the request a reasonable interpretation of a deliverable? → In scope (note assumption)
4. Is the request new work not mentioned in the SOW? → Out of scope

Return your analysis with:
- is_in_scope: boolean
- confidence: float (0.0 to 1.0) — how certain you are
- matching_clauses: array of clause IDs that are relevant
- severity: "low" (minor addition), "medium" (moderate new work), "high" (significant new deliverable)
- suggested_response: A professional, friendly message the agency can send to the client"""

SCOPE_ANALYSIS_TOOL = {
    "name": "analyze_scope",
    "input_schema": {
        "type": "object",
        "properties": {
            "is_in_scope": {"type": "boolean"},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "matching_clauses": {"type": "array", "items": {"type": "string"}},
            "severity": {"type": "string", "enum": ["low", "medium", "high"]},
            "reasoning": {"type": "string"},
            "suggested_response": {"type": "string"}
        },
        "required": ["is_in_scope", "confidence", "severity", "reasoning", "suggested_response"]
    }
}
```

### Scope Flag Detection Pipeline

```
1. Message ingested (portal / email forward / manual input)
2. Message stored in DB → BullMQ job dispatched: { job_type: "check_scope", message_id }
3. AI Worker fetches message + ALL active sow_clauses for project
4. Claude API call with scope analysis prompt
5. If !is_in_scope AND confidence > 0.6:
   → Create scope_flags record (status: pending)
   → Push real-time notification to dashboard (Supabase)
   → If agency has not viewed within 2 hours → send email notification
6. If is_in_scope → log result, no flag created
```

### Change Order Auto-Generation

When agency clicks "Confirm" on a scope flag:

```
1. Flag status → "confirmed"
2. Dispatch generate-change-order job
3. AI generates: { title, work_description, estimated_hours, pricing, revised_timeline }
4. Pricing auto-calculated from workspace rate_card_items
5. Change order created (status: draft)
6. Agency reviews in inline editor, can modify any field
7. Agency clicks "Send" → CO sent via portal + email
8. Client Accept → SOW scope updated, invoice queued
9. Client Decline → agency notified, project flagged
```

### ScopeFlagCard Component (3 mutually exclusive actions)

```typescript
// From Wireframes document, Screen 4:
// [🔴 Confirm & Generate Change Order] — triggers CO generation pipeline
// [✓ Mark In-Scope] — dismiss with reason (trains AI), requires text input
// [⏰ Snooze] — defer 24 hours, re-surfaces automatically

// Card layout:
// - Left border: 4px solid status-red
// - Background: status-red-light
// - Shows: client message text, SOW clause referenced, confidence %, severity badge
// - AI suggested response (editable before sending)
```

---

## ACCEPTANCE CRITERIA

- [ ] PDF and plain text SOW accepted
- [ ] Extraction under 30 seconds for 10-page SOW
- [ ] >85% accuracy on standard creative SOW formats
- [ ] Agency editor groups clauses by type with edit/delete/add
- [ ] Flag generated within 5 seconds p95 of message receipt
- [ ] Confidence shown as % with color coding
- [ ] False positive rate <15% against test corpus
- [ ] Change order generated within 5 seconds of confirmation
- [ ] All fields editable before sending
- [ ] Pricing auto-calculated from rate card but overridable
- [ ] Accepted COs update SOW scope immediately
- [ ] Complete flag history per project in audit log

## COMMIT

```
feat(scope-guard): add SOW parsing, real-time scope detection, and change order generation
```
