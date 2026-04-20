import { db, clients, eq, and, isNull, desc, gt } from "@novabots/db";
import type { NewClient } from "@novabots/db";

export const clientRepository = {
  async list(
    workspaceId: string,
    options: { cursor?: string; limit?: number },
  ) {
    const limit = options.limit ?? 20;
    const conditions = [
      eq(clients.workspaceId, workspaceId),
      isNull(clients.deletedAt),
    ];
    if (options.cursor) {
      conditions.push(gt(clients.id, options.cursor));
    }

    const results = await db
      .select()
      .from(clients)
      .where(and(...conditions))
      .orderBy(desc(clients.createdAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return {
      data,
      pagination: {
        next_cursor: hasMore ? data[data.length - 1]!.id : null,
        has_more: hasMore,
      },
    };
  },

  async getById(workspaceId: string, clientId: string) {
    const [client] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.workspaceId, workspaceId),
          isNull(clients.deletedAt),
        ),
      )
      .limit(1);
    return client ?? null;
  },

  async create(data: NewClient) {
    const [client] = await db.insert(clients).values(data).returning();
    return client!;
  },

  async update(workspaceId: string, clientId: string, data: Partial<NewClient>) {
    const [updated] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.workspaceId, workspaceId),
          isNull(clients.deletedAt),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async delete(workspaceId: string, clientId: string) {
    const [deleted] = await db
      .update(clients)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.workspaceId, workspaceId),
          isNull(clients.deletedAt),
        ),
      )
      .returning();
    return deleted ?? null;
  },
};
