import {
  db,
  briefClarificationRequests,
  briefClarificationItems,
  writeAuditLog,
  eq,
  and,
  isNull,
  asc,
  desc,
} from "@novabots/db";
import type {
  NewBriefClarificationRequest,
  NewBriefClarificationItem,
} from "@novabots/db";

export const briefClarificationRepository = {
  async getOpenByBriefId(workspaceId: string, briefId: string) {
    const [request] = await db
      .select()
      .from(briefClarificationRequests)
      .where(
        and(
          eq(briefClarificationRequests.workspaceId, workspaceId),
          eq(briefClarificationRequests.briefId, briefId),
          eq(briefClarificationRequests.status, "open"),
        ),
      )
      .orderBy(desc(briefClarificationRequests.requestedAt))
      .limit(1);

    return request ?? null;
  },

  async listItems(requestId: string) {
    return db
      .select()
      .from(briefClarificationItems)
      .where(eq(briefClarificationItems.requestId, requestId))
      .orderBy(asc(briefClarificationItems.sortOrder));
  },

  async createRequest(data: NewBriefClarificationRequest) {
    return db.transaction(async (trx) => {
      const [request] = await trx.insert(briefClarificationRequests).values(data).returning();
      await writeAuditLog(trx, {
        workspaceId: data.workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "brief_clarification_request",
        entityId: request!.id,
        action: "create",
        metadata: { briefId: data.briefId },
      });
      return request!;
    });
  },

  async createItems(workspaceId: string, items: NewBriefClarificationItem[]) {
    if (items.length === 0) return [];
    return db.transaction(async (trx) => {
      const inserted = await trx.insert(briefClarificationItems).values(items).returning();
      const requestId = inserted[0]!.requestId;
      await writeAuditLog(trx, {
        workspaceId,
        actorId: null,
        actorType: "system",
        entityType: "brief_clarification_items",
        entityId: requestId,
        action: "create",
        metadata: { requestId, count: inserted.length },
      });
      return inserted;
    });
  },

  async resolveOpenByBriefId(workspaceId: string, briefId: string) {
    return db.transaction(async (trx) => {
      const rows = await trx
        .update(briefClarificationRequests)
        .set({
          status: "resolved",
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(briefClarificationRequests.workspaceId, workspaceId),
            eq(briefClarificationRequests.briefId, briefId),
            eq(briefClarificationRequests.status, "open"),
          ),
        )
        .returning();
      for (const row of rows) {
        await writeAuditLog(trx, {
          workspaceId,
          actorId: null,
          actorType: "system",
          entityType: "brief_clarification_request",
          entityId: row.id,
          action: "update",
          metadata: { status: "resolved" },
        });
      }
      return rows;
    });
  },

  async getRequestById(workspaceId: string, requestId: string) {
    const [request] = await db
      .select()
      .from(briefClarificationRequests)
      .where(
        and(
          eq(briefClarificationRequests.workspaceId, workspaceId),
          eq(briefClarificationRequests.id, requestId),
        ),
      )
      .limit(1);

    return request ?? null;
  },

  async getOpenForBrief(workspaceId: string, briefId: string) {
    const request = await this.getOpenByBriefId(workspaceId, briefId);
    if (!request) return null;
    const items = await this.listItems(request.id);
    return { ...request, items };
  },
};
