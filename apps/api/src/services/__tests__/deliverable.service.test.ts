import { describe, it, expect, vi, beforeEach } from "vitest";
import { deliverableService } from "../deliverable.service.js";
import { deliverableRepository } from "../../repositories/deliverable.repository.js";
import { deliverableRevisionRepository } from "../../repositories/deliverable-revision.repository.js";
import { approvalEventRepository } from "../../repositories/approval-event.repository.js";
import { db, writeAuditLog } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";

// Mock dependencies
vi.mock("../../repositories/deliverable.repository.js");
vi.mock("../../repositories/deliverable-revision.repository.js");
vi.mock("../../repositories/approval-event.repository.js");
vi.mock("../reminder.service.js", () => ({
    reminderService: {
        scheduleReminderSequence: vi.fn().mockResolvedValue(undefined),
        processReminderStep: vi.fn().mockResolvedValue({ action: "sent_gentle_nudge" }),
        autoApproveAfterSilence: vi.fn().mockResolvedValue({ action: "auto_approved" }),
    },
    getReminderQueue: vi.fn(),
    startReminderWorker: vi.fn(),
}));
vi.mock("@novabots/db", () => ({
    db: {
        transaction: vi.fn((fn) => fn({})),
    },
    writeAuditLog: vi.fn(),
}));
vi.mock("../../lib/storage.js", () => ({
    getUploadUrl: vi.fn().mockResolvedValue("https://upload.example.com/presigned-url"),
    getDownloadUrl: vi.fn().mockResolvedValue("https://download.example.com/presigned-url"),
}));
vi.mock("../../lib/strip-undefined.js", () => ({
    stripUndefined: vi.fn((obj: Record<string, unknown>) => {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                result[key] = value;
            }
        }
        return result;
    }),
}));

