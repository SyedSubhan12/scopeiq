import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
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

briefRouter.get("/:id/versions", async (c) => {
  const workspaceId = c.get("workspaceId");
  const briefId = c.req.param("id");
  const versions = await briefService.listVersions(workspaceId, briefId);
  return c.json({ data: versions });
});

briefRouter.post("/:id/review", zValidator("json", reviewBriefSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const briefId = c.req.param("id");
  const body = c.req.valid("json");
  const brief = await briefService.reviewBrief(workspaceId, briefId, userId, body);
  return c.json({ data: brief });
});

briefRouter.post("/:id/reviewer", zValidator("json", assignBriefReviewerSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const briefId = c.req.param("id");
  const body = c.req.valid("json");
  const brief = await briefService.assignReviewer(workspaceId, briefId, userId, body.reviewerId);
  return c.json({ data: brief });
});

briefRouter.post(
  "/:id/clarification-request",
  zValidator("json", createClarificationRequestSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const briefId = c.req.param("id");
    const body = c.req.valid("json");
    const result = await briefService.createClarificationRequest(workspaceId, briefId, userId, body);
    return c.json({ data: result }, 201);
  },
);

briefRouter.post("/:id/override", zValidator("json", overrideBriefSchema), async (c) => {
  const workspaceId = c.get("workspaceId");
  const userId = c.get("userId");
  const briefId = c.req.param("id");
  const body = c.req.valid("json");
  const brief = await briefService.overrideBrief(workspaceId, briefId, userId, body);
  return c.json({ data: brief });
});
