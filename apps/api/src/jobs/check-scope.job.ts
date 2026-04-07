import { dispatchJob } from "../lib/queue.js";
import { db, projects, sowClauses, eq, and, isNull } from "@novabots/db";

const QUEUE_NAME = "scope-check";
const JOB_NAME = "scope-check";

/**
 * Dispatches a scope check job to the AI worker when a message is ingested.
 * Pre-fetches SOW clauses so the worker doesn't need DB access.
 */
export async function dispatchCheckScopeJob(
  messageId: string,
  projectId: string,
  workspaceId: string,
  text: string,
  authorId?: string | null,
): Promise<string> {
  // Pre-fetch project and SOW clauses so the worker doesn't need DB access
  const [project] = await db
    .select({ sowId: projects.sowId })
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);

  let clauses: Array<{
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
      .where(eq(sowClauses.sowId, project.sowId));

    clauses = clausesRows;
  }

  return dispatchJob(QUEUE_NAME, JOB_NAME, {
    message_id: messageId,
    project_id: projectId,
    workspace_id: workspaceId,
    text,
    author_id: authorId ?? null,
    clauses: clauses.map((c) => ({
      id: c.id,
      clause_type: c.clause_type,
      summary: c.summary,
      original_text: c.original_text,
    })),
  });
}
