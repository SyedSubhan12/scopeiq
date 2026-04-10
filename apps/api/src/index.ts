import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/error.js";
import { corsConfig } from "./lib/cors.js";
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
import { portalChangeOrderRouter } from "./routes/portal-change-order.route.js";
import { emailApprovalRouter } from "./routes/email-approval.route.js";
import { portalRouter } from "./routes/portal.route.js";
import { sowRouter } from "./routes/sow.route.js";
import { inviteRouter } from "./routes/invite.route.js";
import { scopeFlagRouter } from "./routes/scope-flag.route.js";
import { changeOrderRouter } from "./routes/change-order.route.js";
import { messageIngestRouter } from "./routes/message-ingest.route.js";
import { notificationRouter } from "./routes/notification.route.js";
import { analyticsRouter } from "./routes/analytics.route.js";
import { aiRouter } from "./routes/ai.route.js";
import { aiCallbackRouter } from "./routes/ai-callback.route.js";
import { billingRouter } from "./routes/billing.route.js";
import { dashboardRouter } from "./routes/dashboard.route.js";
import webhookStripe from "./routes/webhook-stripe.route.js";
import { resendWebhookRouter } from "./routes/resend-webhook.route.js";
import { env } from "./lib/env.js";
import { scheduleHourlyReminders, startReminderWorker } from "./jobs/send-reminder.job.js";
import { ensureBucketExists } from "./lib/storage.js";
import { portalRateLimiter } from "./middleware/portal-rate-limiter.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", corsConfig);
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
v1.route("/scope-flags", scopeFlagRouter);
v1.route("/change-orders", changeOrderRouter);
v1.route("/messages", messageIngestRouter);
v1.route("/notifications", notificationRouter);
v1.route("/analytics", analyticsRouter);
v1.route("/ai", aiRouter);
v1.route("/billing", billingRouter);
v1.route("/dashboard", dashboardRouter);
v1.route("/sow", sowRouter);

app.route("/v1", v1);

// Public Stripe webhook (outside /v1, no auth)
app.route("/webhooks/stripe", webhookStripe);

// Public Resend webhook (outside /v1, no auth)
app.route("/webhooks/resend", resendWebhookRouter);

// Public routes (outside /v1)
app.route("/briefs/submit", briefSubmitRouter);

// Portal routes (token-authenticated, rate-limited)
app.use("/portal/*", portalRateLimiter);
app.route("/portal", portalRouter);
app.route("/portal/deliverables", portalDeliverableRouter);
app.route("/portal/session", portalSessionRouter);
app.route("/portal/deliverables", portalDeliverableRouter);
app.route("/portal/change-orders", portalChangeOrderRouter);
app.route("/portal", portalRouter);

// Email approval links (HMAC-token authenticated, public)
app.route("/api/portal/email-approve", emailApprovalRouter);

// Note: invite acceptance (POST /accept) is handled within /v1/invites — no separate mount needed.

const port = Number(env.PORT) || 4000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});

// Ensure MinIO bucket exists (no-op if already present; creates on a fresh volume)
ensureBucketExists().catch((err) => {
    console.error("[Startup] Failed to ensure storage bucket exists:", err);
});

// Start BullMQ worker to process reminder jobs
startReminderWorker().catch((err) => {
    console.error("[Startup] Failed to start reminder worker:", err);
});

// Register hourly reminder cron after server starts
scheduleHourlyReminders().catch((err) => {
    console.error("[Startup] Failed to schedule reminders:", err);
});

// Start scope flag alert worker (processes delayed 2-hour email fallback jobs)
startScopeFlagAlertWorker();

// Start brief scoring worker (processes AI scoring jobs from brief-scoring queue)
startBriefScoringWorker();

// Start clarification email worker (sends clarification request emails to clients)
startClarificationEmailWorker();

export default app;
