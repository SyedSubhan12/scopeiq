import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { timingSafeEqual } from "node:crypto";
import { aiRateLimitMiddleware } from "../middleware/ai-rate-limiter.js";
import {
  db,
  writeAuditLog,
  statementsOfWork,
  sowClauses,
  scopeFlags,
  changeOrders,
  briefs,
  briefVersions,
  deliverables,
  messages,
  projects,
  clients,
  workspaces,
  eq,
  and,
  isNull,
  sql,
} from "@novabots/db";
import type { ClauseType, SowStatus } from "@novabots/db";
import { dispatchScopeFlagAlertJob } from "../jobs/scope-flag-alert.job.js";
import { dispatchClarificationEmail } from "../services/clarification-email.service.js";
import { computeSlaDeadline } from "../services/scope-flag.service.js";
import { logProjectEvent } from "../repositories/project-intelligence.repository.js";
import { takeRateService } from "../services/take-rate.service.js";

// ---------------------------------------------------------------------------
// Middleware — shared-secret validation
// ---------------------------------------------------------------------------

const AI_CALLBACK_SECRET = process.env.AI_CALLBACK_SECRET;

const aiSecretMiddleware = async (c: Parameters<Parameters<Hono["use"]>[1]>[0], next: () => Promise<void>) => {
  const secret = c.req.header("X-AI-Secret");
  if (!AI_CALLBACK_SECRET || !secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  // Constant-time compare to prevent prefix-extension timing oracle (FIND-006).
  const a = Buffer.from(secret);
  const b = Buffer.from(AI_CALLBACK_SECRET);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const sowParsedSchema = z.object({
  jobId: z.string().optional(),
  sowId: z.string().uuid(),
  projectId: z.string().uuid().optional().nullable(),
  clauses: z.array(
    z.object({
      clauseType: z.string(),
      originalText: z.string(),
      summary: z.string().nullable().optional(),
      sortOrder: z.number().int().default(0),
    }),
  ),
  clauseCount: z.number().int().optional(),
});

const scopeCheckedSchema = z.object({
  jobId: z.string().optional(),
  messageId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid(),
  isDeviation: z.boolean(),
  confidence: z.number(),
  reasoning: z.string(),
  suggestedSeverity: z.string().optional().nullable(),
  suggestedResponse: z.string().optional().nullable(),
  matchedClauseId: z.string().uuid().optional().nullable(),
  matchingClauses: z.array(z.object({
    clauseId: z.string(),
    clauseText: z.string(),
    relevance: z.number().optional(),
  })).optional().default([]),
  flagId: z.string().uuid().optional().nullable(),
  durationMs: z.number().optional(),
  slaMet: z.boolean().optional(),
});

const changeOrderGeneratedSchema = z.object({
  jobId: z.string().optional(),
  scopeFlagId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  changeOrderId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  lineItems: z.array(z.object({
    rateCardItemId: z.string().optional(),
    rateCardName: z.string(),
    quantity: z.number(),
    unit: z.string(),
    rateInCents: z.number(),
    subtotalCents: z.number(),
  })).optional().default([]),
  totalAmountCents: z.number().default(0),
  // New fields: persisted so acceptWithFullTransaction can consume them
  scopeItemsJson: z.array(z.object({
    clauseType: z.string(),
    originalText: z.string(),
    summary: z.string().optional().nullable(),
    sortOrder: z.number().int().optional(),
  })).optional().default([]),
  pricingJson: z.object({
    subtotalCents: z.number().optional(),
    taxCents: z.number().optional(),
    totalCents: z.number().optional(),
    currency: z.string().optional(),
    lineItemCount: z.number().int().optional(),
  }).optional().nullable(),
});

const briefScoredSchema = z.object({
  jobId: z.string().optional(),
  briefId: z.string().uuid(),
  score: z.number().int(),
  summary: z.string(),
  flags: z.array(z.object({
    fieldKey: z.string(),
    reason: z.string(),
    severity: z.string(),
    suggestedQuestion: z.string(),
  })).optional().default([]),
  status: z.enum(["clarification_needed", "scored"]),
  flagCount: z.number().int().optional(),
});

const feedbackSummarizedSchema = z.object({
  jobId: z.string().optional(),
  deliverableId: z.string().uuid(),
  tasks: z.array(z.object({
    action: z.string(),
    impact: z.string(),
    sourcePin: z.number().int(),
    contradiction: z.boolean().optional(),
    conflictExplanation: z.string().nullable().optional(),
  })).optional().default([]),
  overallNotes: z.string().optional().nullable(),
  taskCount: z.number().int().optional(),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const aiCallbackRouter = new Hono();

aiCallbackRouter.use("*", aiSecretMiddleware);

// Body-size guard — placed after aiSecretMiddleware so unauthenticated
// requests are rejected before we inspect headers.
aiCallbackRouter.use("*", async (c, next) => {
  const len = Number(c.req.header("content-length") ?? 0);
  if (len > 5 * 1024 * 1024) {
    return c.json({ error: "Body too large" }, 413);
  }
  await next();
});

// POST /api/ai-callback/sow-parsed
aiCallbackRouter.post("/sow-parsed", zValidator("json", sowParsedSchema), async (c) => {
  const payload = c.req.valid("json");

  const result = await db.transaction(async (trx) => {
    // Lock the SOW row and check for prior parse atomically
    const updated = await trx
      .update(statementsOfWork)
      .set({ status: "parsed" as SowStatus, parsedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(statementsOfWork.id, payload.sowId), isNull(statementsOfWork.parsedAt)))
      .returning({ workspaceId: statementsOfWork.workspaceId });

    if (updated.length === 0) {
      // Either SOW doesn't exist or was already parsed — distinguish
      const [exists] = await trx
        .select({ workspaceId: statementsOfWork.workspaceId })
        .from(statementsOfWork)
        .where(eq(statementsOfWork.id, payload.sowId))
        .limit(1);
      if (!exists) return { notFound: true as const };
      return { alreadyProcessed: true as const, sowId: payload.sowId };
    }

    const workspaceId = updated[0]!.workspaceId;

    // Delete auto-parsed placeholders
    await trx
      .delete(sowClauses)
      .where(eq(sowClauses.sowId, payload.sowId));

    // Insert AI-parsed clauses
    if (payload.clauses.length > 0) {
      await trx.insert(sowClauses).values(
        payload.clauses.map((clause, i) => ({
          sowId: payload.sowId,
          clauseType: clause.clauseType as ClauseType,
          originalText: clause.originalText,
          summary: clause.summary ?? null,
          sortOrder: clause.sortOrder ?? i,
        })),
      );
    }

    // Audit log
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "system",
      entityType: "statement_of_work",
      entityId: payload.sowId,
      action: "update",
      metadata: { action: "ai_parse_complete", clauseCount: payload.clauses.length, jobId: payload.jobId, status: "parsed" },
    });

    return { clauseCount: payload.clauses.length };
  });

  if ("notFound" in result) {
    return c.json({ error: "SOW not found", sowId: payload.sowId }, 404);
  }
  if ("alreadyProcessed" in result) {
    return c.json({ status: "already_processed", sowId: payload.sowId }, 200);
  }

  return c.json({ ok: true, ...result }, 200);
});

// POST /api/ai-callback/scope-checked
aiCallbackRouter.post(
  "/scope-checked",
  aiRateLimitMiddleware("check_scope", (c) =>
    c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "ai-service",
  ),
  zValidator("json", scopeCheckedSchema),
  async (c) => {
  const payload = c.req.valid("json");

  // Fetch project and workspace name for bilateral notification
  const [projectData] = await db
    .select({ 
      workspaceId: projects.workspaceId, 
      sowId: projects.sowId,
      workspaceName: workspaces.name
    })
    .from(projects)
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(and(eq(projects.id, payload.projectId), isNull(projects.deletedAt)))
    .limit(1);

  if (!projectData) {
    return c.json({ error: "Project not found", projectId: payload.projectId }, 404);
  }

  const slaDeadline = await computeSlaDeadline(projectData.workspaceId);

  const result = await db.transaction(async (trx) => {
    // Idempotency: atomically claim the message for processing.
    if (payload.messageId) {
      const newStatus = (payload.isDeviation && payload.confidence > 0.60) ? "flagged" : "checked";
      const claimed = await trx
        .update(messages)
        .set({ status: newStatus })
        .where(
          and(
            eq(messages.id, payload.messageId),
            eq(messages.projectId, payload.projectId),
            eq(messages.status, "pending_check"),
          ),
        )
        .returning({ id: messages.id });

      if (claimed.length === 0) {
        // Scope the existence check to projectId — prevents cross-workspace data
        // smearing where a message in workspace A's project could be linked to
        // workspace B's project via a crafted callback (FIND-018).
        const [exists] = await trx
          .select({ id: messages.id })
          .from(messages)
          .where(and(eq(messages.id, payload.messageId), eq(messages.projectId, payload.projectId)))
          .limit(1);
        if (!exists) return { notFound: true as const };
        return { alreadyProcessed: true as const, messageId: payload.messageId };
      }
    }

    let flagId: string | null = null;
    let systemMessageId: string | null = null;

    // Rule 8: Bilateral flag notification must be atomic.
    if (payload.isDeviation && payload.confidence > 0.60) {
      // 1. Create client portal system message
      const [systemMsg] = await trx
        .insert(messages)
        .values({
          workspaceId: projectData.workspaceId,
          projectId: payload.projectId,
          authorType: "system",
          source: "portal",
          status: "checked",
          body: `This request appears to fall outside our current agreement. ${projectData.workspaceName} has been notified and will follow up with options.`,
          scopeCheckStatus: "flagged",
        })
        .returning({ id: messages.id });
      
      systemMessageId = systemMsg?.id ?? null;

      // 2. Create agency scope flag record
      const [flag] = await trx
        .insert(scopeFlags)
        .values({
          workspaceId: projectData.workspaceId,
          projectId: payload.projectId,
          sowClauseId: payload.matchedClauseId ?? null,
          messageText: payload.reasoning,
          confidence: payload.confidence,
          title: "AI Detection: Possible Scope Deviation",
          description: payload.reasoning,
          severity: (payload.suggestedSeverity as any) ?? "medium",
          status: "pending",
          suggestedResponse: payload.suggestedResponse ?? null,
          aiReasoning: payload.reasoning,
          matchingClausesJson: payload.matchingClauses.map(mc => ({
            clause_id: mc.clauseId,
            clause_text: mc.clauseText,
            relevance: mc.relevance ?? 0,
          })),
          evidence: {
            confidence: payload.confidence,
            matched_clause_id: payload.matchedClauseId,
            message_id: payload.messageId,
            system_message_id: systemMessageId, // Link for "dismiss" logic in Rule 8
          },
          slaDeadline,
          slaBreached: false,
        })
        .returning();

      flagId = flag?.id ?? null;
    }

    // Audit log
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId: projectData.workspaceId,
      actorId: null,
      actorType: "system",
      entityType: payload.isDeviation ? "scope_flag" : "message",
      entityId: flagId ?? payload.messageId ?? payload.projectId,
      action: "create",
      metadata: {
        action: "ai_scope_check",
        isDeviation: payload.isDeviation,
        confidence: payload.confidence,
        flagId,
        systemMessageId,
        messageId: payload.messageId,
        durationMs: payload.durationMs,
        slaMet: payload.slaMet,
        jobId: payload.jobId,
      },
    });

    return {
      isDeviation: payload.isDeviation,
      confidence: payload.confidence,
      flagId,
    };
  });

  if ("notFound" in result) {
    return c.json({ error: "Message not found", messageId: payload.messageId }, 404);
  }
  if ("alreadyProcessed" in result) {
    return c.json({ status: "already_processed", messageId: payload.messageId }, 200);
  }

  // Dispatch 2-hour delayed email alert for new scope flags (outside transaction)
  if (result.flagId) {
    await dispatchScopeFlagAlertJob(result.flagId, projectData.workspaceId, payload.projectId)
      .catch((err) => {
        console.error(`[ScopeFlagAlert] Failed to dispatch alert job: ${err.message}`);
      });

    // Fire-and-forget Slack scope flag notification
    void (async () => {
      try {
        const [ws] = await db
          .select({ settingsJson: workspaces.settingsJson })
          .from(workspaces)
          .where(eq(workspaces.id, projectData.workspaceId))
          .limit(1);
        const settings = (ws?.settingsJson ?? {}) as Record<string, unknown>;
        const accessToken = settings["slackAccessToken"] as string | undefined;
        const channelId = settings["slackChannelId"] as string | undefined;
        if (accessToken && channelId) {
          // Look up project name for the notification
          const [projectRecord] = await db
            .select({ name: projects.name })
            .from(projects)
            .where(and(eq(projects.id, payload.projectId), isNull(projects.deletedAt)))
            .limit(1);
          const { sendSlackScopeFlag } = await import("../lib/slack.js");
          await sendSlackScopeFlag({
            accessToken,
            channelId,
            projectName: projectRecord?.name ?? "Unknown project",
            messageText: payload.reasoning,
            confidence: payload.confidence,
            flagId: result.flagId!, // non-null: we are inside `if (result.flagId)` block
          });
        }
      } catch (err) {
        console.error("[Slack] Failed to send scope flag notification:", err);
      }
    })();

    logProjectEvent({
      workspaceId: projectData.workspaceId,
      projectId: payload.projectId,
      eventType: "scope_flag_created",
      entityType: "scope_flag",
      entityId: result.flagId,
      summary: `Out-of-scope request detected (${payload.suggestedSeverity ?? "medium"}): ${payload.reasoning.slice(0, 80)}`,
      metadata: { confidence: result.confidence, flagId: result.flagId, messageId: payload.messageId },
    }).catch(() => undefined);
  }

  return c.json({ ok: true, ...result }, 200);
});

