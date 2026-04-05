import { db, scopeFlags, eq, and, desc, sql } from "@novabots/db";
import type { FlagStatus } from "@novabots/db";

export const scopeFlagRepository = {
    async list(workspaceId: string, projectId?: string) {
        const conditions = [eq(scopeFlags.workspaceId, workspaceId)];
        if (projectId) {
            conditions.push(eq(scopeFlags.projectId, projectId));
        }

        return db
            .select()
            .from(scopeFlags)
            .where(and(...conditions))
            .orderBy(
                sql`CASE WHEN ${scopeFlags.status} = 'pending' THEN 0 ELSE 1 END`,
                sql`CASE WHEN ${scopeFlags.severity} = 'high' THEN 0 WHEN ${scopeFlags.severity} = 'medium' THEN 1 ELSE 2 END`,
                desc(scopeFlags.createdAt),
            );
    },

    async getById(workspaceId: string, id: string) {
        const [flag] = await db
            .select()
            .from(scopeFlags)
            .where(and(eq(scopeFlags.id, id), eq(scopeFlags.workspaceId, workspaceId)));
        return flag ?? null;
    },

    async updateStatus(
        workspaceId: string,
        id: string,
        data: {
            status: FlagStatus;
            resolvedBy?: string | null;
            resolvedAt?: Date | null;
            snoozedUntil?: Date | null;
        },
    ) {
        const setValues: Record<string, unknown> = {
            status: data.status,
            updatedAt: new Date(),
        };
        if (data.resolvedBy !== undefined) setValues.resolvedBy = data.resolvedBy;
        if (data.resolvedAt !== undefined) setValues.resolvedAt = data.resolvedAt;
        if (data.snoozedUntil !== undefined) setValues.snoozedUntil = data.snoozedUntil;

        const [updated] = await db
            .update(scopeFlags)
            .set(setValues)
            .where(and(eq(scopeFlags.id, id), eq(scopeFlags.workspaceId, workspaceId)))
            .returning();
        return updated ?? null;
    },

    async countByWorkspace(workspaceId: string) {
        const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(scopeFlags)
            .where(
                and(
                    eq(scopeFlags.workspaceId, workspaceId),
                    sql`${scopeFlags.status} = 'pending'`,
                ),
            );
        return result[0]?.count ?? 0;
    },
};
