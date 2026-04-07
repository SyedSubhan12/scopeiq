import { Hono } from "hono";
import { rateLimiter } from "../middleware/rate-limiter.js";

export const briefSubmitRouter = new Hono();

// Legacy public endpoint intentionally disabled.
// Public brief submission now requires a portal token so the server derives
// project and workspace context instead of trusting client-supplied IDs.
briefSubmitRouter.post(
  "/",
  rateLimiter(10, 60 * 60 * 1000),
  async (c) => {
    return c.json(
      {
        message:
          "Public brief submission is deprecated. Use the secure portal brief submission flow.",
      },
      410,
    );
  },
);
