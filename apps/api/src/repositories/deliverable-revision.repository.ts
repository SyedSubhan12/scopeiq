import { db, deliverableRevisions, eq, and, desc } from "@novabots/db";
import type { NewDeliverableRevision } from "@novabots/db";

export const deliverableRevisionRepository = {
    async create(data: NewDeliverableRevision) {
        const [revision] = await db
            .insert(deliverableRevisions)
            .values(data)
            .returning();
        return revision!;
    },

    async listByDeliverable(deliverableId: string) {
        return db
            .select()
            .from(deliverableRevisions)
            .where(eq(deliverableRevisions.deliverableId, deliverableId))
            .orderBy(desc(deliverableRevisions.versionNumber));
    },

    async getLatestVersion(deliverableId: string) {
        const [revision] = await db
            .select()
            .from(deliverableRevisions)
            .where(eq(deliverableRevisions.deliverableId, deliverableId))
            .orderBy(desc(deliverableRevisions.versionNumber))
            .limit(1);
        return revision ?? null;
    }
};
