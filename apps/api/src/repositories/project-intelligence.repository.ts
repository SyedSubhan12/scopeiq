import {
  db,
  projectIntelligence,
  eq,
  and,
  desc,
  lt,
  sql,
} from "@novabots/db";
import type {
  ProjectIntelligence,
  ProjectIntelligenceEventType,
  ProjectIntelligenceEntityType,
} from "@novabots/db";

export type ProjectIntelligenceRow = ProjectIntelligence;

export async function logProjectEvent(params: {
  workspaceId: string;
  projectId: string;
  clientId?: string;
  eventType: ProjectIntelligenceEventType;
  entityType: ProjectIntelligenceEntityType;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(projectIntelligence).values({
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      clientId: params.clientId ?? null,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      summary: params.summary,
      metadataJson: params.metadata ?? null,
    });
  } catch (err) {
    console.error("[ProjectIntelligence] Failed to log event:", err);
  }
}

export async function searchProjectIntelligence(params: {
  workspaceId: string;
  projectId?: string;
  clientId?: string;
  query?: string;
  eventType?: string;
  limit: number;
  cursor?: string | null;
}): Promise<{ data: ProjectIntelligenceRow[]; nextCursor: string | null }> {
  const limit = params.limit;
  const conditions = [eq(projectIntelligence.workspaceId, params.workspaceId)];

  if (params.projectId) {
    conditions.push(eq(projectIntelligence.projectId, params.projectId));
  }
  if (params.clientId) {
    conditions.push(eq(projectIntelligence.clientId, params.clientId));
  }
  if (params.eventType) {
    conditions.push(
      eq(
        projectIntelligence.eventType,
        params.eventType as ProjectIntelligenceEventType,
      ),
    );
  }
  if (params.query) {
    conditions.push(
      sql`${projectIntelligence.id} IN (
        SELECT id FROM project_intelligence
        WHERE searchable_text @@ plainto_tsquery('english', ${params.query})
          AND workspace_id = ${params.workspaceId}
      )`,
    );
  }
  if (params.cursor) {
    conditions.push(lt(projectIntelligence.createdAt, new Date(params.cursor)));
  }

  const rows = await db
    .select()
    .from(projectIntelligence)
    .where(and(...conditions))
    .orderBy(desc(projectIntelligence.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = data[data.length - 1];
  const nextCursor =
    hasMore && lastRow ? lastRow.createdAt.toISOString() : null;

  return { data, nextCursor };
}

export async function getClientHistory(params: {
  workspaceId: string;
  clientId: string;
  limit: number;
  cursor?: string | null;
}): Promise<{ data: ProjectIntelligenceRow[]; nextCursor: string | null }> {
  const limit = params.limit;
  const conditions = [
    eq(projectIntelligence.workspaceId, params.workspaceId),
    eq(projectIntelligence.clientId, params.clientId),
  ];

  if (params.cursor) {
    conditions.push(lt(projectIntelligence.createdAt, new Date(params.cursor)));
  }

  const rows = await db
    .select()
    .from(projectIntelligence)
    .where(and(...conditions))
    .orderBy(desc(projectIntelligence.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = data[data.length - 1];
  const nextCursor =
    hasMore && lastRow ? lastRow.createdAt.toISOString() : null;

  return { data, nextCursor };
}
