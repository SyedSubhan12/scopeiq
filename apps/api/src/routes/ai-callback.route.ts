import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
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
  eq,
  and,
  isNull,
  sql,
} from "@novabots/db";
import type { ClauseType, SowStatus } from "@novabots/db";
import { dispatchScopeFlagAlertJob } from "../jobs/scope-flag-alert.job.js";
import { dispatchClarificationEmail } from "../services/clarification-email.service.js";
import { computeSlaDeadline } from "../services/scope-flag.service.js";

// ---------------------------------------------------------------------------
// Middleware — shared-secret validation
// ---------------------------------------------------------------------------

const AI_CALLBACK_SECRET = process.env.AI_CALLBACK_SECRET;

const aiSecretMiddleware = async (c: Parameters<Parameters<Hono["use"]>[1]>[0], next: () => Promise<void>) => {
  const secret = c.req.header("X-AI-Secret");
  if (!AI_CALLBACK_SECRET || !secret || secret !== AI_CALLBACK_SECRET) {
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

// POST /api/ai-callback/sow-parsed
aiCallbackRouter.post("/sow-parsed", zValidator("json", sowParsedSchema), async (c) => {
  const payload = c.req.valid("json");

  // Fetch workspaceId for audit log
  const [existingSow] = await db
    .select({ workspaceId: statementsOfWork.workspaceId, parsedAt: statementsOfWork.parsedAt })
    .from(statementsOfWork)
    .where(eq(statementsOfWork.id, payload.sowId))
    .limit(1);

  if (!existingSow) {
    return c.json({ error: "SOW not found", sowId: payload.sowId }, 404);
  }

  // Idempotency: check if SOW already parsed
  if (existingSow.parsedAt) {
    return c.json({ status: "already_processed", sowId: payload.sowId }, 200);
  }

  const result = await db.transaction(async (trx) => {
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

    // Mark SOW as parsed and transition status: draft → parsed
    await trx
      .update(statementsOfWork)
      .set({ status: "parsed" as SowStatus, parsedAt: new Date(), updatedAt: new Date() })
      .where(eq(statementsOfWork.id, payload.sowId));

    // Audit log
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId: existingSow.workspaceId,
      actorId: null,
      actorType: "system",
      entityType: "statement_of_work",
      entityId: payload.sowId,
      action: "update",
      metadata: { action: "ai_parse_complete", clauseCount: payload.clauses.length, jobId: payload.jobId, status: "parsed" },
    });

    return { clauseCount: payload.clauses.length };
  });

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

  // Idempotency: check if message already processed
  if (payload.messageId) {
    const [msg] = await db
      .select({ status: messages.status })
      .from(messages)
      .where(eq(messages.id, payload.messageId))
      .limit(1);

    if (msg && msg.status !== "pending_check") {
      return c.json({ status: "already_processed", messageId: payload.messageId }, 200);
    }
  }

  // Fetch project to get workspaceId and sowId
  const [project] = await db
    .select({ workspaceId: projects.workspaceId, sowId: projects.sowId })
    .from(projects)
    .where(and(eq(projects.id, payload.projectId), isNull(projects.deletedAt)))
    .limit(1);

  if (!project) {
    return c.json({ error: "Project not found", projectId: payload.projectId }, 404);
  }

  const slaDeadline = await computeSlaDeadline(project.workspaceId);

  const result = await db.transaction(async (trx) => {
    let flagId: string | null = null;

    // If deviation detected, create a scope flag
    if (payload.isDeviation && payload.confidence > 0.60) {
      const [flag] = await trx
        .insert(scopeFlags)
        .values({
          workspaceId: project.workspaceId,
          projectId: payload.projectId,
          sowClauseId: payload.matchedClauseId ?? null,
          messageText: payload.reasoning, // The reasoning serves as the message text reference
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
          },
          slaDeadline,
          slaBreached: false,
        })
        .returning();

      flagId = flag?.id ?? null;
    }

    // Update message status
    if (payload.messageId) {
      const newStatus = (payload.isDeviation && payload.confidence > 0.60) ? "flagged" : "checked";
      await trx
        .update(messages)
        .set({ status: newStatus })
        .where(eq(messages.id, payload.messageId));
    }

    // Audit log
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId: project.workspaceId,
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

  // Dispatch 2-hour delayed email alert for new scope flags (outside transaction)
  if (result.flagId) {
    await dispatchScopeFlagAlertJob(result.flagId, project.workspaceId, payload.projectId)
      .catch((err) => {
        console.error(`[ScopeFlagAlert] Failed to dispatch alert job: ${err.message}`);
      });
  }

  return c.json({ ok: true, ...result }, 200);
});

// POST /api/ai-callback/change-order-generated
aiCallbackRouter.post("/change-order-generated", zValidator("json", changeOrderGeneratedSchema), async (c) => {
  const payload = c.req.valid("json");

  // Idempotency: check if change order already exists for this scope flag
  const [existingCO] = await db
    .select({ id: changeOrders.id })
    .from(changeOrders)
    .where(eq(changeOrders.scopeFlagId, payload.scopeFlagId))
    .limit(1);

  // Also check if the specific change order ID already exists (by our UUID)
  const [existingById] = await db
    .select({ id: changeOrders.id })
    .from(changeOrders)
    .where(eq(changeOrders.id, payload.changeOrderId))
    .limit(1);

  if (existingCO || existingById) {
    return c.json({ status: "already_processed", changeOrderId: existingById?.id ?? existingCO?.id }, 200);
  }

  // Verify scope flag exists and get workspace/project
  const [flag] = await db
    .select({ workspaceId: scopeFlags.workspaceId, projectId: scopeFlags.projectId })
    .from(scopeFlags)
    .where(eq(scopeFlags.id, payload.scopeFlagId))
    .limit(1);

  if (!flag) {
    return c.json({ error: "Scope flag not found", scopeFlagId: payload.scopeFlagId }, 404);
  }

  const result = await db.transaction(async (trx) => {
    // Build pricing object: prefer worker-supplied pricingJson, fall back to totalAmountCents
    const pricingValue = payload.pricingJson
      ? {
          subtotal_cents: payload.pricingJson.subtotalCents ?? payload.totalAmountCents,
          tax_cents: payload.pricingJson.taxCents ?? 0,
          total_cents: payload.pricingJson.totalCents ?? payload.totalAmountCents,
          currency: payload.pricingJson.currency ?? "USD",
          line_item_count: payload.pricingJson.lineItemCount ?? payload.lineItems.length,
        }
      : payload.totalAmountCents > 0
        ? { total_cents: payload.totalAmountCents, currency: "USD" }
        : null;

    // Insert change order — scopeItemsJson is persisted here so that
    // changeOrderService.acceptWithFullTransaction() can read it and insert
    // new SOW clauses when the client accepts the change order.
    await trx.insert(changeOrders).values({
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
      // scopeItemsJson stores the AI-generated SOW clause objects so that
      // acceptWithFullTransaction can append them to the project SOW on acceptance.
      scopeItemsJson: payload.scopeItemsJson.length > 0 ? payload.scopeItemsJson : [],
    });

    // Update scope flag status
    await trx
      .update(scopeFlags)
      .set({ status: "change_order_sent", updatedAt: new Date() })
      .where(eq(scopeFlags.id, payload.scopeFlagId));

    // Audit log — must be in the same transaction as the INSERT
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

    return { changeOrderId: payload.changeOrderId, title: payload.title, totalAmountCents: payload.totalAmountCents };
  });

  return c.json({ status: "ok", ...result }, 200);
});

// POST /api/ai-callback/brief-scored
aiCallbackRouter.post("/brief-scored", zValidator("json", briefScoredSchema), async (c) => {
  const payload = c.req.valid("json");

  // Fetch workspaceId for audit log
  const [existingBrief] = await db
    .select({ workspaceId: briefs.workspaceId, scoredAt: briefs.scoredAt })
    .from(briefs)
    .where(eq(briefs.id, payload.briefId))
    .limit(1);

  if (!existingBrief) {
    return c.json({ error: "Brief not found", briefId: payload.briefId }, 404);
  }

  // Idempotency: check if brief already scored
  if (existingBrief.scoredAt) {
    return c.json({ status: "already_processed", briefId: payload.briefId }, 200);
  }

  const scoringResult = {
    score: payload.score,
    summary: payload.summary,
    flags: payload.flags,
  };

  const result = await db.transaction(async (trx) => {
    // Update brief
    await trx
      .update(briefs)
      .set({
        scopeScore: payload.score,
        scoringResultJson: scoringResult,
        scoredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(briefs.id, payload.briefId));

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
    // First, get the project_id from the brief
    const [briefProject] = await trx
      .select({ projectId: briefs.projectId })
      .from(briefs)
      .where(eq(briefs.id, payload.briefId))
      .limit(1);

    if (briefProject) {
      const newProjectStatus = payload.status === "scored" ? "brief_scored" : "awaiting_brief";
      await trx
        .update(projects)
        .set({
          status: newProjectStatus,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, briefProject.projectId), isNull(projects.deletedAt)));
    }

    // Audit log
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId: existingBrief.workspaceId,
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
        projectStatusUpdated: briefProject ? true : false,
      },
    });

    return { briefId: payload.briefId, score: payload.score, briefStatus: payload.status };
  });

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

  return c.json({ status: "ok", ...result }, 200);
});

