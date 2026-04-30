import { scopeFlagRepository } from "../repositories/scope-flag.repository.js";
import { NotFoundError } from "@novabots/types";
import { db, writeAuditLog, projects, sowClauses, workspaces, messages, scopeFlags, eq, and, isNull } from "@novabots/db";
import type { FlagStatus } from "@novabots/db";
import { dispatchGenerateChangeOrderJob } from "../jobs/generate-change-order.job.js";

const DEFAULT_SLA_HOURS = 48;

/**
 * Return the SLA deadline for a new scope flag.
 * Reads `settingsJson.scopeFlagSlaHours` from the workspace; defaults to 48 h.
 */
export async function computeSlaDeadline(workspaceId: string, fromDate: Date = new Date()): Promise<Date> {
    const [ws] = await db
        .select({ settingsJson: workspaces.settingsJson })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

    const settings = (ws?.settingsJson ?? {}) as Record<string, unknown>;
    const hours =
        typeof settings["scopeFlagSlaHours"] === "number"
            ? settings["scopeFlagSlaHours"]
            : DEFAULT_SLA_HOURS;

    return new Date(fromDate.getTime() + hours * 60 * 60 * 1000);
}

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

        const oldStatus = flag.status;
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

        const action = update.status === "dismissed" ? "dismiss" : "update";

        const updated = await db.transaction(async (trx) => {
            const result = await scopeFlagRepository.updateStatus(workspaceId, id, data, trx as never);

            await writeAuditLog(trx as never, {
                workspaceId,
                actorId: userId,
                entityType: "scope_flag",
                entityId: id,
                action,
                metadata: { oldStatus, newStatus: update.status, reason: update.reason },
            });

            // FR-SG-002: when agency marks a flag as in-scope (dismissed), update the
            // bilateral system message so the client sees "Confirmed in scope" instead
            // of the original flag notification.
            if (update.status === "dismissed") {
                const [flagRecord] = await db
                    .select({ evidence: scopeFlags.evidence })
                    .from(scopeFlags)
                    .where(and(eq(scopeFlags.id, id), eq(scopeFlags.workspaceId, workspaceId)))
                    .limit(1);

                const systemMessageId = (flagRecord?.evidence as Record<string, unknown> | null)?.system_message_id as string | undefined;

                if (systemMessageId) {
                    await trx
                        .update(messages)
                        .set({
                            body: "Your request has been reviewed and confirmed within the scope of our current agreement.",
                            scopeCheckStatus: "checked",
                        })
                        .where(eq(messages.id, systemMessageId));
                }
            }

            return result;
        });

        if (update.status === "confirmed") {
            dispatchGenerateChangeOrderJob(id, workspaceId).catch((err) =>
                console.error("[ScopeFlagService] Failed to dispatch generate-change-order job:", err),
            );
        }

        return updated;
    },

    async countPending(workspaceId: string) {
        return scopeFlagRepository.countByWorkspace(workspaceId);
    },

    async listOpenSortedByBreach(workspaceId: string) {
        const data = await scopeFlagRepository.listOpenSortedByBreach(workspaceId);
        return { data };
    },

    async markBreached(id: string, workspaceId: string) {
        await db.transaction(async (trx) => {
            await scopeFlagRepository.markSlaBreached(id, workspaceId, trx as typeof db);
            await writeAuditLog(trx as never, {
                workspaceId,
                actorId: null,
                actorType: "system",
                entityType: "scope_flag",
                entityId: id,
                action: "update",
                metadata: { slaBreached: true },
            });
        });
    },

    async matchToSOWClause(workspaceId: string, flagId: string) {
        const flag = await this.getById(workspaceId, flagId);

        const [project] = await db
            .select({ sowId: projects.sowId })
            .from(projects)
            .where(and(eq(projects.id, flag.projectId), isNull(projects.deletedAt)))
            .limit(1);

        if (!project?.sowId) return null;

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
