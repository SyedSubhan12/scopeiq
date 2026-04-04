# PHASE 3 — Brief Builder Module
## Cursor Agent Prompt | ScopeIQ by Novabots
### Estimated Duration: 5-7 days | Depends on: Phase 2
### Features: FEAT-BB-001, FEAT-BB-002, FEAT-BB-003, FEAT-BB-004

---

## CONTEXT

The Brief Builder is the first module clients interact with. It allows agencies to create custom intake forms, clients to submit briefs, and AI to score each submission for clarity. Low-scoring briefs are auto-held and returned to the client with specific clarification questions.

## WHAT TO BUILD

1. **Form Builder UI** — Drag-and-drop template editor with 6+ field types and conditional logic
2. **Brief Submission API** — Public endpoint for clients to submit responses
3. **AI Scoring Pipeline** — BullMQ job → FastAPI worker → Claude API → structured score + flags
4. **Auto-Hold Flow** — Briefs below threshold are held and client is emailed clarification questions
5. **Brief View UI** — Agency sees submitted briefs with scores, flags, and version history

---

## FILES TO CREATE

### Backend — Repository & Service

```
1.  apps/api/src/repositories/brief-template.repository.ts
2.  apps/api/src/repositories/brief.repository.ts
3.  apps/api/src/services/brief-template.service.ts
4.  apps/api/src/services/brief.service.ts
5.  apps/api/src/services/brief.service.test.ts
```

### Backend — Routes & Schemas

```
6.  apps/api/src/routes/brief-template.schemas.ts
7.  apps/api/src/routes/brief-template.route.ts     — CRUD for templates
8.  apps/api/src/routes/brief.schemas.ts
9.  apps/api/src/routes/brief.route.ts               — GET briefs, GET brief/:id, POST override
10. apps/api/src/routes/brief-submit.route.ts         — POST /briefs/submit (PUBLIC, rate-limited)
```

### Backend — Job Dispatch

```
11. apps/api/src/jobs/score-brief.job.ts              — Dispatch scoring job to BullMQ
```

### AI Service — Brief Scoring Worker

```
12. apps/ai/app/workers/score_brief_worker.py         — BullMQ worker that processes scoring jobs
13. apps/ai/app/services/brief_scorer.py               — Calls Claude API with structured output
14. apps/ai/app/prompts/brief_scoring_prompt.py        — Versioned prompt template for clarity scoring
15. apps/ai/app/schemas/brief_schemas.py               — Pydantic schemas for score input/output
16. apps/ai/tests/test_brief_scorer.py                 — Test with 5 sample briefs (2 clear, 2 ambiguous, 1 adversarial)
```

### Frontend — Brief Builder Components

```
17. apps/web/src/hooks/useBriefTemplates.ts
18. apps/web/src/hooks/useBriefs.ts
19. apps/web/src/components/brief/FormBuilder.tsx          — Main form builder with drag-and-drop canvas
20. apps/web/src/components/brief/FieldLibrary.tsx         — Sidebar: draggable field type buttons
21. apps/web/src/components/brief/FieldEditor.tsx          — Configure a single field (label, required, options, conditions)
22. apps/web/src/components/brief/FormPreview.tsx          — Live client-view preview panel
23. apps/web/src/components/brief/BriefList.tsx            — List of submitted briefs with scores
24. apps/web/src/components/brief/BriefDetail.tsx          — Full brief view with field values, flags, and score
25. apps/web/src/components/brief/ClarityScoreRing.tsx     — Animated circular score display (0-100)
26. apps/web/src/components/brief/BriefFlagCard.tsx        — Individual AI flag with severity and suggested question
```

### Frontend — Pages

```
27. apps/web/src/app/(dashboard)/briefs/page.tsx           — Brief templates list + create new
28. apps/web/src/app/(dashboard)/briefs/[id]/edit/page.tsx — Form builder editor for a template
29. apps/web/src/app/(dashboard)/projects/[id]/briefs/page.tsx — Briefs tab within project detail
```

### E2E Test

```
30. apps/web/tests/e2e/brief-builder-flow.spec.ts
```

---

## CRITICAL IMPLEMENTATION DETAILS

### Brief Template fields_json Schema

The form schema is stored as a JSON array in the `brief_templates.fields_json` column:

```typescript
interface BriefField {
  key: string;           // Unique field identifier: "project_name", "budget", etc.
  type: "text" | "textarea" | "single_choice" | "multi_choice" | "date" | "file_upload";
  label: string;         // Display label shown to client
  placeholder?: string;
  required: boolean;
  options?: string[];    // For single_choice and multi_choice
  conditions?: {         // Conditional display rules
    field_key: string;   // Show this field only when...
    operator: "equals" | "not_equals" | "contains";
    value: string;       // ...this field has this value
  }[];
  order: number;         // Display position (updated on drag-and-drop)
}
```

### Public Brief Submission Endpoint

This endpoint is **unauthenticated** and **rate-limited** (10 submissions/IP/hour):

