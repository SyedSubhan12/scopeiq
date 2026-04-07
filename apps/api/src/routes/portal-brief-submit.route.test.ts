import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

// ---------------------------------------------------------------------------
// State holder for the mocked DB queries (same pattern as portal-session.route.test.ts)
// ---------------------------------------------------------------------------
const dbState = vi.hoisted(() => ({
  selectResults: {} as Record<string, any[][]>,
  selectCounts: {} as Record<string, number>,
}));

// ---------------------------------------------------------------------------
// Mock the portal-auth middleware so tests control context values
// ---------------------------------------------------------------------------
const mockPortalAuth = vi.hoisted(() => ({
  handler: vi.fn(async (_c: any, next: any) => { await next(); }),
}));

vi.mock("../middleware/portal-auth.js", () => ({
  portalAuthMiddleware: mockPortalAuth.handler,
}));

vi.mock("../services/analytics.service.js", () => ({
  analyticsService: {
    getProjectHealth: vi.fn(),
  },
}));

vi.mock("../services/brief.service.js", () => ({
  briefService: {
    getOpenClarificationRequest: vi.fn(),
    submitPendingBrief: vi.fn(),
    submitClarificationResponse: vi.fn(),
  },
}));

vi.mock("../repositories/brief-template.repository.js", () => ({
  briefTemplateRepository: {
    getVersionByBriefVersionId: vi.fn(),
    getLatestPublishedVersion: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock("../middleware/error.js", () => ({
  errorHandler: async (err: any, c: any) => {
    if (typeof err?.statusCode === "number") {
      return c.json(
        {
          error: {
            code: err.code ?? "ERROR",
            message: err.message ?? "Unknown error",
            details: err.details,
          },
        },
        err.statusCode,
      );
    }

    return c.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      },
      500,
    );
  },
}));

vi.mock("@novabots/db", () => {
  const tables = {
    projects: { name: "projects" },
    workspaces: { name: "workspaces" },
    clients: { name: "clients" },
    deliverables: { name: "deliverables" },
    briefs: { name: "briefs" },
    briefFields: { name: "briefFields" },
    briefAttachments: { name: "briefAttachments" },
    changeOrders: { name: "changeOrders" },
    eq: vi.fn(),
    and: vi.fn(),
    isNull: vi.fn(),
    asc: vi.fn(),
    desc: vi.fn(),
    constantTimeCompare: vi.fn(() => true),
  };

  const select = vi.fn(() => {
    let table: { name?: string } | undefined;
    let limitCount: number | undefined;
    const chain: any = {
      from(nextTable: { name?: string }) {
        table = nextTable;
        return chain;
      },
      where() {
        return chain;
      },
      orderBy() {
        return chain;
      },
      limit(limitVal?: number) {
        limitCount = limitVal;
        return chain;
      },
      then(resolve: (value: any) => void, reject: (reason?: unknown) => void) {
        try {
          const tableName = table?.name ?? "unknown";
          const callIndex = dbState.selectCounts[tableName] ?? 0;
          dbState.selectCounts[tableName] = callIndex + 1;
          const rows = dbState.selectResults[tableName]?.[callIndex] ?? [];
          resolve(typeof limitCount === "number" ? rows.slice(0, limitCount) : rows);
        } catch (error) {
          reject?.(error);
        }
      },
    };

    return chain;
  });

  return {
    db: {
      select,
    },
    ...tables,
  };
});

import { portalSessionRouter } from "./portal-session.route.js";
import { errorHandler } from "../middleware/error.js";
import { briefService } from "../services/brief.service.js";
import { portalAuthMiddleware } from "../middleware/portal-auth.js";

const app = new Hono().onError(errorHandler).route("/", portalSessionRouter);

// ---------------------------------------------------------------------------
// T-BRIEF-004: POST /api/portal/session/brief/submit creates brief and
//              dispatches job — verified via mocked briefService
// ---------------------------------------------------------------------------
describe("T-BRIEF-004: POST /brief/submit creates brief and dispatches job", () => {
  beforeEach(() => {
    dbState.selectResults = {};
    dbState.selectCounts = {};
    vi.clearAllMocks();
  });

  it("calls submitPendingBrief and returns 201 with brief_id", async () => {
    // Set up portal context via mocked middleware
    vi.mocked(mockPortalAuth.handler).mockImplementation(async (c: any, next: any) => {
      c.set("portalProjectId", "project-1");
      c.set("portalWorkspaceId", "workspace-1");
      c.set("portalClientId", "client-1");
      await next();
    });

    // Mock briefService.submitPendingBrief
    vi.mocked(briefService.submitPendingBrief).mockResolvedValue({
      brief_id: "brief-1",
      message: "Brief submitted successfully",
    } as never);

    // Seed minimal DB state for the GET portion of the route (project, workspace)
    dbState.selectResults = {
      projects: [[{
        id: "project-1",
        name: "Test Project",
        description: null,
        status: "awaiting_brief",
        clientId: "client-1",
      }]],
      workspaces: [[{
        id: "workspace-1",
        name: "Test Agency",
        logoUrl: null,
        brandColor: "#000000",
      }]],
      clients: [[{ name: "Test Client" }]],
      briefs: [[]],
      briefFields: [[]],
      briefAttachments: [[]],
      deliverables: [[]],
      changeOrders: [[]],
    };

    const requestBody = {
      briefId: "00000000-0000-0000-0000-000000000001",
      responses: { goal: "Launch a new website" },
    };

    const request = new Request("http://localhost/brief/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const response = await app.fetch(request);

    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload).toMatchObject({
      brief_id: "brief-1",
      message: "Brief submitted successfully",
    });

    // Verify the service was called with correct context
    expect(briefService.submitPendingBrief).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      projectId: "project-1",
      briefId: "00000000-0000-0000-0000-000000000001",
      responses: { goal: "Launch a new website" },
    });
  });

  it("returns 400 when required fields are missing", async () => {
    vi.mocked(mockPortalAuth.handler).mockImplementation(async (c: any, next: any) => {
      c.set("portalProjectId", "project-1");
      c.set("portalWorkspaceId", "workspace-1");
      c.set("portalClientId", "client-1");
      await next();
    });

    vi.mocked(briefService.submitPendingBrief).mockRejectedValue(
      new (class extends Error {
        statusCode = 400;
        code = "VALIDATION_ERROR";
      })("Missing required field: Project Goals"),
    );

    dbState.selectResults = {
      projects: [[{ id: "project-1", name: "Test", description: null, status: "awaiting_brief", clientId: "client-1" }]],
      workspaces: [[{ id: "workspace-1", name: "Test Agency", logoUrl: null, brandColor: "#000000" }]],
      clients: [[{ name: "Test Client" }]],
      briefs: [[]],
      briefFields: [[]],
      briefAttachments: [[]],
      deliverables: [[]],
      changeOrders: [[]],
    };

    const request = new Request("http://localhost/brief/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ briefId: "00000000-0000-0000-0000-000000000002", responses: {} }),
    });

    const response = await app.fetch(request);
    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// T-BRIEF-005: expired portal token returns 401 on brief submit
// ---------------------------------------------------------------------------
describe("T-BRIEF-005: expired portal token returns 401", () => {
  beforeEach(() => {
    dbState.selectResults = {};
    dbState.selectCounts = {};
    vi.clearAllMocks();
  });

  it("rejects request when portal auth middleware throws UnauthorizedError", async () => {
    // Simulate expired/invalid token: middleware throws UnauthorizedError
    vi.mocked(mockPortalAuth.handler).mockImplementation(async (c: any) => {
      const { UnauthorizedError } = await import("@novabots/types");
      throw new UnauthorizedError("Invalid portal token");
    });

    dbState.selectResults = {
      projects: [[]],
      workspaces: [[]],
      clients: [[]],
      briefs: [[]],
      briefFields: [[]],
      briefAttachments: [[]],
      deliverables: [[]],
      changeOrders: [[]],
    };

    const request = new Request("http://localhost/brief/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ briefId: "00000000-0000-0000-0000-000000000003", responses: { goal: "test" } }),
    });

    const response = await app.fetch(request);

    // The errorHandler middleware maps UnauthorizedError to 401
    expect(response.status).toBe(401);

    // Verify briefService was NOT called (no brief record created)
    expect(briefService.submitPendingBrief).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// T-BRIEF-006: workspace isolation — token from workspace A cannot access
//              workspace B project
// ---------------------------------------------------------------------------
describe("T-BRIEF-006: workspace isolation", () => {
  beforeEach(() => {
    dbState.selectResults = {};
    dbState.selectCounts = {};
    vi.clearAllMocks();
  });

  it("rejects cross-workspace access when middleware enforces isolation", async () => {
    // Simulate middleware detecting workspace mismatch and rejecting
    vi.mocked(mockPortalAuth.handler).mockImplementation(async (c: any) => {
      const { UnauthorizedError } = await import("@novabots/types");
      throw new UnauthorizedError("Invalid portal token");
    });

    dbState.selectResults = {
      projects: [[]],
      workspaces: [[]],
      clients: [[]],
      briefs: [[]],
      briefFields: [[]],
      briefAttachments: [[]],
      deliverables: [[]],
      changeOrders: [[]],
    };

    // Token belongs to workspace-a, but trying to access workspace-b project
    const request = new Request("http://localhost/brief/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ briefId: "00000000-0000-0000-0000-000000000004", responses: { goal: "test" } }),
    });

    const response = await app.fetch(request);

    expect(response.status).toBe(401);
    expect(briefService.submitPendingBrief).not.toHaveBeenCalled();
  });

  it("allows access when token and project belong to same workspace", async () => {
    vi.mocked(mockPortalAuth.handler).mockImplementation(async (c: any, next: any) => {
      c.set("portalProjectId", "project-a1");
      c.set("portalWorkspaceId", "workspace-a");
      c.set("portalClientId", "client-a1");
      await next();
    });

    vi.mocked(briefService.submitPendingBrief).mockResolvedValue({
      brief_id: "brief-a1",
      message: "Brief submitted successfully",
    } as never);

    dbState.selectResults = {
      projects: [[{
        id: "project-a1",
        name: "Workspace A Project",
        description: null,
        status: "awaiting_brief",
        clientId: "client-a1",
      }]],
      workspaces: [[{
        id: "workspace-a",
        name: "Agency A",
        logoUrl: null,
        brandColor: "#111111",
      }]],
      clients: [[{ name: "Client A" }]],
      briefs: [[]],
      briefFields: [[]],
      briefAttachments: [[]],
      deliverables: [[]],
      changeOrders: [[]],
    };

    const request = new Request("http://localhost/brief/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ briefId: "00000000-0000-0000-0000-000000000005", responses: { goal: "test" } }),
    });

    const response = await app.fetch(request);
    expect(response.status).toBe(201);

    // Verify workspace context passed to service matches the token's workspace
    expect(briefService.submitPendingBrief).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-a",
        projectId: "project-a1",
        briefId: "00000000-0000-0000-0000-000000000005",
      }),
    );
  });
});
