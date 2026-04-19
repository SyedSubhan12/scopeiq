import { describe, it, expect, vi, beforeEach } from "vitest";
import { domainService } from "../domain.service.js";
import { workspaceRepository } from "../../repositories/workspace.repository.js";
import { NotFoundError, ValidationError } from "@novabots/types";
import { db, writeAuditLog } from "@novabots/db";
import { resolveTxt } from "dns/promises";

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock("../../repositories/workspace.repository.js");

vi.mock("@novabots/db", () => ({
  db: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: vi.fn((fn: (trx: unknown) => Promise<any>) => fn({})),
  },
  writeAuditLog: vi.fn(),
}));

vi.mock("dns/promises", () => ({
  resolveTxt: vi.fn(),
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

const workspaceId = "ws-aaa-111";
const otherWorkspaceId = "ws-bbb-222";
const userId = "user-xyz-999";
const customDomain = "portal.acme.com";
const verificationToken = "abc123def456abc123def456abc123def456abc123def456";

const baseWorkspace = {
  id: workspaceId,
  customDomain,
  domainVerificationStatus: "pending" as const,
  domainVerificationToken: verificationToken,
  domainVerifiedAt: null,
  domainVerificationAttemptedAt: null,
  deletedAt: null,
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe("domainService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(db.transaction) as any).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn: (trx: unknown) => Promise<any>) => fn({}) as Promise<unknown>,
    );
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  describe("happy path", () => {
    it("requestDomainVerification: returns DNS record instructions and persists pending status", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(baseWorkspace as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(workspaceRepository.updateDomainVerification).mockResolvedValue(baseWorkspace as any);

      const result = await domainService.requestDomainVerification(workspaceId, userId);

      expect(result.workspaceId).toBe(workspaceId);
      expect(result.customDomain).toBe(customDomain);
      expect(result.verificationToken).toBeTypeOf("string");
      expect(result.verificationToken.length).toBeGreaterThan(0);
      expect(result.dnsRecord.recordType).toBe("TXT");
      expect(result.dnsRecord.host).toBe(`_scopeiq-challenge.${customDomain}`);
      expect(result.dnsRecord.value).toMatch(/^scopeiq-verify=/);
      expect(result.dnsRecord.ttlSeconds).toBe(300);

      expect(workspaceRepository.updateDomainVerification).toHaveBeenCalledWith(
        workspaceId,
        expect.objectContaining({
          domainVerificationStatus: "pending",
          domainVerificationToken: expect.any(String) as string,
        }),
        expect.anything(),
      );

      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          workspaceId,
          actorId: userId,
          entityType: "workspace",
          entityId: workspaceId,
          action: "update",
          metadata: expect.objectContaining({
            newStatus: "pending",
            customDomain,
          }),
        }),
      );
    });

    it("verifyDomain: flips status to verified when TXT record matches", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(baseWorkspace as any);
      vi.mocked(workspaceRepository.updateDomainVerification).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...baseWorkspace, domainVerificationStatus: "verified" as const } as any,
      );
      vi.mocked(resolveTxt).mockResolvedValue([
        [`scopeiq-verify=${verificationToken}`],
      ]);

      const result = await domainService.verifyDomain(workspaceId, userId);

      expect(result.status).toBe("verified");
      expect(result.customDomain).toBe(customDomain);

      expect(workspaceRepository.updateDomainVerification).toHaveBeenCalledWith(
        workspaceId,
        expect.objectContaining({
          domainVerificationStatus: "verified",
          domainVerifiedAt: expect.any(Date) as Date,
        }),
        expect.anything(),
      );

      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          workspaceId,
          entityId: workspaceId,
          action: "update",
          metadata: expect.objectContaining({ newStatus: "verified" }),
        }),
      );
    });

    it("verifyDomain: flips status to failed when TXT record value does not match", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(baseWorkspace as any);
      vi.mocked(workspaceRepository.updateDomainVerification).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...baseWorkspace, domainVerificationStatus: "failed" as const } as any,
      );
      vi.mocked(resolveTxt).mockResolvedValue([[`scopeiq-verify=WRONGTOKEN`]]);

      const result = await domainService.verifyDomain(workspaceId, userId);

      expect(result.status).toBe("failed");
      expect(workspaceRepository.updateDomainVerification).toHaveBeenCalledWith(
        workspaceId,
        expect.objectContaining({
          domainVerificationStatus: "failed",
          domainVerifiedAt: null,
        }),
        expect.anything(),
      );
    });

    it("verifyDomain: treats DNS resolution error as failed attempt, not a thrown error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(baseWorkspace as any);
      vi.mocked(workspaceRepository.updateDomainVerification).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...baseWorkspace, domainVerificationStatus: "failed" as const } as any,
      );
      vi.mocked(resolveTxt).mockRejectedValue(new Error("ENOTFOUND"));

      const result = await domainService.verifyDomain(workspaceId, userId);

      expect(result.status).toBe("failed");
    });

    it("getDomainStatus: returns all verification fields for the workspace", async () => {
      const verifiedWorkspace = {
        ...baseWorkspace,
        domainVerificationStatus: "verified" as const,
        domainVerifiedAt: new Date("2026-04-18T00:00:00Z"),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(verifiedWorkspace as any);

      const status = await domainService.getDomainStatus(workspaceId);

      expect(status.workspaceId).toBe(workspaceId);
      expect(status.customDomain).toBe(customDomain);
      expect(status.domainVerificationStatus).toBe("verified");
      expect(status.domainVerifiedAt).toBeInstanceOf(Date);
    });
  });

  // ── Validation errors ──────────────────────────────────────────────────────

  describe("validation errors", () => {
    it("requestDomainVerification: throws ValidationError when no customDomain is set", async () => {
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...baseWorkspace, customDomain: null } as any,
      );

      await expect(
        domainService.requestDomainVerification(workspaceId, userId),
      ).rejects.toThrow(ValidationError);
    });

    it("verifyDomain: throws ValidationError when no customDomain is set", async () => {
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...baseWorkspace, customDomain: null } as any,
      );

      await expect(domainService.verifyDomain(workspaceId, userId)).rejects.toThrow(
        ValidationError,
      );
    });

    it("verifyDomain: throws ValidationError when no verification token exists yet", async () => {
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...baseWorkspace, domainVerificationToken: null } as any,
      );

      await expect(domainService.verifyDomain(workspaceId, userId)).rejects.toThrow(
        ValidationError,
      );
    });

    it("requestDomainVerification: throws NotFoundError when workspace does not exist", async () => {
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(null);

      await expect(
        domainService.requestDomainVerification(workspaceId, userId),
      ).rejects.toThrow(NotFoundError);
    });

    it("getDomainStatus: throws NotFoundError when workspace does not exist", async () => {
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(null);

      await expect(domainService.getDomainStatus(workspaceId)).rejects.toThrow(NotFoundError);
    });
  });

  // ── Workspace isolation ────────────────────────────────────────────────────

  describe("workspace isolation", () => {
    it("requestDomainVerification: repository is always called with the provided workspaceId", async () => {
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(null);

      await expect(
        domainService.requestDomainVerification(otherWorkspaceId, userId),
      ).rejects.toThrow(NotFoundError);

      expect(workspaceRepository.getByIdWithDomain).toHaveBeenCalledWith(otherWorkspaceId);
      expect(workspaceRepository.getByIdWithDomain).not.toHaveBeenCalledWith(workspaceId);
    });

    it("verifyDomain: repository is always called with the provided workspaceId", async () => {
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(null);

      await expect(
        domainService.verifyDomain(otherWorkspaceId, userId),
      ).rejects.toThrow(NotFoundError);

      expect(workspaceRepository.getByIdWithDomain).toHaveBeenCalledWith(otherWorkspaceId);
      expect(workspaceRepository.getByIdWithDomain).not.toHaveBeenCalledWith(workspaceId);
    });

    it("getDomainStatus: repository is always called with the provided workspaceId", async () => {
      vi.mocked(workspaceRepository.getByIdWithDomain).mockResolvedValue(null);

      await expect(domainService.getDomainStatus(otherWorkspaceId)).rejects.toThrow(
        NotFoundError,
      );

      expect(workspaceRepository.getByIdWithDomain).toHaveBeenCalledWith(otherWorkspaceId);
      expect(workspaceRepository.getByIdWithDomain).not.toHaveBeenCalledWith(workspaceId);
    });
  });
});
