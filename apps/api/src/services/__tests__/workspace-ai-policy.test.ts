import { describe, it, expect, vi, beforeEach } from "vitest";
import { workspaceService } from "../workspace.service.js";
import { workspaceRepository } from "../../repositories/workspace.repository.js";
import { db, writeAuditLog } from "@novabots/db";
import { NotFoundError } from "@novabots/types";

vi.mock("../../repositories/workspace.repository.js");
vi.mock("../../repositories/user.repository.js");
vi.mock("@novabots/db", () => ({
  db: {
    transaction: vi.fn((fn: (trx: object) => Promise<unknown>) => fn({})),
  },
  workspaces: {},
  writeAuditLog: vi.fn(),
}));
vi.mock("../../lib/strip-undefined.js", () => ({
  stripUndefined: vi.fn(<T extends Record<string, unknown>>(obj: T): T => {
    const result = {} as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) result[key] = value;
    }
    return result as T;
  }),
}));

const workspaceId = "ws-test-001";
const actorId = "user-admin-001";

const baseWorkspace = {
  id: workspaceId,
  name: "Test Workspace",
  slug: "test-workspace",
  plan: "solo" as const,
  briefScoreThreshold: 60,
  scopeGuardThreshold: "0.60",
  autoHoldEnabled: true,
  autoApproveAfterDays: 3,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  logoUrl: null,
  brandColor: "#0F6E56",
  secondaryColor: "#1D9E75",
  brandFont: "Inter",
  customDomain: null,
  domainVerificationStatus: "pending" as const,
  domainVerificationToken: null,
  domainVerifiedAt: null,
  domainVerificationAttemptedAt: null,
  reminderSettings: { step1Hours: 48, step2Hours: 72, step3Hours: 48 },
  settingsJson: {},
  onboardingProgress: {},
  features: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// Typed as the inferred select from the schema — we cast to any for test mocks
// since the test VM doesn't load the real Drizzle column definitions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockWorkspace = baseWorkspace as any;

describe("workspaceService.updateAiPolicy — happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates all four AI policy fields and returns the workspace", async () => {
    const updated = {
      ...baseWorkspace,
      briefScoreThreshold: 75,
      scopeGuardThreshold: "0.75",
      autoHoldEnabled: false,
      autoApproveAfterDays: 7,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(workspaceRepository.updateAiPolicy).mockResolvedValue(updated as any);

    const result = await workspaceService.updateAiPolicy(workspaceId, actorId, {
      briefScoreThreshold: 75,
      scopeGuardThreshold: "0.75",
      autoHoldEnabled: false,
      autoApproveAfterDays: 7,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = result as any;
    expect(r.briefScoreThreshold).toBe(75);
    expect(r.scopeGuardThreshold).toBe("0.75");
    expect(r.autoHoldEnabled).toBe(false);
    expect(r.autoApproveAfterDays).toBe(7);
    expect(workspaceRepository.updateAiPolicy).toHaveBeenCalledOnce();
  });

  it("writes an audit log entry in the same transaction", async () => {
    vi.mocked(workspaceRepository.updateAiPolicy).mockResolvedValue(mockWorkspace);

    await workspaceService.updateAiPolicy(workspaceId, actorId, {
      briefScoreThreshold: 80,
    });

    expect(writeAuditLog).toHaveBeenCalledOnce();
    const auditCall = vi.mocked(writeAuditLog).mock.calls[0]!;
    expect(auditCall[1]).toMatchObject({
      workspaceId,
      actorId,
      entityType: "workspace",
      entityId: workspaceId,
      action: "update",
      metadata: { context: "ai_policy" },
    });
  });

  it("wraps both writes in a database transaction", async () => {
    vi.mocked(workspaceRepository.updateAiPolicy).mockResolvedValue(mockWorkspace);

    await workspaceService.updateAiPolicy(workspaceId, actorId, {
      autoHoldEnabled: false,
    });

    expect(vi.mocked(db.transaction)).toHaveBeenCalledOnce();
  });
});

describe("workspaceService.updateAiPolicy — validation edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws NotFoundError when repository returns null", async () => {
    vi.mocked(workspaceRepository.updateAiPolicy).mockResolvedValue(null);

    await expect(
      workspaceService.updateAiPolicy(workspaceId, actorId, {
        briefScoreThreshold: 60,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("does not call writeAuditLog when repository throws", async () => {
    vi.mocked(workspaceRepository.updateAiPolicy).mockRejectedValue(
      new Error("DB error"),
    );

    await expect(
      workspaceService.updateAiPolicy(workspaceId, actorId, {
        autoApproveAfterDays: 5,
      }),
    ).rejects.toThrow("DB error");

    expect(writeAuditLog).not.toHaveBeenCalled();
  });

  it("strips undefined keys before passing data to the repository", async () => {
    vi.mocked(workspaceRepository.updateAiPolicy).mockResolvedValue(mockWorkspace);

    await workspaceService.updateAiPolicy(workspaceId, actorId, {
      briefScoreThreshold: 50,
    });

    const repoCall = vi.mocked(workspaceRepository.updateAiPolicy).mock.calls[0]!;
    const dataArg = repoCall[1] as Record<string, unknown>;
    expect(dataArg).toHaveProperty("briefScoreThreshold", 50);
    expect(dataArg).not.toHaveProperty("autoApproveAfterDays");
  });
});

describe("workspaceService.updateAiPolicy — workspace isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the correct workspaceId to the repository", async () => {
    vi.mocked(workspaceRepository.updateAiPolicy).mockResolvedValue(mockWorkspace);

    await workspaceService.updateAiPolicy(workspaceId, actorId, {
      autoHoldEnabled: true,
    });

    const repoCall = vi.mocked(workspaceRepository.updateAiPolicy).mock.calls[0]!;
    expect(repoCall[0]).toBe(workspaceId);
  });

  it("throws NotFoundError for an unknown workspaceId (repository returns null)", async () => {
    const unknownWorkspaceId = "ws-does-not-exist";
    vi.mocked(workspaceRepository.updateAiPolicy).mockResolvedValue(null);

    await expect(
      workspaceService.updateAiPolicy(unknownWorkspaceId, actorId, {
        briefScoreThreshold: 60,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("never queries a workspace other than the one provided", async () => {
    const workspaceA = "ws-aaa";
    const workspaceB = "ws-bbb";
    vi.mocked(workspaceRepository.updateAiPolicy).mockResolvedValue(mockWorkspace);

    await workspaceService.updateAiPolicy(workspaceA, actorId, {
      scopeGuardThreshold: "0.50",
    });

    const repoCall = vi.mocked(workspaceRepository.updateAiPolicy).mock.calls[0]!;
    expect(repoCall[0]).toBe(workspaceA);
    expect(repoCall[0]).not.toBe(workspaceB);
  });
});
