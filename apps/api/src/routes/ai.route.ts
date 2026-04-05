import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";

export const aiRouter = new Hono();

// This router acts as a proxy to the FastAPI AI service
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

aiRouter.post("/predict-clarity", async (c) => {
    const body = await c.req.json();

    const res = await fetch(`${AI_SERVICE_URL}/predict-clarity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    return c.json(data);
});
