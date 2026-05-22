import { db, deliverableRevisions, deliverables, eq, and, desc } from "@novabots/db";
import type { NewDeliverableRevision } from "@novabots/db";

export const deliverableRevisionRepository = {
    async create(data: NewDeliverableRevision, trx?: unknown) {
        const driver = trx ?? db;
        const [revision] = await (driver as typeof db)
            .insert(deliverableRevisions)
            .values(data)
            .returning();
        return revision!;
    },

    async listByDeliverable(workspaceId: string, deliverableId: string) {
        return db
            .select({
                id: deliverableRevisions.id,
                deliverableId: deliverableRevisions.deliverableId,
                versionNumber: deliverableRevisions.versionNumber,
                fileUrl: deliverableRevisions.fileUrl,
                notes: deliverableRevisions.notes,
                createdAt: deliverableRevisions.createdAt,
                createdBy: deliverableRevisions.createdBy,
            })
            .from(deliverableRevisions)
            .innerJoin(deliverables, eq(deliverableRevisions.deliverableId, deliverables.id))
            .where(
                and(
                    eq(deliverableRevisions.deliverableId, deliverableId),
                    eq(deliverables.workspaceId, workspaceId),
                ),
            )
            .orderBy(desc(deliverableRevisions.versionNumber));
    },

    async getLatestVersion(workspaceId: string, deliverableId: string) {
        const [revision] = await db
            .select({
                id: deliverableRevisions.id,
                deliverableId: deliverableRevisions.deliverableId,
                versionNumber: deliverableRevisions.versionNumber,
                fileUrl: deliverableRevisions.fileUrl,
                notes: deliverableRevisions.notes,
                createdAt: deliverableRevisions.createdAt,
                createdBy: deliverableRevisions.createdBy,
            })
            .from(deliverableRevisions)
            .innerJoin(deliverables, eq(deliverableRevisions.deliverableId, deliverables.id))
            .where(
                and(
                    eq(deliverableRevisions.deliverableId, deliverableId),
                    eq(deliverables.workspaceId, workspaceId),
                ),
            )
            .orderBy(desc(deliverableRevisions.versionNumber))
            .limit(1);
        return revision ?? null;
    }
};
