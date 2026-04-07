import { db, changeOrders, eq, and, desc, sql } from "@novabots/db";
import type { NewChangeOrder } from "@novabots/db";

export const changeOrderRepository = {
    async list(workspaceId: string, projectId?: string) {
        const conditions = [eq(changeOrders.workspaceId, workspaceId)];
        if (projectId) {
            conditions.push(eq(changeOrders.projectId, projectId));
        }

        return db
            .select()
            .from(changeOrders)
            .where(and(...conditions))
            .orderBy(desc(changeOrders.createdAt));
    },

    async getById(workspaceId: string, id: string) {
        const [co] = await db
            .select()
            .from(changeOrders)
            .where(and(eq(changeOrders.id, id), eq(changeOrders.workspaceId, workspaceId)));
        return co ?? null;
    },

    async create(data: NewChangeOrder, trx?: unknown) {
        const driver = trx ?? db;
        const [co] = await (driver as typeof db).insert(changeOrders).values(data).returning();
        return co!;
    },

    async update(
        workspaceId: string,
        id: string,
        data: Record<string, unknown>,
        trx?: unknown,
    ) {
        const driver = trx ?? db;
        const [updated] = await (driver as typeof db)
            .update(changeOrders)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(changeOrders.id, id), eq(changeOrders.workspaceId, workspaceId)))
            .returning();
        return updated ?? null;
    },

    async countPending(workspaceId: string) {
        const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(changeOrders)
            .where(
                and(
                    eq(changeOrders.workspaceId, workspaceId),
                    sql`${changeOrders.status} IN ('draft', 'sent')`,
                ),
            );
        return result[0]?.count ?? 0;
    },
};
