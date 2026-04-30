import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (must be declared before imports that use them) ────────────

const { mockPaymentIntentsCreate, mockPaymentIntentsCapture, mockSelectResult, selectSpy } =
  vi.hoisted(() => {
    const mockPaymentIntentsCreate = vi.fn();
    const mockPaymentIntentsCapture = vi.fn();
    const mockSelectResult: { plan: string }[] = [];
    const selectSpy = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
    };
    return { mockPaymentIntentsCreate, mockPaymentIntentsCapture, mockSelectResult, selectSpy };
  });

vi.mock("../billing.service.js", () => ({
  stripe: {
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      capture: mockPaymentIntentsCapture,
    },
  },
}));

vi.mock("@novabots/db", () => ({
  db: {
    select: vi.fn(() => selectSpy),
  },
  workspaces: {},
  eq: vi.fn(),
}));

import { takeRateService } from "../take-rate.service.js";

// ── Fixtures ────────────────────────────────────────────────────────────────

const workspaceId = "ws-take-rate-001";
const changeOrderId = "co-take-rate-001";

// ── Tests ───────────────────────────────────────────────────────────────────

describe("takeRateService.getTakeRatePct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult.length = 0;
  });

  it("returns 0.04 for the free plan", async () => {
    mockSelectResult.push({ plan: "free" });
    const rate = await takeRateService.getTakeRatePct(workspaceId);
    expect(rate).toBe(0.04);
  });

  it("returns 0.04 for the legacy solo plan (treated as free)", async () => {
    mockSelectResult.push({ plan: "solo" });
    const rate = await takeRateService.getTakeRatePct(workspaceId);
    expect(rate).toBe(0.04);
  });

  it("returns 0.03 for the studio plan", async () => {
    mockSelectResult.push({ plan: "studio" });
    const rate = await takeRateService.getTakeRatePct(workspaceId);
    expect(rate).toBe(0.03);
  });

  it("returns 0.025 for the agency plan", async () => {
    mockSelectResult.push({ plan: "agency" });
    const rate = await takeRateService.getTakeRatePct(workspaceId);
    expect(rate).toBe(0.025);
  });

  it("returns 0.04 when workspace is not found (defensive default)", async () => {
    // mockSelectResult stays empty — simulates not found
    const rate = await takeRateService.getTakeRatePct(workspaceId);
    expect(rate).toBe(0.04);
  });
});

describe("takeRateService.createPaymentIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult.length = 0;
    // Default: free plan workspace
    mockSelectResult.push({ plan: "free" });
  });

  it("calls stripe.paymentIntents.create with capture_method manual", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_001" });

    await takeRateService.createPaymentIntent({
      workspaceId,
      changeOrderId,
      amountCents: 10000,
      currency: "usd",
    });

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ capture_method: "manual" }),
    );
  });

  it("computes take-rate amount = ceil(amountCents * pct) for free plan (4%)", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_002" });

    // 10000 cents * 0.04 = 400 cents exactly
    const result = await takeRateService.createPaymentIntent({
      workspaceId,
      changeOrderId,
      amountCents: 10000,
      currency: "usd",
    });

    expect(result.takeRateAmountCents).toBe(400);
    expect(result.takeRatePct).toBe(0.04);
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 400, currency: "usd" }),
    );
  });

  it("uses Math.ceil so partial cents round up in platform's favour", async () => {
    // studio plan (3%). 10001 cents * 0.03 = 300.03 → ceil = 301
    mockSelectResult.length = 0;
    mockSelectResult.push({ plan: "studio" });
    mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_003" });

    const result = await takeRateService.createPaymentIntent({
      workspaceId,
      changeOrderId,
      amountCents: 10001,
      currency: "usd",
    });

    expect(result.takeRateAmountCents).toBe(301);
    expect(result.takeRatePct).toBe(0.03);
  });

  it("passes 2.5% for agency plan", async () => {
    mockSelectResult.length = 0;
    mockSelectResult.push({ plan: "agency" });
    mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_004" });

    const result = await takeRateService.createPaymentIntent({
      workspaceId,
      changeOrderId,
      amountCents: 20000,
      currency: "usd",
    });

    expect(result.takeRatePct).toBe(0.025);
    expect(result.takeRateAmountCents).toBe(500); // 20000 * 0.025 = 500
  });

  it("includes workspaceId, changeOrderId, and takeRatePct in Stripe metadata", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_005" });

    await takeRateService.createPaymentIntent({
      workspaceId,
      changeOrderId,
      amountCents: 5000,
      currency: "usd",
    });

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          workspaceId,
          changeOrderId,
          takeRatePct: "0.04",
        }),
      }),
    );
  });

  it("attaches customer when customerId is provided", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_006" });

    await takeRateService.createPaymentIntent({
      workspaceId,
      changeOrderId,
      amountCents: 5000,
      currency: "usd",
      customerId: "cus_abc123",
    });

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_abc123" }),
    );
  });

  it("does not include customer key when customerId is null", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_007" });

    await takeRateService.createPaymentIntent({
      workspaceId,
      changeOrderId,
      amountCents: 5000,
      currency: "usd",
      customerId: null,
    });

    const callArgs = mockPaymentIntentsCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty("customer");
  });

  it("returns paymentIntentId, takeRatePct, and takeRateAmountCents", async () => {
    mockPaymentIntentsCreate.mockResolvedValue({ id: "pi_test_008" });

    const result = await takeRateService.createPaymentIntent({
      workspaceId,
      changeOrderId,
      amountCents: 10000,
      currency: "usd",
    });

    expect(result).toEqual({
      paymentIntentId: "pi_test_008",
      takeRatePct: 0.04,
      takeRateAmountCents: 400,
    });
  });
});

describe("takeRateService.capturePaymentIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls stripe.paymentIntents.capture with the provided intent ID", async () => {
    const mockIntent = { id: "pi_captured_001", status: "succeeded" };
    mockPaymentIntentsCapture.mockResolvedValue(mockIntent);

    const result = await takeRateService.capturePaymentIntent("pi_captured_001");

    expect(mockPaymentIntentsCapture).toHaveBeenCalledWith("pi_captured_001");
    expect(result).toBe(mockIntent);
  });

  it("propagates Stripe errors so the caller's transaction rolls back", async () => {
    mockPaymentIntentsCapture.mockRejectedValue(new Error("Stripe capture failed"));

    await expect(takeRateService.capturePaymentIntent("pi_bad")).rejects.toThrow(
      "Stripe capture failed",
    );
  });
});
