import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

const portalSessionState = vi.hoisted(() => ({
  selectResults: {} as Record<string, any[][]>,
  selectCounts: {} as Record<string, number>,
}));

vi.mock("../middleware/portal-auth.js", () => ({
  portalAuthMiddleware: async (c: any, next: any) => {
    c.set("portalProjectId", "project-1");
    c.set("portalWorkspaceId", "workspace-1");
    c.set("portalClientId", "client-1");
    await next();
  },
}));

vi.mock("../services/analytics.service.js", () => ({
  analyticsService: {
    getProjectHealth: vi.fn(),
  },
}));

vi.mock("../services/brief.service.js", () => ({
  briefService: {
    getOpenClarificationRequest: vi.fn(),
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
      limit(limitCount?: number) {
        limitCount = limitCount;
        return chain;
      },
      then(resolve: (value: any) => void, reject: (reason?: unknown) => void) {
        try {
          const tableName = table?.name ?? "unknown";
          const callIndex = portalSessionState.selectCounts[tableName] ?? 0;
          portalSessionState.selectCounts[tableName] = callIndex + 1;
          const rows = portalSessionState.selectResults[tableName]?.[callIndex] ?? [];
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
import { analyticsService } from "../services/analytics.service.js";
import { briefService } from "../services/brief.service.js";
import { briefTemplateRepository } from "../repositories/brief-template.repository.js";

const app = new Hono().onError(errorHandler).route("/", portalSessionRouter);

describe("portalSessionRouter", () => {
  beforeEach(() => {
    portalSessionState.selectResults = {};
    portalSessionState.selectCounts = {};
    vi.clearAllMocks();
  });

  it("returns pinned template version fields and workspace branding for portal sessions", async () => {
    portalSessionState.selectResults = {
      projects: [[{
        id: "project-1",
        name: "Website refresh",
        description: "Launch revamp",
        status: "active",
        clientId: "client-1",
      }]],
      workspaces: [[{
        id: "workspace-1",
        name: "Acme Studio",
        logoUrl: "https://cdn.example.com/logo.svg",
        brandColor: "#123456",
      }]],
      clients: [[{
        name: "Acme Client",
      }]],
      briefs: [[{
        id: "brief-1",
        projectId: "project-1",
        workspaceId: "workspace-1",
        templateId: "template-1",
        templateVersionId: "template-version-2",
        status: "pending_score",
        submittedAt: null,
        deletedAt: null,
        updatedAt: new Date("2026-04-01T10:00:00.000Z"),
      }]],
      briefFields: [[
        {
          id: "field-1",
          briefId: "brief-1",
          fieldKey: "goal",
          fieldLabel: "Goal",
          fieldType: "text",
          value: "Pinned response",
          sortOrder: 0,
        },
      ]],
      briefAttachments: [[{
        id: "attachment-1",
        briefId: "brief-1",
        fieldKey: "goal",
        originalName: "brief.pdf",
        fileUrl: "https://cdn.example.com/brief.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1234,
      }]],
      deliverables: [[]],
      changeOrders: [[]],
    };

    vi.mocked(analyticsService.getProjectHealth).mockResolvedValue({
      score: 92,
      status: "healthy",
    } as never);
    vi.mocked(briefTemplateRepository.getVersionByBriefVersionId).mockResolvedValue({
      id: "template-version-2",
      workspaceId: "workspace-1",
      templateId: "template-1",
      versionNumber: 2,
      name: "Pinned intake",
      description: "Pinned version",
      fieldsJson: [
        {
          key: "goal",
          label: "Pinned goal",
          type: "text",
          required: true,
          order: 0,
        },
      ],
      templateStatus: "published",
      brandingJson: {
        accentColor: "#654321",
        introMessage: "Use this versioned brief copy.",
        successMessage: "Pinned success copy",
        supportEmail: "briefs@example.com",
      },
      publishedAt: new Date("2026-03-31T00:00:00.000Z"),
    } as never);

    const response = await app.fetch(new Request("http://localhost/"));
    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(briefTemplateRepository.getVersionByBriefVersionId).toHaveBeenCalledWith(
      "workspace-1",
      "template-version-2",
    );
    expect(briefTemplateRepository.getLatestPublishedVersion).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      data: {
        project: {
          id: "project-1",
          name: "Website refresh",
          clientName: "Acme Client",
        },
        workspace: {
          id: "workspace-1",
          name: "Acme Studio",
          brandColor: "#123456",
        },
        pendingBrief: {
          id: "brief-1",
          branding: {
            accentColor: "#654321",
            introMessage: "Use this versioned brief copy.",
            successMessage: "Pinned success copy",
            supportEmail: "briefs@example.com",
            source: "template_override",
          },
          fields: [
            {
              key: "goal",
              label: "Pinned goal",
              required: true,
              value: "Pinned response",
            },
          ],
        },
        clarificationBrief: null,
      },
    });
    expect(payload.data.pendingBrief.fields[0].attachments).toHaveLength(1);
    expect(analyticsService.getProjectHealth).toHaveBeenCalledWith("workspace-1", "project-1");
    expect(briefService.getOpenClarificationRequest).not.toHaveBeenCalled();
  });
});
