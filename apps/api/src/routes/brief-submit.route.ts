import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { briefService } from "../services/brief.service.js";
import { rateLimiter } from "../middleware/rate-limiter.js";
import { submitBriefSchema } from "./brief.schemas.js";

export const briefSubmitRouter = new Hono();

// PUBLIC endpoint — rate limited to 10 requests per IP per hour
briefSubmitRouter.post(
  "/",
  rateLimiter(10, 60 * 60 * 1000),
  zValidator("json", submitBriefSchema),
  async (c) => {
    const body = c.req.valid("json");

    const result = await briefService.submitBrief({
      templateId: body.template_id,
      projectId: body.project_id,
      workspaceId: body.workspace_id,
      title: body.title,
      responses: body.responses,
    });

    return c.json(result, 201);
  },
);
