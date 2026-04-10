import { changeOrderRepository } from "../repositories/change-order.repository.js";
import { NotFoundError } from "@novabots/types";
import { db, writeAuditLog } from "@novabots/db";
import { sendEmail } from "../lib/email.js";
import { ChangeOrderSentEmail } from "../emails/index.js";
import { ChangeOrderAcceptedEmail } from "../emails/index.js";
import React from "react";

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
            lineItemsJson?: unknown[] | undefined;
        },
    ) {
        const co = await changeOrderRepository.create({
            workspaceId,
            projectId: data.projectId,
            scopeFlagId: data.scopeFlagId ?? null,
            title: data.title,
            description: data.description ?? null,
            amount: data.amount ?? null,
            lineItemsJson: data.lineItemsJson ?? [],
            createdBy: userId,
        });

        await writeAuditLog(db as never, {
            workspaceId,
            actorId: userId,
            entityType: "change_order",
            entityId: co.id,
            action: "create",
            metadata: { title: co.title, amount: co.amount },
        });

        return co;
    },

    async update(
        workspaceId: string,
        id: string,
        userId: string,
        data: { title?: string | undefined; description?: string | undefined; amount?: number | undefined; status?: string | undefined; clientEmail?: string | undefined; clientName?: string | undefined },
    ) {
        const co = await changeOrderRepository.getById(workspaceId, id);
        if (!co) throw new NotFoundError("ChangeOrder", id);

        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.status !== undefined) {
            updateData.status = data.status;
            if (data.status === "sent") updateData.sentAt = new Date();
            if (data.status === "accepted" || data.status === "declined") updateData.respondedAt = new Date();
        }

        const updated = await changeOrderRepository.update(workspaceId, id, updateData as never);

        await writeAuditLog(db as never, {
            workspaceId,
            actorId: userId,
            entityType: "change_order",
            entityId: id,
            action: data.status === "sent" ? "send" : "update",
            metadata: { status: data.status },
        });

        if (data.status === "sent" && data.clientEmail) {
            sendEmail({
                to: data.clientEmail,
                subject: `Change Order: ${co.title}`,
                react: React.createElement(ChangeOrderSentEmail, {
                    recipientName: data.clientName ?? "Client",
                    clientName: data.clientName ?? "Client",
                    changeOrderTitle: co.title,
                    description: co.description ?? "",
                    pricing: co.amount != null ? `$${co.amount}` : "TBD",
                    status: "Sent",
                    viewChangeOrderUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/change-orders/${id}`,
                }),
            }).catch((err) =>
                console.error("[ChangeOrderService] Failed to send ChangeOrderSentEmail:", err),
            );
        }

        if (data.status === "accepted" && data.clientEmail) {
            sendEmail({
                to: data.clientEmail,
                subject: `Change Order Accepted: ${co.title}`,
                react: React.createElement(ChangeOrderAcceptedEmail, {
                    recipientName: data.clientName ?? "Client",
                    clientName: data.clientName ?? "Client",
                    changeOrderTitle: co.title,
                    description: co.description ?? "",
                    pricing: co.amount != null ? `$${co.amount}` : "TBD",
                    viewSowUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard/projects/${co.projectId}/sow`,
                }),
            }).catch((err) =>
                console.error("[ChangeOrderService] Failed to send ChangeOrderAcceptedEmail:", err),
            );
        }

        return updated;
    },

    async countPending(workspaceId: string) {
        return changeOrderRepository.countPending(workspaceId);
    },
};
