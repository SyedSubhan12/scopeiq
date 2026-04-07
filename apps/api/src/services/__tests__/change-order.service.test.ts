import { describe, it, expect, vi, beforeEach } from "vitest";
import { changeOrderService } from "../change-order.service.js";
import { changeOrderRepository } from "../../repositories/change-order.repository.js";
import { NotFoundError } from "@novabots/types";
import { db, writeAuditLog } from "@novabots/db";

// Mock dependencies
vi.mock("../../repositories/change-order.repository.js");
vi.mock("@novabots/db", () => ({
    db: {
        transaction: vi.fn((fn) => fn({})),
    },
    writeAuditLog: vi.fn(),
}));

describe("ChangeOrderService", () => {
    const workspaceId = "ws-123";
    const otherWorkspaceId = "ws-456";
    const userId = "user-123";
    const coId = "co-abc";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("list", () => {
        it("should call repository list with workspaceId only", async () => {
            const mockChangeOrders = [
                { id: "co1", workspaceId, title: "CO 1" },
                { id: "co2", workspaceId, title: "CO 2" },
            ];
            vi.mocked(changeOrderRepository.list).mockResolvedValue(mockChangeOrders as any);

            const result = await changeOrderService.list(workspaceId);

            expect(changeOrderRepository.list).toHaveBeenCalledWith(workspaceId, undefined);
            expect(result).toEqual({ data: mockChangeOrders });
        });

        it("should call repository list with workspaceId and projectId", async () => {
            const projectId = "proj-1";
            vi.mocked(changeOrderRepository.list).mockResolvedValue([]);

            await changeOrderService.list(workspaceId, projectId);

            expect(changeOrderRepository.list).toHaveBeenCalledWith(workspaceId, projectId);
        });
    });

    describe("getById", () => {
        it("should return the change order if found", async () => {
            const mockCO = {
                id: coId,
                workspaceId,
                title: "Test Change Order",
                status: "draft",
            };
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(mockCO as any);

            const result = await changeOrderService.getById(workspaceId, coId);

            expect(result).toEqual(mockCO);
            expect(changeOrderRepository.getById).toHaveBeenCalledWith(workspaceId, coId);
        });

        it("should throw NotFoundError when change order does not exist", async () => {
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(null);

            await expect(changeOrderService.getById(workspaceId, "nonexistent")).rejects.toThrow(
                NotFoundError,
            );
        });
    });

    describe("create", () => {
        it("should create change order with audit log", async () => {
            const data = {
                projectId: "proj-1",
                title: "New Change Order",
                description: "Additional work required",
                amount: 5000,
            };
            const mockCO = {
                id: coId,
                workspaceId,
                projectId: data.projectId,
                title: data.title,
                status: "draft",
            };
            vi.mocked(changeOrderRepository.create).mockResolvedValue(mockCO as any);

            const result = await changeOrderService.create(workspaceId, userId, data);

            expect(result).toEqual(mockCO);
            expect(changeOrderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    workspaceId,
                    projectId: data.projectId,
                    title: data.title,
                    workDescription: data.description,
                    createdBy: userId,
                    scopeFlagId: null,
                    lineItemsJson: [],
                }),
                expect.anything(),
            );
            expect(writeAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    workspaceId,
                    actorId: userId,
                    entityType: "change_order",
                    entityId: coId,
                    action: "create",
                    metadata: expect.objectContaining({
                        title: data.title,
                    }),
                }),
            );
        });

        it("should create change order with scopeFlagId when provided", async () => {
            const data = {
                projectId: "proj-1",
                scopeFlagId: "flag-123",
                title: "Flag-related change",
            };
            vi.mocked(changeOrderRepository.create).mockResolvedValue({
                id: coId,
                workspaceId,
                scopeFlagId: "flag-123",
                title: data.title,
            } as any);

            await changeOrderService.create(workspaceId, userId, data);

            expect(changeOrderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    scopeFlagId: "flag-123",
                }),
                expect.anything(),
            );
        });

        it("should create change order with lineItemsJson when provided", async () => {
            const lineItems = [
                { description: "Design revision", hours: 10, rate: 200 },
                { description: "Extra testing", hours: 5, rate: 300 },
            ];
            const data = {
                projectId: "proj-1",
                title: "Itemized change",
                lineItemsJson: lineItems,
            };
            vi.mocked(changeOrderRepository.create).mockResolvedValue({
                id: coId,
                workspaceId,
                lineItemsJson: lineItems,
                title: data.title,
            } as any);

            await changeOrderService.create(workspaceId, userId, data);

            expect(changeOrderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    lineItemsJson: lineItems,
                }),
                expect.anything(),
            );
        });
    });

    describe("update", () => {
        it("should update change order and write audit log", async () => {
            const mockCO = {
                id: coId,
                workspaceId,
                title: "Old Title",
                status: "draft",
            };
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(mockCO as any);
            vi.mocked(changeOrderRepository.update).mockResolvedValue({
                ...mockCO,
                title: "New Title",
                status: "sent",
            } as any);

            const result = await changeOrderService.update(workspaceId, coId, userId, {
                title: "New Title",
                status: "sent",
            });

            expect(changeOrderRepository.update).toHaveBeenCalledWith(
                workspaceId,
                coId,
                expect.objectContaining({
                    title: "New Title",
                    status: "sent",
                    sentAt: expect.any(Date),
                }),
                expect.anything(),
            );
            expect(writeAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    workspaceId,
                    actorId: userId,
                    entityType: "change_order",
                    entityId: coId,
                    action: "send",
                    metadata: expect.objectContaining({
                        oldStatus: "draft",
                        newStatus: "sent",
                    }),
                }),
            );
        });

        it("should set respondedAt when status changes to accepted", async () => {
            const mockCO = {
                id: coId,
                workspaceId,
                status: "sent",
            };
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(mockCO as any);
            vi.mocked(changeOrderRepository.update).mockResolvedValue({
                ...mockCO,
                status: "accepted",
            } as any);

            await changeOrderService.update(workspaceId, coId, userId, { status: "accepted" });

            expect(changeOrderRepository.update).toHaveBeenCalledWith(
                workspaceId,
                coId,
                expect.objectContaining({
                    status: "accepted",
                    respondedAt: expect.any(Date),
                }),
                expect.anything(),
            );
        });

        it("should set respondedAt when status changes to declined", async () => {
            const mockCO = {
                id: coId,
                workspaceId,
                status: "sent",
            };
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(mockCO as any);
            vi.mocked(changeOrderRepository.update).mockResolvedValue({
                ...mockCO,
                status: "declined",
            } as any);

            await changeOrderService.update(workspaceId, coId, userId, { status: "declined" });

            expect(changeOrderRepository.update).toHaveBeenCalledWith(
                workspaceId,
                coId,
                expect.objectContaining({
                    status: "declined",
                    respondedAt: expect.any(Date),
                }),
                expect.anything(),
            );
        });

        it("should use action 'update' for non-sent status changes", async () => {
            const mockCO = {
                id: coId,
                workspaceId,
                status: "draft",
            };
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(mockCO as any);
            vi.mocked(changeOrderRepository.update).mockResolvedValue({
                ...mockCO,
                status: "draft",
            } as any);

            await changeOrderService.update(workspaceId, coId, userId, { title: "Edited" });

            expect(writeAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    action: "update",
                }),
            );
        });
    });

    describe("workspace isolation", () => {
        it("cannot access change orders from another workspace via getById", async () => {
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(null);

            await expect(changeOrderService.getById(workspaceId, coId)).rejects.toThrow(
                NotFoundError,
            );

            expect(changeOrderRepository.getById).toHaveBeenCalledWith(workspaceId, coId);
        });

        it("list only returns change orders for the requested workspace", async () => {
            vi.mocked(changeOrderRepository.list).mockResolvedValue([]);

            await changeOrderService.list(workspaceId);

            expect(changeOrderRepository.list).toHaveBeenCalledWith(workspaceId, undefined);
            expect(changeOrderRepository.list).not.toHaveBeenCalledWith(
                otherWorkspaceId,
                undefined,
            );
        });

        it("create associates change order with the provided workspaceId", async () => {
            vi.mocked(changeOrderRepository.create).mockResolvedValue({
                id: coId,
                workspaceId,
                title: "Test CO",
            } as any);

            await changeOrderService.create(workspaceId, userId, {
                projectId: "proj-1",
                title: "Test CO",
            });

            expect(changeOrderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ workspaceId }),
                expect.anything(),
            );
        });
    });

    describe("accept/decline state validation", () => {
        it("should allow accepting a sent change order", async () => {
            const mockCO = {
                id: coId,
                workspaceId,
                status: "sent",
            };
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(mockCO as any);
            vi.mocked(changeOrderRepository.update).mockResolvedValue({
                ...mockCO,
                status: "accepted",
            } as any);

            const result = await changeOrderService.update(workspaceId, coId, userId, {
                status: "accepted",
            });

            expect(result).not.toBeNull();
            expect(result?.status).toBe("accepted");
        });

        it("should allow declining a sent change order", async () => {
            const mockCO = {
                id: coId,
                workspaceId,
                status: "sent",
            };
            vi.mocked(changeOrderRepository.getById).mockResolvedValue(mockCO as any);
            vi.mocked(changeOrderRepository.update).mockResolvedValue({
                ...mockCO,
                status: "declined",
            } as any);

            const result = await changeOrderService.update(workspaceId, coId, userId, {
                status: "declined",
            });

            expect(result).not.toBeNull();
            expect(result?.status).toBe("declined");
        });
    });

    describe("countPending", () => {
        it("should return pending count for workspace", async () => {
            vi.mocked(changeOrderRepository.countPending).mockResolvedValue(3);

            const result = await changeOrderService.countPending(workspaceId);

            expect(result).toBe(3);
            expect(changeOrderRepository.countPending).toHaveBeenCalledWith(workspaceId);
        });
    });
});
