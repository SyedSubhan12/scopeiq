import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../billing.service.js", () => ({
  billingService: {
    getMonthlyRecurringRevenue: vi.fn(),
  },
}));

vi.mock("@novabots/db", () => ({
  db: {
    select: vi.fn(),
  },
  projects: { workspaceId: "projects.workspaceId", status: "projects.status", deletedAt: "projects.deletedAt", id: "projects.id", name: "projects.name", endDate: "projects.endDate", clientId: "projects.clientId" },
  deliverables: { workspaceId: "deliverables.workspaceId", status: "deliverables.status", deletedAt: "deliverables.deletedAt" },
  scopeFlags: { workspaceId: "scopeFlags.workspaceId", status: "scopeFlags.status", severity: "scopeFlags.severity", createdAt: "scopeFlags.createdAt", id: "scopeFlags.id", projectId: "scopeFlags.projectId", title: "scopeFlags.title", description: "scopeFlags.description" },
  auditLog: { workspaceId: "audit.workspaceId", createdAt: "audit.createdAt", id: "audit.id", action: "audit.action", entityType: "audit.entityType", entityId: "audit.entityId", actorId: "audit.actorId", metadataJson: "audit.metadata" },
  users: { id: "users.id", fullName: "users.fullName" },
  clients: { id: "clients.id", name: "clients.name" },
  eq: vi.fn((...args) => ({ type: "eq", args })),
  and: vi.fn((...args) => ({ type: "and", args })),
  isNull: vi.fn((arg) => ({ type: "isNull", arg })),
  desc: vi.fn((arg) => ({ type: "desc", arg })),
  count: vi.fn(() => "count"),
  sql: vi.fn((strings: TemplateStringsArray) => strings.join("?")),
  inArray: vi.fn((...args) => ({ type: "inArray", args })),
}));

import { dashboardService } from "../dashboard.service.js";
import { billingService } from "../billing.service.js";
import { db } from "@novabots/db";

function makeLimitChain<T>(result: T) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

function makeWhereChain<T>(result: T) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(result),
  };
}

function makeOrderChain<T>(result: T) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(result),
  };
}

describe("DashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds live overview metrics and sources MRR from Stripe billing data", async () => {
    vi.mocked(billingService.getMonthlyRecurringRevenue).mockResolvedValue(129);
    vi.mocked(db.select)
      .mockReturnValueOnce(makeLimitChain([{ fullName: "Avery" }]) as never)
      .mockReturnValueOnce(makeWhereChain([{ count: 3 }]) as never)
      .mockReturnValueOnce(makeWhereChain([{ count: 5 }]) as never)
      .mockReturnValueOnce(makeWhereChain([{ count: 2 }]) as never)
      .mockReturnValueOnce(makeLimitChain([]) as never)
      .mockReturnValueOnce(makeLimitChain([]) as never)
      .mockReturnValueOnce(makeOrderChain([]) as never);

    const result = await dashboardService.getDashboardOverview("ws-123", "user-123");

    expect(result.metrics).toEqual({
      activeProjects: 3,
      awaitingApproval: 5,
      pendingScopeFlags: 2,
      mrr: 129,
    });
    expect(result.urgentFlags).toEqual([]);
    expect(result.recentActivity).toEqual([]);
    expect(result.upcomingDeadlines).toEqual([]);
    expect(result.greeting).toContain("Avery");
    expect(billingService.getMonthlyRecurringRevenue).toHaveBeenCalledWith("ws-123");
  });
});