describe("DeliverableService", () => {
    const workspaceId = "ws-123";
    const otherWorkspaceId = "ws-456";
    const actorId = "user-123";
    const deliverableId = "del-abc";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("list", () => {
        it("should call repository list with workspaceId and options", async () => {
            const options = { projectId: "proj-1", limit: 10 };
            vi.mocked(deliverableRepository.list).mockResolvedValue({
                data: [],
                pagination: { next_cursor: null, has_more: false },
            } as any);

            await deliverableService.list(workspaceId, options);

            expect(deliverableRepository.list).toHaveBeenCalledWith(workspaceId, options);
        });
    });

    describe("getById", () => {
        it("should return the deliverable if found", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                name: "Test Deliverable",
                status: "draft",
                revisionRound: 0,
                maxRevisions: 3,
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);

            const result = await deliverableService.getById(workspaceId, deliverableId);

            expect(result).toEqual(mockDeliverable);
        });

        it("should throw NotFoundError when deliverable does not exist", async () => {
            vi.mocked(deliverableRepository.getById).mockResolvedValue(null);

            await expect(
                deliverableService.getById(workspaceId, "nonexistent"),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("approve", () => {
        it("should create approval_event with eventType 'approval'", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
                name: "Test Deliverable",
                revisionRound: 1,
                maxRevisions: 3,
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);
            vi.mocked(deliverableRepository.update).mockResolvedValue({
                ...mockDeliverable,
                status: "approved",
            } as any);
            const mockEvent = {
                id: "evt-1",
                eventType: "approval",
                action: "approved",
            };
            vi.mocked(approvalEventRepository.create).mockResolvedValue(mockEvent as any);

            const result = await deliverableService.approve(
                workspaceId,
                deliverableId,
                actorId,
                "Test User",
                "Looks great!",
            );

            expect(approvalEventRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    workspaceId,
                    deliverableId,
                    eventType: "approval",
                    actorId,
                    actorName: "Test User",
                    action: "approved",
                    comment: "Looks great!",
                }),
                expect.anything(),
            );
            expect(result).toEqual(mockEvent);
        });

        it("should write audit_log with action 'approve'", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);
            vi.mocked(deliverableRepository.update).mockResolvedValue({
                ...mockDeliverable,
                status: "approved",
            } as any);
            vi.mocked(approvalEventRepository.create).mockResolvedValue({ id: "evt-1" } as any);

            await deliverableService.approve(workspaceId, deliverableId, actorId, "Test User");

            expect(writeAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    workspaceId,
                    actorId,
                    entityType: "deliverable",
                    entityId: deliverableId,
                    action: "approve",
                }),
            );
        });

        it("should update deliverable status to 'approved'", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);
            vi.mocked(deliverableRepository.update).mockResolvedValue({
                ...mockDeliverable,
                status: "approved",
            } as any);
            vi.mocked(approvalEventRepository.create).mockResolvedValue({ id: "evt-1" } as any);

            await deliverableService.approve(workspaceId, deliverableId, actorId, "Test User");

            expect(deliverableRepository.update).toHaveBeenCalledWith(
                workspaceId,
                deliverableId,
                { status: "approved" },
                expect.anything(),
            );
        });

        it("should throw ValidationError when deliverable is already approved", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "approved",
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);

            await expect(
                deliverableService.approve(workspaceId, deliverableId, actorId, "Test User"),
            ).rejects.toThrow(ValidationError);

            await expect(
                deliverableService.approve(workspaceId, deliverableId, actorId, "Test User"),
            ).rejects.toThrow("Deliverable is already approved");
        });

        it("should allow null actorId and actorName for system approvals", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);
            vi.mocked(deliverableRepository.update).mockResolvedValue({
                ...mockDeliverable,
                status: "approved",
            } as any);
            vi.mocked(approvalEventRepository.create).mockResolvedValue({ id: "evt-1" } as any);

            await deliverableService.approve(workspaceId, deliverableId, null, null);

            expect(approvalEventRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    actorId: null,
                    actorName: null,
                    comment: null,
                }),
                expect.anything(),
            );
        });
    });

    describe("requestRevision", () => {
        it("should increment revision_round", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
                revisionRound: 1,
                maxRevisions: 3,
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);
            vi.mocked(deliverableRepository.update).mockResolvedValue({
                ...mockDeliverable,
                status: "changes_requested",
                revisionRound: 2,
            } as any);
            vi.mocked(approvalEventRepository.create).mockResolvedValue({ id: "evt-1" } as any);

            await deliverableService.requestRevision(
                workspaceId,
                deliverableId,
                actorId,
                "Test User",
                "Needs more work",
            );

            expect(deliverableRepository.update).toHaveBeenCalledWith(
                workspaceId,
                deliverableId,
                expect.objectContaining({
                    status: "changes_requested",
                    revisionRound: 2,
                }),
                expect.anything(),
            );
        });

        it("should create approval_event with eventType 'revision'", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
                revisionRound: 0,
                maxRevisions: 3,
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);
            vi.mocked(deliverableRepository.update).mockResolvedValue({
                ...mockDeliverable,
                status: "changes_requested",
                revisionRound: 1,
            } as any);
            vi.mocked(approvalEventRepository.create).mockResolvedValue({ id: "evt-1" } as any);

            await deliverableService.requestRevision(
                workspaceId,
                deliverableId,
                actorId,
                "Test User",
                "Please revise section 3",
            );

            expect(approvalEventRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    workspaceId,
                    deliverableId,
                    eventType: "revision",
                    actorId,
                    actorName: "Test User",
                    action: "changes_requested",
                    comment: "Please revise section 3",
                }),
                expect.anything(),
            );
        });

        it("should write audit_log with revision round in metadata", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
                revisionRound: 1,
                maxRevisions: 3,
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);
            vi.mocked(deliverableRepository.update).mockResolvedValue({
                ...mockDeliverable,
                status: "changes_requested",
                revisionRound: 2,
            } as any);
            vi.mocked(approvalEventRepository.create).mockResolvedValue({ id: "evt-1" } as any);

            await deliverableService.requestRevision(
                workspaceId,
                deliverableId,
                actorId,
                "Test User",
            );

            expect(writeAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    workspaceId,
                    actorId,
                    entityType: "deliverable",
                    entityId: deliverableId,
                    action: "update",
                    metadata: expect.objectContaining({
                        revisionRound: 2,
                    }),
                }),
            );
        });

        it("should throw ValidationError when at revision limit", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
                revisionRound: 3,
                maxRevisions: 3,
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);

            await expect(
                deliverableService.requestRevision(
                    workspaceId,
                    deliverableId,
                    actorId,
                    "Test User",
                    "One more change",
                ),
            ).rejects.toThrow(ValidationError);

            await expect(
                deliverableService.requestRevision(
                    workspaceId,
                    deliverableId,
                    actorId,
                    "Test User",
                    "One more change",
                ),
            ).rejects.toThrow("Revision limit reached (3/3)");
        });

        it("should throw NotFoundError when deliverable does not exist", async () => {
            vi.mocked(deliverableRepository.getById).mockResolvedValue(null);

            await expect(
                deliverableService.requestRevision(
                    workspaceId,
                    "nonexistent",
                    actorId,
                    "Test User",
                ),
            ).rejects.toThrow(NotFoundError);
        });

        it("should increment from revisionRound 0 to 1 on first revision", async () => {
            const mockDeliverable = {
                id: deliverableId,
                workspaceId,
                status: "in_review",
                revisionRound: 0,
                maxRevisions: 3,
            };
            vi.mocked(deliverableRepository.getById).mockResolvedValue(mockDeliverable as any);
            vi.mocked(deliverableRepository.update).mockResolvedValue({
                ...mockDeliverable,
                status: "changes_requested",
                revisionRound: 1,
            } as any);
            vi.mocked(approvalEventRepository.create).mockResolvedValue({ id: "evt-1" } as any);

            await deliverableService.requestRevision(
                workspaceId,
                deliverableId,
                actorId,
                "Test User",
            );

            expect(deliverableRepository.update).toHaveBeenCalledWith(
                workspaceId,
                deliverableId,
                expect.objectContaining({
                    revisionRound: 1,
                }),
                expect.anything(),
            );
        });
    });

    describe("workspace isolation", () => {
        it("getById throws NotFoundError when deliverable is not in requesting workspace", async () => {
            vi.mocked(deliverableRepository.getById).mockResolvedValue(null);

            await expect(
                deliverableService.getById(workspaceId, deliverableId),
            ).rejects.toThrow(NotFoundError);

            expect(deliverableRepository.getById).toHaveBeenCalledWith(workspaceId, deliverableId);
            expect(deliverableRepository.getById).not.toHaveBeenCalledWith(
                otherWorkspaceId,
                deliverableId,
            );
        });

        it("approve cannot access deliverables from other workspaces", async () => {
            vi.mocked(deliverableRepository.getById).mockResolvedValue(null);

            await expect(
                deliverableService.approve(workspaceId, deliverableId, actorId, "User"),
            ).rejects.toThrow(NotFoundError);
        });

        it("requestRevision cannot access deliverables from other workspaces", async () => {
            vi.mocked(deliverableRepository.getById).mockResolvedValue(null);

            await expect(
                deliverableService.requestRevision(
                    workspaceId,
                    deliverableId,
                    actorId,
                    "User",
                ),
            ).rejects.toThrow(NotFoundError);
        });

        it("list only returns deliverables for the requested workspace", async () => {
            vi.mocked(deliverableRepository.list).mockResolvedValue({
                data: [],
                pagination: { next_cursor: null, has_more: false },
            } as any);

            await deliverableService.list(workspaceId, {});

            expect(deliverableRepository.list).toHaveBeenCalledWith(
                workspaceId,
                expect.any(Object),
            );
        });
    });
});
