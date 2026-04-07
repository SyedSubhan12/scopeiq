import {
  db,
  deliverables,
  eq,
  and,
  isNull,
  desc,
  lt,
} from "@novabots/db";
import type { NewDeliverable } from "@novabots/db";

export const deliverableRepository = {
  async list(
    workspaceId: string,
    options: { projectId?: string | undefined; status?: string | undefined; cursor?: string | undefined; limit?: number | undefined },
  ) {
    const limit = options.limit ?? 20;
    const conditions = [
      eq(deliverables.workspaceId, workspaceId),
      isNull(deliverables.deletedAt),
    ];
    if (options.projectId) {
      conditions.push(eq(deliverables.projectId, options.projectId));
    }
    if (options.status) {
      conditions.push(
        eq(
          deliverables.status,
          options.status as typeof deliverables.status.enumValues[number],
        ),
      );
    }
    if (options.cursor) {
      conditions.push(lt(deliverables.createdAt, new Date(options.cursor)));
    }

    const results = await db
      .select()
      .from(deliverables)
      .where(and(...conditions))
      .orderBy(desc(deliverables.createdAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return {
      data,
      pagination: {
        next_cursor: hasMore ? data[data.length - 1]!.createdAt.toISOString() : null,
        has_more: hasMore,
      },
    };
  },

  async getById(workspaceId: string, deliverableId: string) {
    const [deliverable] = await db
      .select()
      .from(deliverables)
      .where(
        and(
          eq(deliverables.id, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .limit(1);
    return deliverable ?? null;
  },

  async getByIdForPortal(deliverableId: string, workspaceId: string) {
    const [deliverable] = await db
      .select()
      .from(deliverables)
      .where(
        and(
          eq(deliverables.id, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .limit(1);
    return deliverable ?? null;
  },

  async create(data: NewDeliverable, trx?: unknown) {
    const driver = trx ?? db;
    const [deliverable] = await (driver as typeof db).insert(deliverables).values(data).returning();
    return deliverable!;
  },

  async update(
    workspaceId: string,
    deliverableId: string,
    data: Partial<NewDeliverable>,
    trx?: unknown,
  ) {
    const driver = trx ?? db;
    const [updated] = await (driver as typeof db)
      .update(deliverables)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(deliverables.id, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async softDelete(workspaceId: string, deliverableId: string, trx?: unknown) {
    const driver = trx ?? db;
    const [deleted] = await (driver as typeof db)
      .update(deliverables)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(deliverables.id, deliverableId),
          eq(deliverables.workspaceId, workspaceId),
          isNull(deliverables.deletedAt),
        ),
      )
      .returning();
    return deleted ?? null;
  },

  async findInReviewSince(since: Date) {
    return db
      .select()
      .from(deliverables)
      .where(
        and(
          eq(deliverables.status, "in_review"),
          isNull(deliverables.deletedAt),
        ),
      )
      .orderBy(desc(deliverables.updatedAt));
  },
};
