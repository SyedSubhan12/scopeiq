import { dispatchJob } from "../lib/queue.js";
import {
  db,
  scopeFlags,
  projects,
  sowClauses,
  rateCardItems,
  eq,
  and,
  isNull,
} from "@novabots/db";

const QUEUE_NAME = "change-order-generation";
const JOB_NAME = "generate-change-order";

/**
 * Dispatches a change order generation job to the AI worker.
 * Pre-fetches all context data so the worker doesn't need DB access.
 */
export async function dispatchGenerateChangeOrderJob(
  scopeFlagId: string,
  workspaceId: string,
): Promise<string> {
  // 1. Fetch the scope flag
  const [flag] = await db
    .select({
      id: scopeFlags.id,
      projectId: scopeFlags.projectId,
      title: scopeFlags.title,
      description: scopeFlags.description,
      aiReasoning: scopeFlags.aiReasoning,
      severity: scopeFlags.severity,
      sowClauseId: scopeFlags.sowClauseId,
    })
    .from(scopeFlags)
    .where(and(eq(scopeFlags.id, scopeFlagId), eq(scopeFlags.workspaceId, workspaceId)))
    .limit(1);

  if (!flag) {
    throw new Error(`Scope flag ${scopeFlagId} not found in workspace ${workspaceId}`);
  }

  // 2. Fetch the project
  const [project] = await db
    .select({ id: projects.id, name: projects.name, sowId: projects.sowId })
    .from(projects)
    .where(and(eq(projects.id, flag.projectId), isNull(projects.deletedAt)))
    .limit(1);

  // 3. Fetch SOW clauses
  let sowClausesList: Array<{
    id: string;
    clause_type: string;
    summary: string | null;
    original_text: string;
  }> = [];

  if (project?.sowId) {
    const clausesRows = await db
      .select({
        id: sowClauses.id,
        clause_type: sowClauses.clauseType,
        summary: sowClauses.summary,
        original_text: sowClauses.originalText,
      })
      .from(sowClauses)
      .where(eq(sowClauses.sowId, project.sowId))
      .orderBy(sowClauses.sortOrder);

    sowClausesList = clausesRows;
  }

  // 4. Fetch related clause if flag has sow_clause_id
  let relatedClause: {
    id: string;
    clause_type: string;
    summary: string | null;
    original_text: string;
  } | null = null;

  if (flag.sowClauseId) {
    const [row] = await db
      .select({
        id: sowClauses.id,
        clause_type: sowClauses.clauseType,
        summary: sowClauses.summary,
        original_text: sowClauses.originalText,
      })
      .from(sowClauses)
      .where(eq(sowClauses.id, flag.sowClauseId))
      .limit(1);

    if (row) relatedClause = row;
  }

  // 5. Fetch rate card items
  const rateCardRows = await db
    .select({
      id: rateCardItems.id,
      name: rateCardItems.name,
      description: rateCardItems.description,
      unit: rateCardItems.unit,
      rate_in_cents: rateCardItems.rateInCents,
      currency: rateCardItems.currency,
    })
    .from(rateCardItems)
    .where(and(eq(rateCardItems.workspaceId, workspaceId), isNull(rateCardItems.deletedAt)))
    .orderBy(rateCardItems.name);

  // 6. Build the job payload with all context
  return dispatchJob(QUEUE_NAME, JOB_NAME, {
    scope_flag_id: scopeFlagId,
    workspace_id: workspaceId,
    flag_context: {
      title: flag.title,
      description: flag.description,
      ai_reasoning: flag.aiReasoning,
      severity: flag.severity,
      sow_clause: relatedClause
        ? {
            id: relatedClause.id,
            clause_type: relatedClause.clause_type,
            summary: relatedClause.summary,
            original_text: relatedClause.original_text,
          }
        : null,
    },
    project_context: {
      name: project?.name ?? "Unknown",
    },
    sow_clauses: sowClausesList.map((c) => ({
      id: c.id,
      clause_type: c.clause_type,
      summary: c.summary,
      original_text: c.original_text,
    })),
    rate_card_items: rateCardRows.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      unit: item.unit,
      rate_in_cents: item.rate_in_cents,
      currency: item.currency,
    })),
  });
}
