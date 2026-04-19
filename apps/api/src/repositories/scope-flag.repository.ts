import { db, scopeFlags, eq, and, desc, isNull, lt, sql } from "@novabots/db";
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
        trx?: unknown,
    ) {
        const driver = trx ?? db;
        const setValues: Record<string, unknown> = {
            status: data.status,
            updatedAt: new Date(),
        };
        if (data.resolvedBy !== undefined) setValues.resolvedBy = data.resolvedBy;
        if (data.resolvedAt !== undefined) setValues.resolvedAt = data.resolvedAt;
        if (data.snoozedUntil !== undefined) setValues.snoozedUntil = data.snoozedUntil;

        const [updated] = await (driver as typeof db)
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

    /**
     * List open (pending) flags sorted by slaDeadline ascending — soonest breach first.
     * Flags with no deadline are appended at the end.
     */
    async listOpenSortedByBreach(workspaceId: string) {
        return db
            .select()
            .from(scopeFlags)
            .where(
                and(
                    eq(scopeFlags.workspaceId, workspaceId),
                    eq(scopeFlags.status, "pending"),
                ),
            )
            .orderBy(
                sql`${scopeFlags.slaDeadline} ASC NULLS LAST`,
                desc(scopeFlags.createdAt),
            );
    },

    /**
     * Return all flags that are open, have a past slaDeadline, and have not yet been marked breached.
     * Used by the SLA sweep job.
     */
    async listBreachable(now: Date) {
        return db
            .select()
            .from(scopeFlags)
            .where(
                and(
                    eq(scopeFlags.status, "pending"),
                    eq(scopeFlags.slaBreached, false),
                    lt(scopeFlags.slaDeadline, now),
                    isNull(scopeFlags.resolvedAt),
                ),
            );
    },

    /**
     * Mark a single flag as SLA-breached. Must be called inside a transaction.
     */
    async markSlaBreached(id: string, workspaceId: string, trx: typeof db) {
        const [updated] = await trx
            .update(scopeFlags)
            .set({ slaBreached: true, updatedAt: new Date() })
            .where(and(eq(scopeFlags.id, id), eq(scopeFlags.workspaceId, workspaceId)))
            .returning();
        return updated ?? null;
    },
};
