import { db, auditLog, eq, and, desc, gt } from "@novabots/db";

export const auditLogRepository = {
  async list(
    workspaceId: string,
    options: {
      entityType?: string;
      entityId?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const limit = options.limit ?? 50;
    const conditions = [eq(auditLog.workspaceId, workspaceId)];

    if (options.entityType) {
      conditions.push(eq(auditLog.entityType, options.entityType));
    }
    if (options.entityId) {
      conditions.push(eq(auditLog.entityId, options.entityId));
    }
    if (options.cursor) {
      conditions.push(gt(auditLog.id, options.cursor));
    }

    const results = await db
      .select()
      .from(auditLog)
      .where(and(...conditions))
      .orderBy(desc(auditLog.createdAt))
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
};
