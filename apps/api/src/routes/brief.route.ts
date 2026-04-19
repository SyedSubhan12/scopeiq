import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { briefService } from "../services/brief.service.js";
import {
  listBriefsQuerySchema,
  overrideBriefSchema,
  createBriefSchema,
  reviewBriefSchema,
  assignBriefReviewerSchema,
  createClarificationRequestSchema,
} from "./brief.schemas.js";

export const briefRouter = new Hono();

briefRouter.use("*", authMiddleware);

// ---------------------------------------------------------------------------
// POST /coach-hint — no auth required; called from textarea debounce hook
// Returns a one-sentence Grammarly-style hint for a single brief field value.
// ---------------------------------------------------------------------------

const coachHintSchema = z.object({
  fieldKey: z.string().min(1).max(100),
  value: z.string().min(20).max(4000),
});

const FIELD_FALLBACK_HINTS: Record<string, { hint: string; tone: "tip" | "warning" | "praise" }> = {
  project_goals: { hint: "Try stating the single measurable outcome this project must achieve.", tone: "tip" },
  target_audience: { hint: "Be specific — who exactly is this for and what do they need from this?", tone: "tip" },
  deliverables: { hint: "List each deliverable separately so scope is unambiguous.", tone: "warning" },
  timeline: { hint: "Include key milestones, not just a final deadline.", tone: "tip" },
  budget: { hint: "Providing a budget range helps set realistic expectations upfront.", tone: "tip" },
};

const DEFAULT_HINT = { hint: "Add more detail here to improve your brief clarity score.", tone: "tip" as const };

function scoreWordCount(value: string): { hint: string; tone: "tip" | "warning" | "praise" } | null {
  const words = value.trim().split(/\s+/).length;
  if (words < 10) return { hint: "This answer is quite short — a bit more detail will help the AI score it higher.", tone: "warning" };
  if (words > 80) return { hint: "Great detail here — this looks thorough.", tone: "praise" };
  return null;
}

briefRouter.post(
  "/coach-hint",
  zValidator("json", coachHintSchema),
  async (c) => {
    const { fieldKey, value } = c.req.valid("json");

    // Word-count heuristic first — fast, no AI call needed
    const wordCountHint = scoreWordCount(value);
    if (wordCountHint) {
      return c.json({ data: wordCountHint });
    }

    // Field-specific fallback hint
    const fallback = FIELD_FALLBACK_HINTS[fieldKey] ?? DEFAULT_HINT;
    return c.json({ data: fallback });
  },
);

briefRouter.get("/", zValidator("query", listBriefsQuerySchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const query = c.req.valid("query");
  const briefs = await briefService.listBriefs(workspaceId, query);
  return c.json({ data: briefs });
});

// Agency creates a brief directly from the dashboard
briefRouter.post("/", zValidator("json", createBriefSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const result = await briefService.submitBrief({
    workspaceId,
    projectId: body.projectId,
    templateId: body.templateId,
    title: body.title,
    responses: body.responses,
    submittedBy: userId,
  });
  return c.json(result, 201);
});

briefRouter.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId");
  const briefId = c.req.param("id");
  const brief = await briefService.getBrief(workspaceId, briefId);
  return c.json({ data: brief });
});

briefRouter.patch("/:id/override", zValidator("json", overrideBriefSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const briefId = c.req.param("id");
  const body = c.req.valid("json");
  const brief = await briefService.overrideBrief(workspaceId, briefId, userId, body);
  return c.json({ data: brief });
});
