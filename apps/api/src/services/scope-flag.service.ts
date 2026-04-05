import { scopeFlagRepository } from "../repositories/scope-flag.repository.js";
import { NotFoundError } from "@novabots/types";
import { db, writeAuditLog, projects, sowClauses, eq, and, isNull } from "@novabots/db";
import type { FlagStatus } from "@novabots/db";

export const scopeFlagService = {
    async list(workspaceId: string, projectId?: string) {
        const data = await scopeFlagRepository.list(workspaceId, projectId);
        return { data };
    },

    async getById(workspaceId: string, id: string) {
        const flag = await scopeFlagRepository.getById(workspaceId, id);
        if (!flag) throw new NotFoundError("ScopeFlag", id);
        return flag;
    },

    async updateStatus(
        workspaceId: string,
        id: string,
        userId: string,
        update: { status: FlagStatus; reason?: string | undefined },
    ) {
        const flag = await scopeFlagRepository.getById(workspaceId, id);
        if (!flag) throw new NotFoundError("ScopeFlag", id);

        const data: {
            status: FlagStatus;
            resolvedBy?: string | null;
            resolvedAt?: Date | null;
            snoozedUntil?: Date | null;
        } = { status: update.status };

        if (update.status === "dismissed" || update.status === "confirmed" || update.status === "resolved") {
            data.resolvedBy = userId;
            data.resolvedAt = new Date();
        }
        if (update.status === "snoozed") {
            data.snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        const updated = await scopeFlagRepository.updateStatus(workspaceId, id, data);

        await writeAuditLog(db as never, {
            workspaceId,
            actorId: userId,
            entityType: "scope_flag",
            entityId: id,
            action: update.status === "dismissed" ? "dismiss" : "update",
            metadata: { status: update.status, reason: update.reason },
        });

        return updated;
    },

    async countPending(workspaceId: string) {
        return scopeFlagRepository.countByWorkspace(workspaceId);
    },

    /**
     * Matches a scope flag against SOW clauses using keyword overlap.
     * In a production environment, this would use vector embeddings or LLM-based semantic matching.
     */
    async matchToSOWClause(workspaceId: string, flagId: string) {
        const flag = await this.getById(workspaceId, flagId);

        // Fetch project and its SOW
        const [project] = await db
            .select({ sowId: projects.sowId })
            .from(projects)
            .where(and(eq(projects.id, flag.projectId), isNull(projects.deletedAt)))
            .limit(1);

        if (!project?.sowId) return null;

        // Fetch clauses
        const clauses = await db
            .select()
            .from(sowClauses)
            .where(eq(sowClauses.sowId, project.sowId));

        if (clauses.length === 0) return null;

        const textToMatch = `${flag.title} ${flag.description || ""}`.toLowerCase();
        const words = textToMatch.split(/\W+/).filter(w => w.length > 3);

        let bestMatch = null;
        let highestScore = 0;

        for (const clause of clauses) {
            const clauseText = clause.originalText.toLowerCase();
            let score = 0;
            for (const word of words) {
                if (clauseText.includes(word)) score++;
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = clause;
            }
        }

        return bestMatch ? {
            clauseId: bestMatch.id,
            clauseType: bestMatch.clauseType,
            originalText: bestMatch.originalText,
            matchScore: highestScore
        } : null;
    }
};