```typescript
// apps/api/src/routes/brief-submit.route.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { rateLimiter } from "../middleware/rate-limiter";

const briefSubmit = new Hono()
  .use("*", rateLimiter({ max: 10, windowMs: 60 * 60 * 1000 })) // 10/hour per IP
  .post("/",
    zValidator("json", submitBriefSchema),
    async (c) => {
      const { template_id, responses } = c.req.valid("json");

      // 1. Look up template (includes workspace_id)
      // 2. Validate responses against template fields
      // 3. Create brief record (status: pending_score)
      // 4. Create brief_field records for each response
      // 5. Dispatch BullMQ scoring job
      // 6. Return { brief_id, message }

      return c.json({ data: { brief_id, message: "Brief submitted successfully" } }, 201);
    },
  );
```

### AI Brief Scoring Prompt Template

```python
# apps/ai/app/prompts/brief_scoring_prompt.py

BRIEF_SCORING_SYSTEM_PROMPT = """You are a creative project brief evaluator for a professional agency.
Analyze the submitted brief and evaluate each field for clarity, completeness, and actionability.

Return a JSON response using the provided tool schema. Score from 0-100 where:
- 90-100: Exceptionally clear, ready to begin immediately
- 70-89: Clear enough to proceed with minor assumptions
- 50-69: Has ambiguous areas that should be clarified before starting work
- 0-49: Too vague to begin work, requires significant clarification

For each flagged field, provide:
- field_key: The exact field key that has issues
- reason: Specific explanation of what is ambiguous or missing
- severity: "low" (minor clarity issue), "medium" (could cause revisions), "high" (will definitely cause revisions)
- suggested_question: A specific question to ask the client to resolve the ambiguity

Be critical but fair. Focus on fields that would cause revision rounds if left unclear."""

BRIEF_SCORING_TOOL = {
    "name": "score_brief",
    "description": "Score a client brief for clarity and flag ambiguous areas",
    "input_schema": {
        "type": "object",
        "properties": {
            "score": {"type": "integer", "minimum": 0, "maximum": 100},
            "summary": {"type": "string", "description": "One-sentence overall assessment"},
            "flags": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "field_key": {"type": "string"},
                        "reason": {"type": "string"},
                        "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                        "suggested_question": {"type": "string"}
                    },
                    "required": ["field_key", "reason", "severity", "suggested_question"]
                }
            }
        },
        "required": ["score", "summary", "flags"]
    }
}
```

### BullMQ Worker (Python)

```python
# apps/ai/app/workers/score_brief_worker.py
import asyncio
from bullmq import Worker
from app.services.brief_scorer import BriefScorerService
from app.config import settings

async def process_score_brief(job):
    """Process a brief scoring job from the queue."""
    brief_id = job.data["brief_id"]
    scorer = BriefScorerService()

    # 1. Fetch brief fields from database
    # 2. Call Claude API via scorer service
    # 3. Update brief record with score + status
    # 4. Update brief_field records with flags
    # 5. If score < threshold: dispatch clarification email
    # 6. Push real-time update via Supabase

    result = await scorer.score(brief_id)
    return {"score": result.score, "flag_count": len(result.flags)}

worker = Worker(
    "brief-scoring",
    process_score_brief,
    {"connection": {"host": settings.REDIS_HOST, "port": settings.REDIS_PORT}},
)
```

### ClarityScoreRing Component

Animated SVG circle that fills from 0 to the score value over 1.5s:

```typescript
// Key animation specs from Design UX Spec:
// - Circular progress fills from 0 to score over 1.5s
// - Number counts up simultaneously
// - Color: green (70+), amber (50-69), red (<50)
// - Use Framer Motion for the animation
```

### FormBuilder Drag-and-Drop

```typescript
// Use @dnd-kit/core and @dnd-kit/sortable
// Left panel: FieldLibrary with draggable items (6 field types)
// Right panel: FormCanvas with sortable field cards
// Each field card expands on click to show FieldEditor
// Auto-save on every change (debounced 500ms)
// Live preview in side panel or modal
```

---

## ACCEPTANCE CRITERIA (from Feature Breakdown)

- [ ] Min 6 field types: text, textarea, single-choice, multi-choice, date, file upload
- [ ] Drag reorder works on desktop and mobile
- [ ] Conditional logic rules can chain
- [ ] Form autosaves on every change (debounced 500ms)
- [ ] Score visible within 10 seconds p95
- [ ] Minimum 3 actionable flags for briefs scoring below 70
- [ ] Each flag references the specific field that triggered it
- [ ] Briefs below threshold automatically held
- [ ] Client email dispatched within 60 seconds with numbered clarification questions
- [ ] Re-submitted brief goes through full scoring cycle
- [ ] Agency override logs actor, reason, and timestamp

## COMMIT

```
feat(brief-builder): add form builder with drag-and-drop, AI scoring pipeline, and auto-hold flow
```
