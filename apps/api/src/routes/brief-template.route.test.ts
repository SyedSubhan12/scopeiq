import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/auth.js", () => ({
  authMiddleware: async (c: any, next: any) => {
    c.set("workspaceId", "workspace-1");
    c.set("userId", "user-1");
    c.set("userRole", "owner");
    await next();
  },
}));

vi.mock("../services/brief-template.service.js", () => ({
  briefTemplateService: {
    listTemplates: vi.fn(),
    getTemplate: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    listTemplateVersions: vi.fn(),
    publishTemplate: vi.fn(),
    restoreTemplateVersion: vi.fn(),
    deleteTemplate: vi.fn(),
  },
}));

import { briefTemplateRouter } from "./brief-template.route.js";
import { briefTemplateService } from "../services/brief-template.service.js";

describe("briefTemplateRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns immutable template versions from the versions route", async () => {
    vi.mocked(briefTemplateService.listTemplateVersions).mockResolvedValue([
      {
        id: "version-2",
        workspaceId: "workspace-1",
        templateId: "template-1",
        versionNumber: 2,
        name: "Pinned intake",
        description: "Published snapshot",
        fieldsJson: [
          {
            key: "goal",
            label: "Goal",
            type: "text",
            required: true,
            order: 0,
          },
        ],
        templateStatus: "published",
        publishedAt: new Date("2026-03-31T00:00:00.000Z"),
      },
    ] as never);

    const response = await briefTemplateRouter.fetch(new Request("http://localhost/template-1/versions"));
    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(briefTemplateService.listTemplateVersions).toHaveBeenCalledWith(
      "workspace-1",
      "template-1",
    );
    expect(payload).toMatchObject({
      data: [
        {
          id: "version-2",
          versionNumber: 2,
          templateStatus: "published",
          name: "Pinned intake",
        },
      ],
    });
  });

  it("publishes templates through the route and returns the published version snapshot", async () => {
    vi.mocked(briefTemplateService.publishTemplate).mockResolvedValue({
      template: {
        id: "template-1",
        workspaceId: "workspace-1",
        name: "Updated intake",
        description: "Updated description",
        fieldsJson: [],
        isDefault: false,
        status: "published",
      },
      version: {
        id: "version-3",
        workspaceId: "workspace-1",
        templateId: "template-1",
        versionNumber: 3,
        name: "Updated intake",
        description: "Updated description",
        fieldsJson: [
          {
            key: "goal",
            label: "Goal",
            type: "text",
            required: true,
            order: 0,
          },
        ],
        isDefault: false,
        templateStatus: "published",
        publishedBy: "user-1",
        publishedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    } as never);

    const response = await briefTemplateRouter.fetch(
      new Request("http://localhost/template-1/publish", { method: "POST" }),
    );
    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(briefTemplateService.publishTemplate).toHaveBeenCalledWith(
      "workspace-1",
      "template-1",
      "user-1",
    );
    expect(payload).toMatchObject({
      data: {
        template: {
          id: "template-1",
          status: "published",
        },
        version: {
          id: "version-3",
          versionNumber: 3,
          templateStatus: "published",
        },
      },
    });
  });

  it("restores a published template version through the route", async () => {
    vi.mocked(briefTemplateService.restoreTemplateVersion).mockResolvedValue({
      id: "template-1",
      workspaceId: "workspace-1",
      name: "Restored intake",
      description: "Restored snapshot",
      fieldsJson: [
        {
          key: "goal",
          label: "Goal",
          type: "text",
          required: true,
          order: 0,
        },
      ],
      isDefault: false,
      status: "draft",
    } as never);

    const response = await briefTemplateRouter.fetch(
      new Request("http://localhost/template-1/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ versionId: "11111111-1111-4111-8111-111111111111" }),
      }),
    );
    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(briefTemplateService.restoreTemplateVersion).toHaveBeenCalledWith(
      "workspace-1",
      "template-1",
      "11111111-1111-4111-8111-111111111111",
      "user-1",
    );
    expect(payload).toMatchObject({
      data: {
        id: "template-1",
        name: "Restored intake",
        status: "draft",
      },
    });
  });
});
