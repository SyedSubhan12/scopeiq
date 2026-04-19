import { describe, it, expect, vi, beforeEach } from "vitest";
import { changeOrderService } from "../change-order.service.js";
import { changeOrderRepository } from "../../repositories/change-order.repository.js";
import { NotFoundError } from "@novabots/types";
import { db, writeAuditLog } from "@novabots/db";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../repositories/change-order.repository.js");

vi.mock("@novabots/db", () => ({
    db: {
        transaction: vi.fn((fn: (trx: unknown) => unknown) => fn({})),
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([
                    { id: "proj-1", sowId: null, name: "Test Project" },
                ]),
            }),
        }),
    },
    writeAuditLog: vi.fn(),
    projects: { id: "id", sowId: "sowId", workspaceId: "workspaceId", name: "name" },
    eq: vi.fn(),
    and: vi.fn(),
}));

vi.mock("../../lib/change-order-pdf.js", () => ({
    generateSignedCoPdf: vi.fn().mockResolvedValue({
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
        hash: "a".repeat(64),
    }),
}));

vi.mock("../../lib/storage.js", () => ({
    putBytes: vi.fn().mockResolvedValue(undefined),
    getDownloadUrl: vi.fn().mockResolvedValue("https://storage.example.com/signed.pdf"),
}));

vi.mock("../../lib/email.js", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../emails/index.js", () => ({
    ChangeOrderSentEmail: vi.fn(),
    ChangeOrderAcceptedEmail: vi.fn(),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const workspaceId = "ws-aaaaaaaa-0000-0000-0000-000000000001";
const projectId   = "proj-1";
const coId        = "co-aaaaaaaa-0000-0000-0000-000000000001";

function makeSentCo(overrides: Record<string, unknown> = {}) {
    return {
        id: coId,
        workspaceId,
        projectId,
        scopeFlagId: null,
        title: "Add Login Page",
        workDescription: "OAuth2 login",
        revisedTimeline: null,
        estimatedHours: 8,
        pricing: { amount: 1600 },
        status: "sent",
        signedPdfKey: null,
        signedPdfHash: null,
        signedByName: null,
        signedByIp: null,
        signedAt: null,
        scopeItemsJson: [],
        ...overrides,
    };
}

const acceptInput = {
    changeOrderId: coId,
    workspaceId,
    projectId,
    signatureName: "Alice Client",
    signerIp: "10.0.0.1",
};

// ── Test suites ───────────────────────────────────────────────────────────────

describe("acceptWithFullTransaction — happy path", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("generates and stores a signed PDF on first acceptance", async () => {
        vi.mocked(changeOrderRepository.getById).mockResolvedValue(makeSentCo() as never);
        vi.mocked(changeOrderRepository.update).mockResolvedValue({
            ...makeSentCo(),
            status: "accepted",
            signedPdfKey: `workspaces/${workspaceId}/change-orders/${coId}/signed-1234.pdf`,
            signedPdfHash: "a".repeat(64),
        } as never);

        const { putBytes } = await import("../../lib/storage.js");
        const { generateSignedCoPdf } = await import("../../lib/change-order-pdf.js");

        const result = await changeOrderService.acceptWithFullTransaction(acceptInput);

        expect(generateSignedCoPdf).toHaveBeenCalledOnce();
        expect(putBytes).toHaveBeenCalledOnce();
        expect(result).not.toBeNull();
    });

    it("calls writeAuditLog with signedPdfKey, signedPdfHash and signerIp in metadata", async () => {
        vi.mocked(changeOrderRepository.getById).mockResolvedValue(makeSentCo() as never);
        vi.mocked(changeOrderRepository.update).mockResolvedValue({
            ...makeSentCo(),
            status: "accepted",
        } as never);

        await changeOrderService.acceptWithFullTransaction(acceptInput);

        expect(writeAuditLog).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                action: "approve",
                metadata: expect.objectContaining({
                    signedByIp: "10.0.0.1",
                    signedByName: "Alice Client",
                    signedPdfHash: expect.stringMatching(/^[0-9a-f]{64}$/),
                }),
            }),
        );
    });

    it("updates the row with signedPdfKey and signedPdfHash", async () => {
        vi.mocked(changeOrderRepository.getById).mockResolvedValue(makeSentCo() as never);
        vi.mocked(changeOrderRepository.update).mockResolvedValue({
            ...makeSentCo(),
            status: "accepted",
        } as never);

        await changeOrderService.acceptWithFullTransaction(acceptInput);

        expect(changeOrderRepository.update).toHaveBeenCalledWith(
            workspaceId,
            coId,
            expect.objectContaining({
                status: "accepted",
                signedByIp: "10.0.0.1",
                signedPdfKey: expect.stringContaining("signed-"),
                signedPdfHash: "a".repeat(64),
            }),
            expect.anything(),
        );
    });
});

describe("acceptWithFullTransaction — idempotency", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns existing record immediately when CO is already accepted with PDF", async () => {
        const acceptedCo = makeSentCo({
            status: "accepted",
            signedPdfKey: `workspaces/${workspaceId}/change-orders/${coId}/signed-old.pdf`,
            signedPdfHash: "b".repeat(64),
        });
        vi.mocked(changeOrderRepository.getById).mockResolvedValue(acceptedCo as never);

        const { putBytes } = await import("../../lib/storage.js");
        const { generateSignedCoPdf } = await import("../../lib/change-order-pdf.js");

        const result = await changeOrderService.acceptWithFullTransaction(acceptInput);

        expect(generateSignedCoPdf).not.toHaveBeenCalled();
        expect(putBytes).not.toHaveBeenCalled();
        expect(changeOrderRepository.update).not.toHaveBeenCalled();
        expect(result).toEqual(acceptedCo);
    });

    it("does NOT call writeAuditLog on re-accept", async () => {
        const acceptedCo = makeSentCo({
            status: "accepted",
            signedPdfKey: "some-key",
            signedPdfHash: "c".repeat(64),
        });
        vi.mocked(changeOrderRepository.getById).mockResolvedValue(acceptedCo as never);

        await changeOrderService.acceptWithFullTransaction(acceptInput);

        expect(writeAuditLog).not.toHaveBeenCalled();
    });
});

describe("acceptWithFullTransaction — workspace isolation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("throws NotFoundError when CO does not exist in the workspace", async () => {
        vi.mocked(changeOrderRepository.getById).mockResolvedValue(null as never);

        await expect(
            changeOrderService.acceptWithFullTransaction(acceptInput),
        ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when CO belongs to a different project", async () => {
        vi.mocked(changeOrderRepository.getById).mockResolvedValue(
            makeSentCo({ projectId: "proj-other" }) as never,
        );

        await expect(
            changeOrderService.acceptWithFullTransaction({
                ...acceptInput,
                projectId: "proj-1",
            }),
        ).rejects.toThrow(NotFoundError);
    });

    it("throws when CO status is not sent or accepted", async () => {
        vi.mocked(changeOrderRepository.getById).mockResolvedValue(
            makeSentCo({ status: "draft" }) as never,
        );

        await expect(
            changeOrderService.acceptWithFullTransaction(acceptInput),
        ).rejects.toThrow("Change order is not in a state that can be accepted");
    });
});
