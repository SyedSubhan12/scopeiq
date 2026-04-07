import { beforeEach, describe, expect, it, vi } from "vitest";
import { briefTemplateService } from "./brief-template.service.js";
import { briefTemplateRepository } from "../repositories/brief-template.repository.js";
import { writeAuditLog } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";

vi.mock("../repositories/brief-template.repository.js", () => ({
  briefTemplateRepository: {
    list: vi.fn(),
    getById: vi.fn(),
    clearDefault: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listVersions: vi.fn(),
    getVersionById: vi.fn(),
    getLatestVersion: vi.fn(),
    createVersion: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock("@novabots/db", () => ({
  db: {},
  writeAuditLog: vi.fn(),
}));

describe("briefTemplateService", () => {
  const workspaceId = "ws-1";
  const actorId = "user-1";
  const templateId = "tpl-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates draft templates and clears the default flag when requested", async () => {
    vi.mocked(briefTemplateRepository.create).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Template",
      description: null,
      fieldsJson: [],
      isDefault: true,
      status: "draft",
    } as never);

    const result = await briefTemplateService.createTemplate(workspaceId, actorId, {
      name: "Template",
      isDefault: true,
    });

    expect(briefTemplateRepository.clearDefault).toHaveBeenCalledWith(workspaceId);
    expect(briefTemplateRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId,
      name: "Template",
      isDefault: true,
      status: "draft",
    }));
    expect(writeAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      workspaceId,
      actorId,
      entityType: "brief_template",
      entityId: templateId,
      action: "create",
    }));
    expect(result.id).toBe(templateId);
  });

  it("persists template branding overrides on create and publish snapshots", async () => {
    vi.mocked(briefTemplateRepository.create).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Template",
      description: null,
      fieldsJson: [],
      brandingJson: {
        accentColor: "#123456",
        introMessage: "Tell us what success looks like.",
      },
      isDefault: false,
      status: "draft",
    } as never);

    await briefTemplateService.createTemplate(workspaceId, actorId, {
      name: "Template",
      brandingJson: {
        accentColor: "#123456",
        introMessage: "Tell us what success looks like.",
      },
    });

    expect(briefTemplateRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        brandingJson: {
          accentColor: "#123456",
          introMessage: "Tell us what success looks like.",
        },
      }),
    );

    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Template",
      description: "Description",
      fieldsJson: [{ key: "goal", label: "Goal", type: "text", required: true, order: 0 }],
      brandingJson: {
        accentColor: "#123456",
        introMessage: "Tell us what success looks like.",
      },
      isDefault: false,
      status: "draft",
    } as never);
    vi.mocked(briefTemplateRepository.getLatestVersion).mockResolvedValue(null as never);
    vi.mocked(briefTemplateRepository.createVersion).mockResolvedValue({
      id: "ver-1",
      versionNumber: 1,
    } as never);
    vi.mocked(briefTemplateRepository.update).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Template",
      description: "Description",
      fieldsJson: [{ key: "goal", label: "Goal", type: "text", required: true, order: 0 }],
      brandingJson: {
        accentColor: "#123456",
        introMessage: "Tell us what success looks like.",
      },
      isDefault: false,
      status: "published",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    } as never);

    await briefTemplateService.publishTemplate(workspaceId, templateId, actorId);

    expect(briefTemplateRepository.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        brandingJson: {
          accentColor: "#123456",
          introMessage: "Tell us what success looks like.",
        },
      }),
    );
  });

  it("updates template default state and clears other defaults", async () => {
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Template",
      description: null,
      fieldsJson: [],
      isDefault: false,
      status: "draft",
    } as never);
    vi.mocked(briefTemplateRepository.update).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Updated",
      description: null,
      fieldsJson: [],
      isDefault: true,
      status: "draft",
    } as never);

    await briefTemplateService.updateTemplate(workspaceId, templateId, actorId, {
      name: "Updated",
      isDefault: true,
    });

    expect(briefTemplateRepository.clearDefault).toHaveBeenCalledWith(workspaceId, templateId);
    expect(briefTemplateRepository.update).toHaveBeenCalledWith(
      workspaceId,
      templateId,
      expect.objectContaining({
        name: "Updated",
        isDefault: true,
      }),
    );
    expect(writeAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "update",
      entityId: templateId,
      metadata: expect.objectContaining({
        fields: ["name", "isDefault"],
      }),
    }));
  });

  it("rejects publish when the template has no fields", async () => {
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Empty",
      description: null,
      fieldsJson: [],
      isDefault: false,
      status: "draft",
    } as never);

    await expect(
      briefTemplateService.publishTemplate(workspaceId, templateId, actorId),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects publish when the template has been archived", async () => {
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Archived",
      description: null,
      fieldsJson: [{ key: "goal", label: "Goal", type: "text", required: true, order: 0 }],
      isDefault: false,
      status: "archived",
    } as never);

    await expect(
      briefTemplateService.publishTemplate(workspaceId, templateId, actorId),
    ).rejects.toThrow(ValidationError);

    expect(briefTemplateRepository.getLatestVersion).not.toHaveBeenCalled();
    expect(briefTemplateRepository.createVersion).not.toHaveBeenCalled();
  });

  it("publishes immutable versions and marks the template published", async () => {
    const publishedAt = new Date("2026-01-01T00:00:00.000Z");
    const template = {
      id: templateId,
      workspaceId,
      name: "Template",
      description: "Description",
      fieldsJson: [
        { key: "goal", label: "Goal", type: "text", required: true, order: 0 },
      ],
      isDefault: false,
      status: "draft",
    };

    vi.mocked(briefTemplateRepository.getById).mockResolvedValue(template as never);
    vi.mocked(briefTemplateRepository.getLatestVersion).mockResolvedValue({
      versionNumber: 2,
    } as never);
    vi.mocked(briefTemplateRepository.createVersion).mockResolvedValue({
      id: "ver-3",
      versionNumber: 3,
    } as never);
    vi.mocked(briefTemplateRepository.update).mockResolvedValue({
      ...template,
      status: "published",
      publishedAt,
    } as never);

    const result = await briefTemplateService.publishTemplate(workspaceId, templateId, actorId);

    expect(briefTemplateRepository.createVersion).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId,
      templateId,
      versionNumber: 3,
      name: "Template",
      description: "Description",
      isDefault: false,
      templateStatus: "published",
      publishedBy: actorId,
    }));
    expect(briefTemplateRepository.update).toHaveBeenCalledWith(workspaceId, templateId, {
      status: "published",
      publishedAt: expect.any(Date),
    });
    expect(result.version.id).toBe("ver-3");
    expect(writeAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "update",
      metadata: expect.objectContaining({
        lifecycle: "published",
        versionId: "ver-3",
        versionNumber: 3,
      }),
    }));
  });

  it("restores a published version into the draft template", async () => {
    const versionId = "ver-1";
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Template",
      description: "Current",
      fieldsJson: [],
      isDefault: false,
      status: "published",
    } as never);
    vi.mocked(briefTemplateRepository.getVersionById).mockResolvedValue({
      id: versionId,
      workspaceId,
      templateId,
      versionNumber: 1,
      name: "Restored template",
      description: "Restored description",
      fieldsJson: [{ key: "goal", label: "Goal", type: "text", required: true, order: 0 }],
      isDefault: true,
      templateStatus: "published",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    } as never);
    vi.mocked(briefTemplateRepository.update).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Restored template",
      description: "Restored description",
      fieldsJson: [],
      isDefault: true,
      status: "draft",
    } as never);

    await briefTemplateService.restoreTemplateVersion(workspaceId, templateId, versionId, actorId);

    expect(briefTemplateRepository.clearDefault).toHaveBeenCalledWith(workspaceId, templateId);
    expect(briefTemplateRepository.update).toHaveBeenCalledWith(
      workspaceId,
      templateId,
      expect.objectContaining({
        name: "Restored template",
        description: "Restored description",
        isDefault: true,
        status: "draft",
      }),
    );
    expect(writeAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "update",
      metadata: expect.objectContaining({
        lifecycle: "restored_version",
        versionId,
        versionNumber: 1,
      }),
    }));
  });

  it("archives templates by soft deleting and recording lifecycle metadata", async () => {
    vi.mocked(briefTemplateRepository.softDelete).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Template",
      description: null,
      fieldsJson: [],
      isDefault: false,
      status: "archived",
    } as never);

    const result = await briefTemplateService.deleteTemplate(workspaceId, templateId, actorId);

    expect(briefTemplateRepository.softDelete).toHaveBeenCalledWith(workspaceId, templateId);
    expect(result.status).toBe("archived");
    expect(writeAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "update",
      metadata: expect.objectContaining({
        lifecycle: "archived",
      }),
    }));
  });

  it("throws NotFoundError when restoring a missing version", async () => {
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Template",
      description: null,
      fieldsJson: [],
      isDefault: false,
      status: "draft",
    } as never);
    vi.mocked(briefTemplateRepository.getVersionById).mockResolvedValue(null);

    await expect(
      briefTemplateService.restoreTemplateVersion(workspaceId, templateId, "missing", actorId),
    ).rejects.toThrow(NotFoundError);
  });
});
