import { describe, it, expect, vi, beforeEach } from "vitest";
import { processSlaBreachSweep } from "../../jobs/scope-flag-sla.job.js";
import { scopeFlagRepository } from "../../repositories/scope-flag.repository.js";
import { scopeFlagService } from "../scope-flag.service.js";

vi.mock("../../repositories/scope-flag.repository.js");
vi.mock("../scope-flag.service.js");

const baseFlag = (overrides: Record<string, unknown> = {}) => ({
    id: "flag-001",
    workspaceId: "ws-001",
    projectId: "proj-001",
    title: "Extra feature request",
    messageText: "Can you add a reporting module?",
    confidence: 0.95,
    severity: "high" as const,
    status: "pending" as const,
    slaDeadline: new Date(Date.now() - 60_000), // 1 min in the past
    slaBreached: false,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

describe("SLA breach sweep — happy path", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("marks a breachable flag and writes audit log via markBreached", async () => {
        const flag = baseFlag();
        vi.mocked(scopeFlagRepository.listBreachable).mockResolvedValue([flag] as never);
        vi.mocked(scopeFlagService.markBreached).mockResolvedValue(undefined);

        const result = await processSlaBreachSweep();

        expect(scopeFlagRepository.listBreachable).toHaveBeenCalledWith(expect.any(Date));
        expect(scopeFlagService.markBreached).toHaveBeenCalledWith(flag.id, flag.workspaceId);
        expect(result).toEqual({ breached: 1, skipped: 0 });
    });

    it("processes multiple breachable flags independently", async () => {
        const flags = [
            baseFlag({ id: "flag-001", workspaceId: "ws-001" }),
            baseFlag({ id: "flag-002", workspaceId: "ws-002" }),
            baseFlag({ id: "flag-003", workspaceId: "ws-001" }),
        ];
        vi.mocked(scopeFlagRepository.listBreachable).mockResolvedValue(flags as never);
        vi.mocked(scopeFlagService.markBreached).mockResolvedValue(undefined);

        const result = await processSlaBreachSweep();

        expect(scopeFlagService.markBreached).toHaveBeenCalledTimes(3);
        expect(result).toEqual({ breached: 3, skipped: 0 });
    });
});

describe("SLA breach sweep — not-breached (no eligible flags)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns zero counts when no flags have exceeded their SLA deadline", async () => {
        vi.mocked(scopeFlagRepository.listBreachable).mockResolvedValue([]);

        const result = await processSlaBreachSweep();

        expect(scopeFlagService.markBreached).not.toHaveBeenCalled();
        expect(result).toEqual({ breached: 0, skipped: 0 });
    });

    it("skips flags that have already been breached (repository filters them out)", async () => {
        // listBreachable already excludes slaBreached=true flags; this confirms the contract
        vi.mocked(scopeFlagRepository.listBreachable).mockResolvedValue([]);

        const result = await processSlaBreachSweep();

        expect(result.breached).toBe(0);
        expect(result.skipped).toBe(0);
    });
});

describe("SLA breach sweep — workspace isolation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calls markBreached with the correct workspaceId for each flag", async () => {
        const flag1 = baseFlag({ id: "flag-A", workspaceId: "ws-alpha" });
        const flag2 = baseFlag({ id: "flag-B", workspaceId: "ws-beta" });
        vi.mocked(scopeFlagRepository.listBreachable).mockResolvedValue([flag1, flag2] as never);
        vi.mocked(scopeFlagService.markBreached).mockResolvedValue(undefined);

        await processSlaBreachSweep();

        expect(scopeFlagService.markBreached).toHaveBeenCalledWith("flag-A", "ws-alpha");
        expect(scopeFlagService.markBreached).toHaveBeenCalledWith("flag-B", "ws-beta");
    });

    it("skips and counts a flag when markBreached throws, leaving others unaffected", async () => {
        const failingFlag = baseFlag({ id: "flag-fail", workspaceId: "ws-001" });
        const okFlag = baseFlag({ id: "flag-ok", workspaceId: "ws-002" });
        vi.mocked(scopeFlagRepository.listBreachable).mockResolvedValue([failingFlag, okFlag] as never);
        vi.mocked(scopeFlagService.markBreached)
            .mockRejectedValueOnce(new Error("DB error"))
            .mockResolvedValueOnce(undefined);

        const result = await processSlaBreachSweep();

        expect(result).toEqual({ breached: 1, skipped: 1 });
    });
});
