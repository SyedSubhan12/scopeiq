import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/error.js";
import { healthRouter } from "./routes/health.route.js";
import { env } from "./lib/env.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({ origin: "*" })); // Configure for production later
app.onError(errorHandler);

// Routes
app.route("/health", healthRouter);

const port = Number(process.env.PORT) || 4000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

export default app;