// POST /api/ai-callback/feedback-summarized
aiCallbackRouter.post("/feedback-summarized", zValidator("json", feedbackSummarizedSchema), async (c) => {
  const payload = c.req.valid("json");

  // Fetch workspaceId for audit log
  const [existingDeliverable] = await db
    .select({ workspaceId: deliverables.workspaceId, aiFeedbackSummary: deliverables.aiFeedbackSummary })
    .from(deliverables)
    .where(eq(deliverables.id, payload.deliverableId))
    .limit(1);

  if (!existingDeliverable) {
    return c.json({ error: "Deliverable not found", deliverableId: payload.deliverableId }, 404);
  }

  // Idempotency: check if deliverable already has AI summary
  if (existingDeliverable.aiFeedbackSummary) {
    return c.json({ status: "already_processed", deliverableId: payload.deliverableId }, 200);
  }

  const summary = {
    tasks: payload.tasks,
    overallNotes: payload.overallNotes,
    taskCount: payload.taskCount,
  };

  const result = await db.transaction(async (trx) => {
    // Update deliverable
    await trx
      .update(deliverables)
      .set({
        aiFeedbackSummary: summary,
        updatedAt: new Date(),
      })
      .where(eq(deliverables.id, payload.deliverableId));

    // Audit log
    await writeAuditLog(trx as Parameters<typeof writeAuditLog>[0], {
      workspaceId: existingDeliverable.workspaceId,
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

  return c.json({ status: "ok", ...result }, 200);
});
