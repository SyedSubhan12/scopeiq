import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { briefEmbedService } from "../services/brief-embed.service.js";
import { rateLimiter } from "../middleware/rate-limiter.js";

export const publicBriefEmbedRouter = new Hono();

// Open CORS for embeds — they're loaded from arbitrary third-party origins
publicBriefEmbedRouter.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 600,
  }),
);

// 30 submissions per 15 minutes per IP — generous for GET, tighter for POST
const getLimit = rateLimiter(60, 15 * 60 * 1000);
const submitLimit = rateLimiter(30, 15 * 60 * 1000);

const submitSchema = z.object({
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().max(320),
  projectName: z.string().min(1).max(255),
  responses: z.record(z.string().max(100), z.unknown()),
});

// GET /public/brief-embed/:token
publicBriefEmbedRouter.get("/:token", getLimit, async (c) => {
  const token = c.req.param("token").trim();
  const result = await briefEmbedService.getPublicFormConfig(token);
  // Never leak workspaceId in public payload
  return c.json({
    data: {
      embedId: result.embedId,
      formConfig: result.formConfig,
    },
  });
});

// POST /public/brief-embed/:token/submit
publicBriefEmbedRouter.post(
  "/:token/submit",
  submitLimit,
  zValidator("json", submitSchema),
  async (c) => {
    const token = c.req.param("token").trim();
    const body = c.req.valid("json");
    const result = await briefEmbedService.submitPublicForm(token, body);
    return c.json({ data: result }, 201);
  },
);
