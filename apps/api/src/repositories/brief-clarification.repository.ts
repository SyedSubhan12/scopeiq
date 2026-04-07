import {
  db,
  briefClarificationRequests,
  briefClarificationItems,
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
    const [request] = await db.insert(briefClarificationRequests).values(data).returning();
    return request!;
  },

  async createItems(items: NewBriefClarificationItem[]) {
    if (items.length === 0) return [];
    return db.insert(briefClarificationItems).values(items).returning();
  },

  async resolveOpenByBriefId(workspaceId: string, briefId: string) {
    return db
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
