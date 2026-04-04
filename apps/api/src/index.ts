import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/error.js";
import { healthRouter } from "./routes/health.route.js";
import { authRouter } from "./routes/auth.route.js";
import { workspaceRouter } from "./routes/workspace.route.js";
import { projectRouter } from "./routes/project.route.js";
import { clientRouter } from "./routes/client.route.js";
import { rateCardRouter } from "./routes/rate-card.route.js";
import { auditLogRouter } from "./routes/audit-log.route.js";
import { briefTemplateRouter } from "./routes/brief-template.route.js";
import { briefRouter } from "./routes/brief.route.js";
import { briefSubmitRouter } from "./routes/brief-submit.route.js";
import { deliverableRouter } from "./routes/deliverable.route.js";
import { feedbackRouter } from "./routes/feedback.route.js";
import { portalDeliverableRouter } from "./routes/portal-deliverable.route.js";
import { portalSessionRouter } from "./routes/portal-session.route.js";
import { inviteRouter } from "./routes/invite.route.js";
import { env } from "./lib/env.js";
import { scheduleHourlyReminders } from "./jobs/send-reminder.job.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({ origin: "*" })); // Configure for production later
app.onError(errorHandler);

// Routes
app.route("/health", healthRouter);
app.route("/auth", authRouter);

// Protected API routes (v1)
const v1 = new Hono();
v1.route("/workspaces", workspaceRouter);
v1.route("/projects", projectRouter);
v1.route("/clients", clientRouter);
v1.route("/rate-card", rateCardRouter);
v1.route("/audit-log", auditLogRouter);
v1.route("/brief-templates", briefTemplateRouter);
v1.route("/briefs", briefRouter);
v1.route("/deliverables", deliverableRouter);
v1.route("/feedback", feedbackRouter);
v1.route("/invites", inviteRouter);

app.route("/v1", v1);

// Public routes (outside /v1)
app.route("/briefs/submit", briefSubmitRouter);

// Portal routes (token-authenticated)
app.route("/portal/deliverables", portalDeliverableRouter);
app.route("/portal/session", portalSessionRouter);

// Public invite acceptance (outside /v1)
app.route("/invites", inviteRouter);

const port = Number(env.PORT) || 4000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

// Register hourly reminder cron after server starts
scheduleHourlyReminders().catch((err) => {
    console.error("[Startup] Failed to schedule reminders:", err);
});

export default app;
