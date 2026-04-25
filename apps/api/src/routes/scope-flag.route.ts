import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { aiRateLimitMiddleware } from "../middleware/ai-rate-limiter.js";
import { scopeFlagService } from "../services/scope-flag.service.js";
import { dispatchGenerateChangeOrderJob } from "../jobs/generate-change-order.job.js";
import { dispatchSoftAskJob } from "../jobs/soft-ask.job.js";
import { NotFoundError } from "@novabots/types";
import { scopeFlagResponseSchema, updateScopeFlagSchema } from "./scope-flag.schemas.js";
import { db, projects, sowClauses, scopeFlags, eq, and, isNull, sql } from "@novabots/db";

export const scopeFlagRouter = new Hono();

scopeFlagRouter.use("*", authMiddleware);

scopeFlagRouter.get("/", async (c) => {
    const workspaceId = c.get("workspaceId");
    const projectId = c.req.query("projectId");
    const result = await scopeFlagService.list(workspaceId, projectId ?? undefined);
    return c.json(result);
});

// GET /scope-flags/sla-breaches — open flags sorted by slaDeadline asc (soonest breach first)
scopeFlagRouter.get("/sla-breaches", async (c) => {
    const workspaceId = c.get("workspaceId");
    const result = await scopeFlagService.listOpenSortedByBreach(workspaceId);
    return c.json(result);
});

scopeFlagRouter.get("/count", async (c) => {
    const workspaceId = c.get("workspaceId");
    const count = await scopeFlagService.countPending(workspaceId);
    return c.json({ data: { count } });
});

// Sprint 4 FEAT-SG-002: Scope flag metrics dashboard (total, p95 detection latency, flags/user/month).
// Latency is read from the `detection_latency_ms` field inside the jsonb `evidence` column
// (the scope-guard worker writes it there on insert).
scopeFlagRouter.get("/metrics", async (c) => {
    const workspaceId = c.get("workspaceId");

    const rows = await db.execute(sql`
        WITH recent AS (
            SELECT
                ${scopeFlags.evidence} AS evidence,
                ${scopeFlags.flaggedBy} AS flagged_by
            FROM ${scopeFlags}
            WHERE ${scopeFlags.workspaceId} = ${workspaceId}
              AND ${scopeFlags.createdAt} >= now() - interval '30 days'
        )
        SELECT
            (SELECT count(*)::int FROM ${scopeFlags} WHERE ${scopeFlags.workspaceId} = ${workspaceId}) AS total_flags,
            (SELECT count(*)::int FROM recent) AS flags_30d,
            (SELECT count(DISTINCT flagged_by)::int FROM recent WHERE flagged_by IS NOT NULL) AS active_users_30d,
            (
                SELECT COALESCE(
                    percentile_cont(0.95) WITHIN GROUP (
                        ORDER BY (evidence->>'detection_latency_ms')::int
                    ),
                    0
                )
                FROM recent
                WHERE evidence ? 'detection_latency_ms'
            )::int AS p95_latency_ms
    `);

    // drizzle's db.execute returns an object with `.rows`; fall back to `.` for compatibility.
    const first = Array.isArray(rows) ? rows[0] : (rows as { rows?: unknown[] }).rows?.[0];
    const row = (first ?? {}) as {
        total_flags?: number;
        flags_30d?: number;
        active_users_30d?: number;
        p95_latency_ms?: number;
    };

    const totalFlags = row.total_flags ?? 0;
    const flags30d = row.flags_30d ?? 0;
    const activeUsers30d = row.active_users_30d ?? 0;
    const p95LatencyMs = row.p95_latency_ms ?? 0;
    const flagsPerUserMonth = activeUsers30d > 0 ? flags30d / activeUsers30d : 0;

    return c.json({
        totalFlags,
        p95LatencyMs,
        flagsPerUserMonth,
    });
});

scopeFlagRouter.get("/:id", async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");
    const flag = await scopeFlagService.getById(workspaceId, id);
    return c.json(scopeFlagResponseSchema.parse({ data: flag }));
});

scopeFlagRouter.patch(
    "/:id",
    zValidator("json", updateScopeFlagSchema),
    async (c) => {
        const workspaceId = c.get("workspaceId");
        const userId = c.get("userId");
        const id = c.req.param("id");
        const { status, reason } = c.req.valid("json");
        const updated = await scopeFlagService.updateStatus(workspaceId, id, userId, { status, reason });
        return c.json(scopeFlagResponseSchema.parse({ data: updated }));
    },
);

scopeFlagRouter.post("/:id/generate-change-order", authMiddleware, aiRateLimitMiddleware("generate_change_order"), async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");

    const flag = await scopeFlagService.getById(workspaceId, id);
    if (!flag) throw new NotFoundError("Scope flag not found", id);

    await dispatchGenerateChangeOrderJob(id, workspaceId);

    return c.json({ data: { dispatched: true } });
});

// Generate a one-sentence "soft ask" warm response to an out-of-scope request.
// Returns a synchronous template-based suggestion immediately (target <300ms)
// and dispatches the full AI job in the background for richer variants.
const SOFT_ASK_TEMPLATES: Record<string, string> = {
    high: "Happy to explore that — since it's outside our current agreement, I'll put together a quick change order so we can move ahead cleanly.",
    medium: "That sounds great! Let me double-check our SOW and come back with a quick quote in the next day or so.",
    low: "Happy to help with that — I'll put together a quick note on timing and cost and send it over shortly.",
};

scopeFlagRouter.post("/:id/soft-ask", async (c) => {
    const workspaceId = c.get("workspaceId");
    const id = c.req.param("id");

    const flag = await scopeFlagService.getById(workspaceId, id);
    if (!flag) throw new NotFoundError("Scope flag not found", id);

    // Build a brief SOW summary for Claude context (non-blocking best-effort)
    let sowSummary = "the agreed project scope";
    try {
        const [project] = await db
            .select({ sowId: projects.sowId })
            .from(projects)
            .where(and(eq(projects.id, flag.projectId), eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)))
            .limit(1);

        if (project?.sowId) {
            const clauses = await db
                .select({ originalText: sowClauses.originalText, clauseType: sowClauses.clauseType })
                .from(sowClauses)
                .where(eq(sowClauses.sowId, project.sowId))
                .limit(4);

            if (clauses.length > 0) {
                sowSummary = clauses
                    .map((cl) => `${cl.clauseType}: ${cl.originalText.slice(0, 100)}`)
                    .join("; ");
            }
        }
    } catch {
        // Non-fatal; fall back to default summary
    }

    // Dispatch background AI job (fire and forget — richer variant will update the flag later)
    void dispatchSoftAskJob({
        scope_flag_id: id,
        workspace_id: workspaceId,
        flag_title: flag.title,
        flag_description: flag.description ?? null,
        sow_summary: sowSummary,
    }).catch(() => { /* swallow — we already have a template response */ });

    // Return a template-based suggestion synchronously so the UI feels instant
    const template =
        SOFT_ASK_TEMPLATES[flag.severity] ?? SOFT_ASK_TEMPLATES.medium ??
        "I'll put together a quick quote and send it over shortly.";

    return c.json({
        suggestion: template,
        confidence: 0.72,
        flagId: id,
    });
});
