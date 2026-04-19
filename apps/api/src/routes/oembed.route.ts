import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { fetchOembedPreview } from "../lib/oembed.js";

const querySchema = z.object({ url: z.string().url() });

export const oembedRouter = new Hono();

oembedRouter.use("*", authMiddleware);

oembedRouter.get("/", zValidator("query", querySchema), async (c) => {
  const { url } = c.req.valid("query");
  const preview = await fetchOembedPreview(url);
  return c.json({ data: preview });
});
