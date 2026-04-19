import { changeOrderRepository } from "../repositories/change-order.repository.js";
import { NotFoundError } from "@novabots/types";
import { db, writeAuditLog, projects, sowClauses, deliverables, scopeFlags, eq, and } from "@novabots/db";
import type { ChangeOrder, ClauseType } from "@novabots/db";
import { sendEmail } from "../lib/email.js";
import { ChangeOrderSentEmail } from "../emails/index.js";
import { ChangeOrderAcceptedEmail } from "../emails/index.js";
import React from "react";
import { generateSignedCoPdf } from "../lib/change-order-pdf.js";
import { putBytes, getDownloadUrl } from "../lib/storage.js";

export const changeOrderService = {
    async list(workspaceId: string, projectId?: string) {
        const data = await changeOrderRepository.list(workspaceId, projectId);
        return { data };
    },

    async getById(workspaceId: string, id: string) {
        const co = await changeOrderRepository.getById(workspaceId, id);
        if (!co) throw new NotFoundError("ChangeOrder", id);
        return co;
    },

    async create(
        workspaceId: string,
        userId: string,
        data: {
            projectId: string;
            scopeFlagId?: string | undefined;
            title: string;
            description?: string | undefined;
            amount?: number | undefined;
            lineItemsJson?: Array<{ id?: string | undefined; description: string; hours: number; rate: number }> | undefined;
            revisedTimeline?: string | undefined;
        },
    ) {
        const lineItems = data.lineItemsJson ?? [];
        const estimatedHours = lineItems.reduce((total, item) => total + item.hours, 0);

        return db.transaction(async (trx) => {
            const co = await changeOrderRepository.create({
                workspaceId,
                projectId: data.projectId,
                scopeFlagId: data.scopeFlagId ?? null,
                title: data.title,
                workDescription: data.description ?? null,
                pricing: data.amount !== undefined ? { amount: data.amount } : null,
                estimatedHours: lineItems.length > 0 ? estimatedHours : null,
                lineItemsJson: lineItems,
                revisedTimeline: data.revisedTimeline ?? null,
                createdBy: userId,
            }, trx as never);

            await writeAuditLog(trx as never, {
                workspaceId,
                actorId: userId,
                entityType: "change_order",
                entityId: co.id,
                action: "create",
                metadata: { title: co.title },
            });

            return co;
        });
    },

    /**
     * Accepts a change order in a single atomic transaction.
     * Per spec SF-F06 / CP-F07, this MUST:
     * 1. Update change_orders.status = "accepted"
     * 2. Write signedAt and signedByName
     * 3. Insert/update sow_clauses from change_orders.scopeItemsJson
     * 4. Adjust deliverables.maxRevisions if revisionLimitAdjustment is provided
     * 5. Set scope_flags.status = "resolved" if linked to a flag
     * 6. Write audit_log with all side effects
     * ALL in ONE db.transaction() — any failure rolls back the entire transaction.
     */
    async acceptWithFullTransaction(input: {
        changeOrderId: string;
        workspaceId: string;
        projectId: string;
        signatureName: string;
        signerIp: string;
        revisionLimitAdjustment?: {
            deliverableId: string;
            newMaxRevisions: number;
        };
    }) {
        const { changeOrderId, workspaceId, projectId, signatureName, signerIp, revisionLimitAdjustment } = input;

        // Fetch the change order first to get current state
        const co = await changeOrderRepository.getById(workspaceId, changeOrderId);
        if (!co) throw new NotFoundError("ChangeOrder", changeOrderId);
        if (co.projectId !== projectId) throw new NotFoundError("ChangeOrder", changeOrderId);

        // Idempotency: if already accepted and PDF already generated, return early
        if (co.status === "accepted" && co.signedPdfKey != null) {
            return co;
        }

        if (co.status !== "sent" && co.status !== "accepted") {
            throw new Error("Change order is not in a state that can be accepted");
        }

        // Fetch project for PDF metadata (outside tx — read-only)
        const [projectRow] = await db
            .select({ id: projects.id, sowId: projects.sowId, name: projects.name })
            .from(projects)
            .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)));

        if (!projectRow) throw new NotFoundError("Project", projectId);

        // Generate signed PDF before opening the transaction (pure CPU work)
        const signedAt = new Date();
        const { bytes: pdfBytes, hash: pdfHash } = await generateSignedCoPdf(
            {
                id: co.id,
                title: co.title,
                workDescription: co.workDescription,
                revisedTimeline: co.revisedTimeline,
                estimatedHours: co.estimatedHours,
                pricing: co.pricing as Record<string, unknown> | null,
            },
            { name: signatureName, ip: signerIp, signedAt },
            { id: projectRow.id, title: projectRow.name },
        );

        const pdfKey = `workspaces/${workspaceId}/change-orders/${changeOrderId}/signed-${signedAt.getTime()}.pdf`;

        // Upload PDF to object storage before the DB transaction
        await putBytes(pdfKey, pdfBytes, "application/pdf");

        return db.transaction(async (trx) => {
            // Step 1: Update change order with acceptance data + artifact pointers
            const updated = await changeOrderRepository.update(
                workspaceId,
                changeOrderId,
                {
                    status: "accepted",
                    signedAt,
                    signedByName: signatureName,
                    signedByIp: signerIp,
                    signedPdfKey: pdfKey,
                    signedPdfHash: pdfHash,
                    respondedAt: signedAt,
                },
                trx as never,
            );
            if (!updated) throw new NotFoundError("ChangeOrder", changeOrderId);

            // Step 2: Insert SOW clauses from scopeItemsJson if present
            // projectRow was already fetched above (with name for PDF)
            const coWithScopeItems = co as ChangeOrder;
            const scopeItems = coWithScopeItems.scopeItemsJson as Array<{
                clauseType: ClauseType;
                originalText: string;
                summary?: string | null;
                sortOrder?: number;
            }> | null | undefined;

            if (scopeItems && scopeItems.length > 0 && projectRow.sowId) {
                const sowId = projectRow.sowId; // Narrow to string for TypeScript
                await trx.insert(sowClauses).values(
                    scopeItems.map((item, index) => ({
                        sowId,
                        clauseType: item.clauseType,
                        originalText: item.originalText,
                        summary: item.summary ?? null,
                        sortOrder: item.sortOrder ?? index,
                    })),
                );
            }

            // Step 4: Adjust revision limit if requested
            if (revisionLimitAdjustment) {
                await trx
                    .update(deliverables)
                    .set({
                        maxRevisions: revisionLimitAdjustment.newMaxRevisions,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(deliverables.id, revisionLimitAdjustment.deliverableId),
                            eq(deliverables.workspaceId, workspaceId),
                        ),
                    );
            }

            // Step 5: Resolve linked scope flag if present
            if (co.scopeFlagId) {
                await trx
                    .update(scopeFlags)
                    .set({
                        status: "resolved",
                        resolvedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(scopeFlags.id, co.scopeFlagId),
                            eq(scopeFlags.workspaceId, workspaceId),
                        ),
                    );
            }

            // Step 6: Write audit log with full metadata
            await writeAuditLog(trx as never, {
                workspaceId,
                actorId: null, // Client acceptance via portal token — no specific user
                actorType: "client",
                entityType: "change_order",
                entityId: changeOrderId,
                action: "approve",
                metadata: {
                    oldStatus: co.status,
                    newStatus: "accepted",
                    signedByName: signatureName,
                    signedByIp: signerIp,
                    signedPdfKey: pdfKey,
                    signedPdfHash: pdfHash,
                    scopeItemsCount: scopeItems?.length ?? 0,
                    revisionLimitAdjusted: !!revisionLimitAdjustment,
                    scopeFlagResolved: !!co.scopeFlagId,
                },
            });

            return updated;
        });
    },

    async update(
        workspaceId: string,
        id: string,
        userId: string,
        data: {
            title?: string | undefined;
            description?: string | undefined;
            amount?: number | undefined;
            status?: string | undefined;
            clientEmail?: string | undefined;
            clientName?: string | undefined;
            lineItemsJson?: Array<{ hours: number; [key: string]: unknown }> | undefined;
            revisedTimeline?: string | undefined;
        },
    ) {
        const co = await changeOrderRepository.getById(workspaceId, id);
        if (!co) throw new NotFoundError("ChangeOrder", id);

        const oldStatus = co.status;
        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.workDescription = data.description;
        if (data.amount !== undefined) updateData.pricing = { amount: data.amount };
        if (data.lineItemsJson !== undefined) {
            updateData.lineItemsJson = data.lineItemsJson;
            updateData.estimatedHours = data.lineItemsJson.reduce(
                (total, item) => total + item.hours,
                0,
            );
        }
        if (data.revisedTimeline !== undefined) updateData.revisedTimeline = data.revisedTimeline;
        if (data.status !== undefined) {
            updateData.status = data.status;
            if (data.status === "sent") updateData.sentAt = new Date();
            if (data.status === "accepted" || data.status === "declined") updateData.respondedAt = new Date();
        }

        const action = data.status === "sent" ? "send" : "update";

        const updated = await db.transaction(async (trx) => {
            const result = await changeOrderRepository.update(workspaceId, id, updateData, trx as never);
            if (!result) throw new NotFoundError("ChangeOrder", id);

            await writeAuditLog(trx as never, {
                workspaceId,
                actorId: userId,
                entityType: "change_order",
                entityId: id,
                action,
                metadata: { oldStatus, newStatus: data.status ?? oldStatus },
            });

            return result;
        });

        if (data.status === "sent" && data.clientEmail) {
            const pricingAmount = (updated.pricing as Record<string, unknown> | null)?.amount;
            sendEmail({
                to: data.clientEmail,
                subject: `Change Order: ${updated.title}`,
                react: React.createElement(ChangeOrderSentEmail, {
                    recipientName: data.clientName ?? "Client",
                    clientName: data.clientName ?? "Client",
                    changeOrderTitle: updated.title,
                    description: updated.workDescription ?? "",
                    pricing: pricingAmount != null ? `$${pricingAmount}` : "TBD",
                    status: "Sent",
                    viewChangeOrderUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/change-orders/${id}`,
                }),
            }).catch((err) =>
                console.error("[ChangeOrderService] Failed to send ChangeOrderSentEmail:", err),
            );
        }

        if (data.status === "accepted" && data.clientEmail) {
            const pricingAmount = (updated.pricing as Record<string, unknown> | null)?.amount;
            sendEmail({
                to: data.clientEmail,
                subject: `Change Order Accepted: ${updated.title}`,
                react: React.createElement(ChangeOrderAcceptedEmail, {
                    recipientName: data.clientName ?? "Client",
                    clientName: data.clientName ?? "Client",
                    changeOrderTitle: updated.title,
                    description: updated.workDescription ?? "",
                    pricing: pricingAmount != null ? `$${pricingAmount}` : "TBD",
                    viewSowUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/projects/${updated.projectId}/sow`,
                }),
            }).catch((err) =>
                console.error("[ChangeOrderService] Failed to send ChangeOrderAcceptedEmail:", err),
            );
        }

        return updated;
    },

    async getSignedPdfUrl(workspaceId: string, id: string): Promise<{ url: string; hash: string }> {
        const co = await changeOrderRepository.getById(workspaceId, id);
        if (!co) throw new NotFoundError("ChangeOrder", id);
        if (co.signedPdfKey == null || co.signedPdfHash == null) {
            throw new NotFoundError("SignedPdf", id);
        }
        const url = await getDownloadUrl(co.signedPdfKey, 3600);
        return { url, hash: co.signedPdfHash };
    },

    async countPending(workspaceId: string) {
        return changeOrderRepository.countPending(workspaceId);
    },
};