// POST /api/ai-callback/change-order-generated
aiCallbackRouter.post("/change-order-generated", zValidator("json", changeOrderGeneratedSchema), async (c) => {
  const payload = c.req.valid("json");

  const result = await db.transaction(async (trx) => {
    // Verify scope flag exists and get workspace/project — inside the transaction
    // so the flag lookup and the INSERT are atomic (no TOCTOU window).
    const [flag] = await trx
      .select({ workspaceId: scopeFlags.workspaceId, projectId: scopeFlags.projectId })
      .from(scopeFlags)
      .where(eq(scopeFlags.id, payload.scopeFlagId))
      .limit(1);

    if (!flag) return { notFound: true as const };

    // Build pricing object: prefer worker-supplied pricingJson, fall back to totalAmountCents
    const pricingValue = payload.pricingJson
      ? {
          amount: payload.pricingJson.subtotalCents ? payload.pricingJson.subtotalCents / 100 : payload.totalAmountCents / 100,
          currency: payload.pricingJson.currency ?? "USD",
          line_item_count: payload.pricingJson.lineItemCount ?? payload.lineItems.length,
        }
      : payload.totalAmountCents > 0
        ? { amount: payload.totalAmountCents / 100, currency: "USD" }
        : null;

    // FIND-009/014: atomic idempotent INSERT. Bare onConflictDoNothing catches
    // BOTH the PK conflict (worker re-dispatch with same changeOrderId) AND the
    // partial unique index `change_orders_one_open_per_flag` (worker retry that
    // mints a fresh changeOrderId for a flag that already has an open CO).
    // Either case is treated as already-processed — no second PaymentIntent is
    // ever created.
    const [inserted] = await trx
      .insert(changeOrders)
      .values({
        id: payload.changeOrderId,
        workspaceId: flag.workspaceId,
        projectId: flag.projectId,
        scopeFlagId: payload.scopeFlagId,
        title: payload.title,
        workDescription: payload.description ?? null,
        estimatedHours: payload.estimatedHours ?? null,
        pricing: pricingValue,
        currency: "USD",
        status: "draft",
        lineItemsJson: payload.lineItems.map(item => ({
          rate_card_item_id: item.rateCardItemId,
          rate_card_name: item.rateCardName,
          quantity: item.quantity,
          unit: item.unit,
          rate_in_cents: item.rateInCents,
          subtotal_cents: item.subtotalCents,
        })),
        scopeItemsJson: payload.scopeItemsJson.length > 0 ? payload.scopeItemsJson : [],
      })
      .onConflictDoNothing()
      .returning({ id: changeOrders.id });

    if (!inserted) {
      // Row already exists — idempotent success, no side-effects.
      return { alreadyProcessed: true as const, changeOrderId: payload.changeOrderId };
    }

    // Update scope flag status
    await trx
      .update(scopeFlags)
      .set({ status: "change_order_sent", updatedAt: new Date() })
      .where(eq(scopeFlags.id, payload.scopeFlagId));

    // Look up Stripe customer id for the post-commit PaymentIntent call.
    const [ws] = await trx
      .select({ stripeCustomerId: workspaces.stripeCustomerId })
      .from(workspaces)
      .where(eq(workspaces.id, flag.workspaceId))
      .limit(1);

    // Audit log for CO creation. PaymentIntent metadata is logged in a
    // separate audit row after the Stripe call commits (see post-tx block).
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId: flag.workspaceId,
      actorId: null,
      actorType: "system",
      entityType: "change_order",
      entityId: payload.changeOrderId,
      action: "create",
      metadata: {
        action: "ai_change_order_generated",
        title: payload.title,
        totalAmountCents: payload.totalAmountCents,
        scopeItemCount: payload.scopeItemsJson.length,
        scopeFlagId: payload.scopeFlagId,
        jobId: payload.jobId,
      },
    });

    return {
      changeOrderId: payload.changeOrderId,
      title: payload.title,
      totalAmountCents: payload.totalAmountCents,
      workspaceId: flag.workspaceId,
      projectId: flag.projectId,
      stripeCustomerId: ws?.stripeCustomerId ?? null,
      pricingAmount: pricingValue?.amount ?? null,
    };
  });

  if ("notFound" in result) {
    return c.json({ error: "Scope flag not found", scopeFlagId: payload.scopeFlagId }, 404);
  }
  if ("alreadyProcessed" in result) {
    return c.json({ status: "already_processed", changeOrderId: result.changeOrderId }, 200);
  }

  // FIND-002: Stripe PaymentIntent created OUTSIDE the DB transaction with an
  // idempotency key. A reconciliation worker should sweep change_orders rows
  // older than 60s with NULL stripe_payment_intent_id. If this call throws
  // here, the CO row exists in 'draft' with no intent — safe to retry.
  if (result.pricingAmount !== null && result.pricingAmount > 0) {
    try {
      const amountCents = Math.round(result.pricingAmount * 100);
      const intentMeta = await takeRateService.createPaymentIntent({
        workspaceId: result.workspaceId,
        changeOrderId: result.changeOrderId,
        amountCents,
        currency: "usd",
        customerId: result.stripeCustomerId,
      });

      await db.transaction(async (trx) => {
        await trx
          .update(changeOrders)
          .set({
            stripePaymentIntentId: intentMeta.paymentIntentId,
            takeRatePct: String(intentMeta.takeRatePct),
            takeRateAmountCents: intentMeta.takeRateAmountCents,
          })
          .where(eq(changeOrders.id, result.changeOrderId));

        await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
          workspaceId: result.workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "change_order",
          entityId: result.changeOrderId,
          action: "update",
          metadata: {
            action: "ai_change_order_payment_intent_created",
            paymentIntentId: intentMeta.paymentIntentId,
            takeRatePct: intentMeta.takeRatePct,
            takeRateAmountCents: intentMeta.takeRateAmountCents,
            scopeFlagId: payload.scopeFlagId,
          },
        });
      });
    } catch (err) {
      console.error(
        `[AICallback] PaymentIntent creation failed for CO ${result.changeOrderId} — reconciliation worker will retry:`,
        (err as Error).message,
      );
    }
  }

  logProjectEvent({
    workspaceId: result.workspaceId,
    projectId: result.projectId,
    eventType: "change_order_generated",
    entityType: "change_order",
    entityId: result.changeOrderId,
    summary: `Change order generated for ${result.title}`,
    metadata: { changeOrderId: result.changeOrderId, totalAmountCents: result.totalAmountCents, scopeFlagId: payload.scopeFlagId },
  }).catch(() => undefined);

  return c.json({ status: "ok", changeOrderId: result.changeOrderId, title: result.title, totalAmountCents: result.totalAmountCents }, 200);
});

