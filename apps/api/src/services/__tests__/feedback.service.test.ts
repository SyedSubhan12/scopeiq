import { beforeEach, describe, expect, it, vi } from "vitest";
import { feedbackService } from "../feedback.service.js";
import { feedbackRepository } from "../../repositories/feedback.repository.js";
import { deliverableRepository } from "../../repositories/deliverable.repository.js";
import { db, writeAuditLog } from "@novabots/db";
import { NotFoundError } from "@novabots/types";

vi.mock("../../repositories/feedback.repository.js");
vi.mock("../../repositories/deliverable.repository.js");
vi.mock("../../jobs/summarize-feedback.job.js", () => ({
  dispatchSummarizeFeedbackJob: vi.fn(),
}));
vi.mock("../../jobs/scope-check.job.js", () => ({
  dispatchScopeCheckJob: vi.fn(),
}));
vi.mock("@novabots/db", () => ({
  db: {
    transaction: vi.fn((fn) => fn({})),
  },
  writeAuditLog: vi.fn(),
}));

describe("FeedbackService", () => {
  const workspaceId = "ws-123";
  const feedbackId = "fb-123";
  const deliverableId = "del-123";
  const actorId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes audit_log in the same transaction when resolving feedback", async () => {
    vi.mocked(feedbackRepository.getById).mockResolvedValue({
      id: feedbackId,
      deliverableId,
      body: "Need another pass",
    } as never);
    vi.mocked(feedbackRepository.setResolved).mockResolvedValue({
      id: feedbackId,
      deliverableId,
      resolvedAt: new Date(),
    } as never);

    await feedbackService.resolve(workspaceId, feedbackId, actorId, true);

    expect(feedbackRepository.setResolved).toHaveBeenCalledWith(
      workspaceId,
      feedbackId,
      true,
      expect.anything(),
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        workspaceId,
        actorId,
        entityType: "feedback",
        entityId: feedbackId,
        action: "update",
        metadata: expect.objectContaining({
          deliverableId,
          resolved: true,
        }),
      }),
    );
  });

  it("writes audit_log in the same transaction when deleting feedback", async () => {
    vi.mocked(feedbackRepository.getById).mockResolvedValue({
      id: feedbackId,
      deliverableId,
      body: "Delete me",
    } as never);
    vi.mocked(feedbackRepository.delete).mockResolvedValue({
      id: feedbackId,
      deliverableId,
    } as never);

    await feedbackService.delete(feedbackId, workspaceId, actorId);

    expect(feedbackRepository.delete).toHaveBeenCalledWith(
      feedbackId,
      workspaceId,
      expect.anything(),
    );
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        workspaceId,
        actorId,
        entityType: "feedback",
        entityId: feedbackId,
        action: "delete",
        metadata: expect.objectContaining({
          deliverableId,
        }),
      }),
    );
  });

  it("throws NotFoundError when resolving a feedback item outside the workspace", async () => {
    vi.mocked(feedbackRepository.getById).mockResolvedValue(null);

    await expect(
      feedbackService.resolve(workspaceId, feedbackId, actorId, true),
    ).rejects.toThrow(NotFoundError);
  });

  it("verifies deliverable ownership before creating feedback", async () => {
    vi.mocked(deliverableRepository.getById).mockResolvedValue(null);

    await expect(
      feedbackService.submit({
        workspaceId,
        deliverableId,
        body: "Looks off",
        authorId: actorId,
        source: "manual_input",
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
