/**
 * Tests that the change-order service correctly wires take-rate billing
 * per Code Rule 10:
 *   - Payment intent created at CO generation (not acceptance)
 *   - Intent ID + take_rate fields written to the row
 *   - audit_log includes paymentIntentId and takeRatePct on create
 *   - Accepting a CO captures the intent inside the transaction
 *   - If capture fails, the entire accept transaction rolls back
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted stubs ────────────────────────────────────────────────────────────

const {
  mockTransactionImpl,
  mockDbSelect,
  trxMock,
} = vi.hoisted(() => {
  // trxMock: the object passed as `trx` to transaction callbacks.
  // It provides db-like chaining methods used inside the tx (e.g. workspace lookup).
  const trxMock = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
  };
  // Make trxMock methods chain by returning trxMock itself, except limit
  trxMock.select.mockReturnValue(trxMock);
  trxMock.from.mockReturnValue(trxMock);
  trxMock.where.mockReturnValue(trxMock);
  trxMock.insert.mockReturnValue(trxMock);
  trxMock.values.mockResolvedValue([]);
  trxMock.update.mockReturnValue(trxMock);
  trxMock.set.mockReturnValue(trxMock);
  trxMock.limit.mockResolvedValue([{ stripeCustomerId: null }]);

  // A mutable ref so individual tests can override the transaction behaviour
  const mockTransactionImpl = {
    run: (fn: (trx: unknown) => Promise<unknown>) => fn(trxMock),
  };

  // db.select chain for the outer (non-transactional) project query in acceptWithFullTransaction
  const mockDbSelectChain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  };
  mockDbSelectChain.from.mockReturnValue(mockDbSelectChain);
  mockDbSelectChain.where.mockReturnValue(mockDbSelectChain);
  // Default: return a project row (tests that don't use accept will not hit this path)
  mockDbSelectChain.limit.mockResolvedValue([
    { id: "proj-billing-001", sowId: null, name: "ACME Project" },
  ]);

  const mockDbSelect = vi.fn().mockReturnValue(mockDbSelectChain);

  return { mockTransactionImpl, mockDbSelect, trxMock };
});

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../../repositories/change-order.repository.js");

vi.mock("@novabots/db", () => ({
  db: {
    transaction: vi.fn((fn: (trx: unknown) => Promise<unknown>) =>
      mockTransactionImpl.run(fn),
    ),
    select: mockDbSelect,
  },
  workspaces: {},
  projects: {},
  sowClauses: {},
  deliverables: {},
  scopeFlags: {},
  eq: vi.fn(),
  and: vi.fn(),
  writeAuditLog: vi.fn(),
}));

vi.mock("../take-rate.service.js", () => ({
  takeRateService: {
    createPaymentIntent: vi.fn(),
    capturePaymentIntent: vi.fn(),
    getTakeRatePct: vi.fn(),
  },
}));

vi.mock("../../lib/email.js", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../../lib/change-order-pdf.js", () => ({
  generateSignedCoPdf: vi.fn().mockResolvedValue({ bytes: Buffer.from("pdf"), hash: "abc123" }),
}));
vi.mock("../../lib/storage.js", () => ({
  putBytes: vi.fn().mockResolvedValue(undefined),
  getDownloadUrl: vi.fn().mockResolvedValue("https://example.com/signed.pdf"),
}));
vi.mock("../../emails/index.js", () => ({
  ChangeOrderSentEmail: vi.fn(),
  ChangeOrderAcceptedEmail: vi.fn(),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { changeOrderService } from "../change-order.service.js";
import { changeOrderRepository } from "../../repositories/change-order.repository.js";
import { writeAuditLog } from "@novabots/db";
import { takeRateService } from "../take-rate.service.js";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const workspaceId = "ws-co-billing-001";
const userId = "user-billing-001";
const projectId = "proj-billing-001";
const coId = "co-billing-001";
const intentId = "pi_test_intent_001";

const baseCO = {
  id: coId,
  workspaceId,
  projectId,
  title: "Extra Feature",
  status: "draft" as const,
  pricing: { amount: 5000 },
  currency: "USD",
  stripePaymentIntentId: null,
  takeRatePct: null,
  takeRateAmountCents: null,
  scopeFlagId: null,
  scopeItemsJson: [],
  workDescription: null,
  estimatedHours: null,
  lineItemsJson: [],
  revisedTimeline: null,
  sentAt: null,
  respondedAt: null,
  expiresAt: null,
  signedAt: null,
  signedByName: null,
  signedByIp: null,
  signedPdfKey: null,
  signedPdfHash: null,
  pdfUrl: null,
  createdBy: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// ── Tests: create ─────────────────────────────────────────────────────────────

describe("changeOrderService.create — take-rate wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default transaction impl
    mockTransactionImpl.run = (fn) => fn(trxMock);
    // Restore trxMock.limit for workspace lookup inside create tx
    trxMock.limit.mockResolvedValue([{ stripeCustomerId: null }]);
    trxMock.select.mockReturnValue(trxMock);
    trxMock.from.mockReturnValue(trxMock);
    trxMock.where.mockReturnValue(trxMock);
  });

  it("creates a payment intent when amount is set and writes intent fields to the row", async () => {
    vi.mocked(changeOrderRepository.create).mockResolvedValue(baseCO as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue(baseCO as never);
    vi.mocked(takeRateService.createPaymentIntent).mockResolvedValue({
      paymentIntentId: intentId,
      takeRatePct: 0.04,
      takeRateAmountCents: 20000,
    });

    await changeOrderService.create(workspaceId, userId, {
      projectId,
      title: "Extra Feature",
      amount: 5000,
    });

    // amount 5000 dollars → 500000 cents
    expect(takeRateService.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId, changeOrderId: coId, amountCents: 500000 }),
    );

    expect(changeOrderRepository.update).toHaveBeenCalledWith(
      workspaceId,
      coId,
      expect.objectContaining({
        stripePaymentIntentId: intentId,
        takeRatePct: "0.04",
        takeRateAmountCents: 20000,
      }),
      expect.anything(),
    );
  });

  it("includes paymentIntentId and takeRatePct in the audit_log on create (Code Rule 10)", async () => {
    vi.mocked(changeOrderRepository.create).mockResolvedValue(baseCO as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue(baseCO as never);
    vi.mocked(takeRateService.createPaymentIntent).mockResolvedValue({
      paymentIntentId: intentId,
      takeRatePct: 0.04,
      takeRateAmountCents: 20000,
    });

    await changeOrderService.create(workspaceId, userId, {
      projectId,
      title: "Extra Feature",
      amount: 5000,
    });

    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: expect.objectContaining({
          paymentIntentId: intentId,
          takeRatePct: 0.04,
          takeRateAmountCents: 20000,
        }),
      }),
    );
  });

  it("skips payment intent creation when amount is not set (draft without pricing)", async () => {
    const draftCO = { ...baseCO, pricing: null };
    vi.mocked(changeOrderRepository.create).mockResolvedValue(draftCO as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue(draftCO as never);

    await changeOrderService.create(workspaceId, userId, {
      projectId,
      title: "Draft Without Pricing",
      // no amount
    });

    expect(takeRateService.createPaymentIntent).not.toHaveBeenCalled();
    expect(changeOrderRepository.update).not.toHaveBeenCalled();
  });
});

// ── Tests: update → sent ─────────────────────────────────────────────────────

describe("changeOrderService.update — payment intent on status→sent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionImpl.run = (fn) => fn(trxMock);
    trxMock.limit.mockResolvedValue([{ stripeCustomerId: null }]);
    trxMock.select.mockReturnValue(trxMock);
    trxMock.from.mockReturnValue(trxMock);
    trxMock.where.mockReturnValue(trxMock);
  });

  it("creates a payment intent when transitioning to sent and no intent exists", async () => {
    vi.mocked(changeOrderRepository.getById).mockResolvedValue(baseCO as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue({
      ...baseCO,
      status: "sent",
    } as never);
    vi.mocked(takeRateService.createPaymentIntent).mockResolvedValue({
      paymentIntentId: intentId,
      takeRatePct: 0.04,
      takeRateAmountCents: 20000,
    });

    await changeOrderService.update(workspaceId, coId, userId, { status: "sent" });

    expect(takeRateService.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId, changeOrderId: coId }),
    );
  });

  it("does NOT create a payment intent when transitioning to sent but intent already exists", async () => {
    const coWithIntent = { ...baseCO, stripePaymentIntentId: "pi_existing_001" };
    vi.mocked(changeOrderRepository.getById).mockResolvedValue(coWithIntent as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue({
      ...coWithIntent,
      status: "sent",
    } as never);

    await changeOrderService.update(workspaceId, coId, userId, { status: "sent" });

    expect(takeRateService.createPaymentIntent).not.toHaveBeenCalled();
  });
});

// ── Tests: acceptWithFullTransaction ─────────────────────────────────────────

describe("changeOrderService.acceptWithFullTransaction — capture", () => {
  const coWithIntent = {
    ...baseCO,
    status: "sent" as const,
    stripePaymentIntentId: intentId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionImpl.run = (fn) => fn(trxMock);
    trxMock.limit.mockResolvedValue([{ stripeCustomerId: null }]);
    trxMock.select.mockReturnValue(trxMock);
    trxMock.from.mockReturnValue(trxMock);
    trxMock.where.mockReturnValue(trxMock);
    trxMock.insert.mockReturnValue(trxMock);
    trxMock.values.mockResolvedValue([]);
    trxMock.update.mockReturnValue(trxMock);
    trxMock.set.mockReturnValue(trxMock);
  });

  /**
   * Helper: stub db.select so the outer project query returns a result row.
   * acceptWithFullTransaction calls: db.select(...).from(...).where(...) — no .limit().
   * So the where() must resolve to the array itself.
   */
  function stubDbSelectForProject() {
    const projectRow = { id: projectId, sowId: null, name: "ACME Project" };
    const whereResult = Promise.resolve([projectRow]);
    // Attach then/catch so it behaves as a thenable and also supports .limit()
    const whereChain = Object.assign(whereResult, {
      limit: vi.fn().mockResolvedValue([projectRow]),
    });
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(whereChain),
      }),
    });
  }

  it("captures the payment intent inside the accept transaction", async () => {
    stubDbSelectForProject();
    vi.mocked(changeOrderRepository.getById).mockResolvedValue(coWithIntent as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue({
      ...coWithIntent,
      status: "accepted",
    } as never);
    vi.mocked(takeRateService.capturePaymentIntent).mockResolvedValue({
      id: intentId,
      status: "succeeded",
    } as never);

    await changeOrderService.acceptWithFullTransaction({
      changeOrderId: coId,
      workspaceId,
      projectId,
      signatureName: "Alice Buyer",
      signerIp: "1.2.3.4",
    });

    expect(takeRateService.capturePaymentIntent).toHaveBeenCalledWith(intentId);
  });

  it("records paymentCaptured=true and paymentIntentId in the audit_log on acceptance", async () => {
    stubDbSelectForProject();
    vi.mocked(changeOrderRepository.getById).mockResolvedValue(coWithIntent as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue({
      ...coWithIntent,
      status: "accepted",
    } as never);
    vi.mocked(takeRateService.capturePaymentIntent).mockResolvedValue({
      id: intentId,
      status: "succeeded",
    } as never);

    await changeOrderService.acceptWithFullTransaction({
      changeOrderId: coId,
      workspaceId,
      projectId,
      signatureName: "Alice Buyer",
      signerIp: "1.2.3.4",
    });

    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: expect.objectContaining({
          paymentCaptured: true,
          paymentIntentId: intentId,
        }),
      }),
    );
  });

  it("rolls back the entire transaction (throws) when capture fails", async () => {
    stubDbSelectForProject();
    vi.mocked(changeOrderRepository.getById).mockResolvedValue(coWithIntent as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue({
      ...coWithIntent,
      status: "accepted",
    } as never);
    vi.mocked(takeRateService.capturePaymentIntent).mockRejectedValue(
      new Error("Stripe capture failed"),
    );

    await expect(
      changeOrderService.acceptWithFullTransaction({
        changeOrderId: coId,
        workspaceId,
        projectId,
        signatureName: "Alice Buyer",
        signerIp: "1.2.3.4",
      }),
    ).rejects.toThrow("Stripe capture failed");
  });

  it("skips capture when no stripePaymentIntentId (historical CO)", async () => {
    stubDbSelectForProject();
    const historicalCO = { ...baseCO, status: "sent" as const, stripePaymentIntentId: null };
    vi.mocked(changeOrderRepository.getById).mockResolvedValue(historicalCO as never);
    vi.mocked(changeOrderRepository.update).mockResolvedValue({
      ...historicalCO,
      status: "accepted",
    } as never);

    await changeOrderService.acceptWithFullTransaction({
      changeOrderId: coId,
      workspaceId,
      projectId,
      signatureName: "Bob Buyer",
      signerIp: "5.6.7.8",
    });

    expect(takeRateService.capturePaymentIntent).not.toHaveBeenCalled();
  });
});