// POST /api/ai-callback/brief-scored
aiCallbackRouter.post("/brief-scored", zValidator("json", briefScoredSchema), async (c) => {
  const payload = c.req.valid("json");

  const scoringResult = {
    score: payload.score,
    summary: payload.summary,
    flags: payload.flags,
  };

  const result = await db.transaction(async (trx) => {
    // Atomic idempotent UPDATE: only succeeds when scoredAt IS NULL (FIND-014).
    // Returns workspaceId and projectId so the rest of the handler doesn't need
    // a second SELECT outside the transaction.
    const updated = await trx
      .update(briefs)
      .set({
        scopeScore: payload.score,
        scoringResultJson: scoringResult,
        scoredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(briefs.id, payload.briefId), isNull(briefs.scoredAt)))
      .returning({ workspaceId: briefs.workspaceId, projectId: briefs.projectId });

    if (updated.length === 0) {
      // Either brief doesn't exist OR was already scored — distinguish
      const [exists] = await trx
        .select({ id: briefs.id })
        .from(briefs)
        .where(eq(briefs.id, payload.briefId))
        .limit(1);
      if (!exists) return { notFound: true as const };
      return { alreadyProcessed: true as const, briefId: payload.briefId };
    }

    const { workspaceId, projectId } = updated[0]!;

    // Update latest brief version
    const [latestVersion] = await trx
      .select({ id: briefVersions.id })
      .from(briefVersions)
      .where(eq(briefVersions.briefId, payload.briefId))
      .orderBy(briefVersions.versionNumber, sql`DESC`)
      .limit(1);

    if (latestVersion) {
      await trx
        .update(briefVersions)
        .set({
          scopeScore: payload.score,
          scoringResultJson: scoringResult,
          status: payload.status,
          updatedAt: new Date(),
        })
        .where(eq(briefVersions.id, latestVersion.id));
    }

    // Update project status based on brief scoring result
    if (projectId) {
      const newProjectStatus = payload.status === "scored" ? "brief_scored" : "awaiting_brief";
      await trx
        .update(projects)
        .set({
          status: newProjectStatus,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)));
    }

    // Audit log
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "system",
      entityType: "brief",
      entityId: payload.briefId,
      action: "update",
      metadata: {
        action: "ai_brief_scored",
        score: payload.score,
        status: payload.status,
        flagCount: payload.flagCount,
        jobId: payload.jobId,
        projectStatusUpdated: projectId ? true : false,
      },
    });

    return { briefId: payload.briefId, score: payload.score, briefStatus: payload.status, projectId: projectId ?? null, workspaceId };
  });

  if ("notFound" in result) {
    return c.json({ error: "Brief not found", briefId: payload.briefId }, 404);
  }
  if ("alreadyProcessed" in result) {
    return c.json({ status: "already_processed", briefId: payload.briefId }, 200);
  }

  logProjectEvent({
    workspaceId: result.workspaceId,
    projectId: result.projectId ?? payload.briefId,
    eventType: "brief_scored",
    entityType: "brief",
    entityId: payload.briefId,
    summary: `Brief scored ${payload.score}/100 — ${payload.flagCount ?? payload.flags.length} flags raised`,
    metadata: { score: payload.score, flagCount: payload.flagCount ?? payload.flags.length, status: payload.status },
  }).catch(() => undefined);

  // If clarification is needed, dispatch clarification email (outside transaction)
  if (payload.status === "clarification_needed" && payload.flags.length > 0) {
    // Fetch client email and project details for the email
    const [briefWithProject] = await db
      .select({
        projectId: briefs.projectId,
        workspaceId: briefs.workspaceId,
        submittedBy: briefs.submittedBy,
      })
      .from(briefs)
      .where(eq(briefs.id, payload.briefId))
      .limit(1);

    if (briefWithProject?.submittedBy) {
      const [clientRecord] = await db
        .select({ email: clients.contactEmail, name: clients.name })
        .from(clients)
        .where(eq(clients.id, briefWithProject.submittedBy))
        .limit(1);

      const [projectRecord] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, briefWithProject.projectId))
        .limit(1);

      if (clientRecord && projectRecord) {
        const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal`;
        dispatchClarificationEmail({
          briefId: payload.briefId,
          clientEmail: clientRecord.email ?? "",
          clientName: clientRecord.name ?? "there",
          projectName: projectRecord.name,
          portalUrl,
          flags: payload.flags.map((f) => ({
            fieldKey: f.fieldKey,
            fieldLabel: f.fieldKey,
            prompt: f.suggestedQuestion,
            severity: f.severity,
          })),
        }).catch((err) => {
          console.error(
            `[ClarificationEmail] Failed to dispatch email for brief ${payload.briefId}:`,
            err.message,
          );
        });
      }
    }
  }

  return c.json({ status: "ok", briefId: result.briefId, score: result.score, briefStatus: result.briefStatus, projectId: result.projectId }, 200);
});

// POST /api/ai-callback/feedback-summarized
aiCallbackRouter.post("/feedback-summarized", zValidator("json", feedbackSummarizedSchema), async (c) => {
  const payload = c.req.valid("json");

  const summary = {
    tasks: payload.tasks,
    overallNotes: payload.overallNotes,
    taskCount: payload.taskCount,
  };

  const result = await db.transaction(async (trx) => {
    // Atomic idempotent UPDATE: only succeeds when aiFeedbackSummary IS NULL (FIND-014).
    // Eliminates the racy pre-transaction SELECT that previously checked this field.
    const updated = await trx
      .update(deliverables)
      .set({
        aiFeedbackSummary: summary,
        updatedAt: new Date(),
      })
      .where(and(eq(deliverables.id, payload.deliverableId), isNull(deliverables.aiFeedbackSummary)))
      .returning({ workspaceId: deliverables.workspaceId });

    if (updated.length === 0) {
      // Either deliverable doesn't exist OR summary already set — distinguish
      const [exists] = await trx
        .select({ id: deliverables.id })
        .from(deliverables)
        .where(eq(deliverables.id, payload.deliverableId))
        .limit(1);
      if (!exists) return { notFound: true as const };
      return { alreadyProcessed: true as const, deliverableId: payload.deliverableId };
    }

    const workspaceId = updated[0]!.workspaceId;

    // Audit log
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: null,
      actorType: "system",
      entityType: "deliverable",
      entityId: payload.deliverableId,
      action: "update",
      metadata: {
        action: "ai_feedback_summarized",
        taskCount: payload.taskCount,
        jobId: payload.jobId,
      },
    });

    return { deliverableId: payload.deliverableId, taskCount: payload.taskCount };
  });

  if ("notFound" in result) {
    return c.json({ error: "Deliverable not found", deliverableId: payload.deliverableId }, 404);
  }
  if ("alreadyProcessed" in result) {
    return c.json({ status: "already_processed", deliverableId: payload.deliverableId }, 200);
  }

  return c.json({ status: "ok", ...result }, 200);
});
