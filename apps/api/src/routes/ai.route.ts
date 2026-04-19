import { Hono } from "hono";

export const aiRouter = new Hono();

// Dev-only AI test routes. Rule 3: all production AI work must flow via BullMQ gateway.
// Set DEV_MODE=true in .env to enable these for local/manual testing only.
if (process.env.DEV_MODE === "true") {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

  aiRouter.post("/predict-clarity", async (c) => {
    const body = await c.req.json();

    const res = await fetch(`${AI_SERVICE_URL}/predict-clarity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return c.json(data);
  });
}
