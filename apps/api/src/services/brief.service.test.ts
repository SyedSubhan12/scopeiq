import { beforeEach, describe, expect, it, vi } from "vitest";
import { briefService } from "./brief.service.js";
import { briefRepository } from "../repositories/brief.repository.js";
import { briefTemplateRepository } from "../repositories/brief-template.repository.js";
import { briefAttachmentRepository } from "../repositories/brief-attachment.repository.js";
import { briefClarificationRepository } from "../repositories/brief-clarification.repository.js";
import { dispatchScoreBriefJob } from "../jobs/score-brief.job.js";
import { writeAuditLog } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";

vi.mock("../repositories/brief.repository.js", () => ({
  briefRepository: {
    list: vi.fn(),
    getById: vi.fn(),
    getPendingById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    createFields: vi.fn(),
    updateFieldValue: vi.fn(),
    getFieldsByBriefId: vi.fn(),
    listVersions: vi.fn(),
    getLatestVersion: vi.fn(),
    getNextVersionNumber: vi.fn(),
    createVersion: vi.fn(),
    updateVersion: vi.fn(),
  },
}));

vi.mock("../repositories/brief-template.repository.js", () => ({
  briefTemplateRepository: {
    list: vi.fn(),
    getById: vi.fn(),
    clearDefault: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listVersions: vi.fn(),
    getVersionById: vi.fn(),
    getVersionByBriefVersionId: vi.fn(),
    getLatestVersion: vi.fn(),
    getLatestPublishedVersion: vi.fn(),
    createVersion: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock("../repositories/brief-attachment.repository.js", () => ({
  briefAttachmentRepository: {
    listByBriefId: vi.fn(),
    listByBriefAndField: vi.fn(),
  },
}));

vi.mock("../repositories/brief-clarification.repository.js", () => ({
  briefClarificationRepository: {
    getOpenForBrief: vi.fn(),
  },
}));

vi.mock("../repositories/user.repository.js", () => ({
  userRepository: {
    getById: vi.fn(),
  },
}));

vi.mock("../jobs/score-brief.job.js", () => ({
  dispatchScoreBriefJob: vi.fn(),
}));

vi.mock("../lib/storage.js", () => ({
  getDownloadUrl: vi.fn(),
  getUploadUrl: vi.fn(),
}));

vi.mock("@novabots/db", () => ({
  db: {},
  writeAuditLog: vi.fn(),
}));

describe("briefService", () => {
  const workspaceId = "ws-1";
  const projectId = "project-1";
  const templateId = "template-1";
  const actorId = "user-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pins created briefs to the latest published template version", async () => {
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Client intake",
      description: "Capture the project brief",
      fieldsJson: [
        { key: "goal", label: "Goal", type: "text", required: true, order: 0 },
      ],
      isDefault: false,
      status: "published",
    } as never);
    vi.mocked(briefTemplateRepository.getLatestPublishedVersion).mockResolvedValue({
      id: "version-1",
      workspaceId,
      templateId,
      versionNumber: 3,
      name: "Client intake",
      description: "Capture the project brief",
      fieldsJson: [
        { key: "goal", label: "Goal", type: "text", required: true, order: 0 },
      ],
      isDefault: false,
      templateStatus: "published",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    } as never);
    vi.mocked(briefRepository.create).mockResolvedValue({
      id: "brief-1",
      workspaceId,
      projectId,
      templateId,
      templateVersionId: "version-1",
      title: "Client intake",
      status: "pending_score",
      submittedBy: actorId,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(briefRepository.getFieldsByBriefId).mockResolvedValue([
      {
        id: "field-1",
        briefId: "brief-1",
        fieldKey: "goal",
        fieldLabel: "Goal",
        fieldType: "text",
        value: "Launch a new site",
        sortOrder: 0,
      },
    ] as never);
    vi.mocked(briefRepository.getNextVersionNumber).mockResolvedValue(1);
    vi.mocked(briefRepository.createVersion).mockResolvedValue({
      id: "brief-version-1",
    } as never);

    await briefService.submitBrief({
      workspaceId,
      projectId,
      templateId,
      responses: { goal: "Launch a new site" },
      submittedBy: actorId,
    });

    expect(briefRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId,
      projectId,
      templateId,
      templateVersionId: "version-1",
      title: "Client intake",
      submittedBy: actorId,
    }));
    expect(briefRepository.createFields).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        briefId: "brief-1",
        fieldKey: "goal",
        fieldLabel: "Goal",
      }),
    ]));
    expect(dispatchScoreBriefJob).toHaveBeenCalledWith("brief-1");
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it("rejects brief creation when no published template version exists", async () => {
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Client intake",
      description: null,
      fieldsJson: [],
      isDefault: false,
      status: "draft",
    } as never);
    vi.mocked(briefTemplateRepository.getLatestPublishedVersion).mockResolvedValue(null);

    await expect(
      briefService.submitBrief({
        workspaceId,
        projectId,
        templateId,
        responses: {},
      }),
    ).rejects.toThrow(ValidationError);

    expect(briefRepository.create).not.toHaveBeenCalled();
    expect(dispatchScoreBriefJob).not.toHaveBeenCalled();
  });

  it("rejects brief creation from archived templates", async () => {
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Archived intake",
      description: null,
      fieldsJson: [
        { key: "goal", label: "Goal", type: "text", required: true, order: 0 },
      ],
      isDefault: false,
      status: "archived",
    } as never);

    await expect(
      briefService.submitBrief({
        workspaceId,
        projectId,
        templateId,
        responses: { goal: "Launch a new site" },
      }),
    ).rejects.toThrow(ValidationError);

    expect(briefTemplateRepository.getLatestPublishedVersion).not.toHaveBeenCalled();
    expect(briefRepository.create).not.toHaveBeenCalled();
    expect(dispatchScoreBriefJob).not.toHaveBeenCalled();
  });

  it("uses the pinned template version when saving a brief draft even if the live template changes", async () => {
    vi.mocked(briefRepository.getPendingById).mockResolvedValue({
      id: "brief-1",
      workspaceId,
      projectId,
      templateId,
      templateVersionId: "version-1",
      reviewerId: null,
      title: "Client intake",
      status: "pending_score",
      scopeScore: null,
      scoringResultJson: null,
      submittedBy: actorId,
      submittedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    } as never);
    vi.mocked(briefRepository.getFieldsByBriefId).mockResolvedValue([] as never);
    vi.mocked(briefRepository.update).mockResolvedValue({
      id: "brief-1",
      workspaceId,
      projectId,
      templateId,
      templateVersionId: "version-1",
      reviewerId: null,
      title: "Client intake",
      status: "pending_score",
      scopeScore: null,
      scoringResultJson: null,
      submittedBy: actorId,
      submittedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    } as never);
    vi.mocked(briefAttachmentRepository.listByBriefId).mockResolvedValue([] as never);
    vi.mocked(briefAttachmentRepository.listByBriefAndField).mockResolvedValue([] as never);
    vi.mocked(briefTemplateRepository.getVersionByBriefVersionId).mockResolvedValue({
      id: "version-1",
      workspaceId,
      templateId,
      versionNumber: 2,
      name: "Pinned intake",
      description: "Pinned published snapshot",
      fieldsJson: [
        { key: "goal", label: "Pinned goal label", type: "text", required: true, order: 0 },
      ],
      isDefault: false,
      templateStatus: "published",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    } as never);
    vi.mocked(briefTemplateRepository.getById).mockResolvedValue({
      id: templateId,
      workspaceId,
      name: "Live intake",
      description: "Mutated after publish",
      fieldsJson: [
        { key: "goal", label: "Live goal label", type: "text", required: true, order: 0 },
        { key: "scope", label: "Scope", type: "text", required: false, order: 1 },
      ],
      isDefault: false,
      status: "published",
    } as never);
    vi.mocked(briefRepository.createFields).mockResolvedValue([
      {
        id: "field-1",
        briefId: "brief-1",
        fieldKey: "goal",
        fieldLabel: "Pinned goal label",
        fieldType: "text",
        value: "Launch a new site",
        sortOrder: 0,
      },
    ] as never);
    vi.mocked(briefRepository.getById).mockResolvedValue({
      id: "brief-1",
      workspaceId,
      projectId,
      templateId,
      templateVersionId: "version-1",
      reviewerId: null,
      title: "Client intake",
      status: "pending_score",
      scopeScore: null,
      scoringResultJson: null,
      submittedBy: actorId,
      submittedAt: new Date("2026-01-03T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-03T00:00:00.000Z"),
    } as never);

    await briefService.savePendingBriefDraft({
      workspaceId,
      projectId,
      briefId: "brief-1",
      responses: { goal: "Launch a new site" },
    });

    expect(briefRepository.createFields).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          briefId: "brief-1",
          fieldKey: "goal",
          fieldLabel: "Pinned goal label",
          value: "Launch a new site",
        }),
      ]),
    );
    expect(briefTemplateRepository.getVersionByBriefVersionId).toHaveBeenCalledWith(
      workspaceId,
      "version-1",
    );
    expect(briefTemplateRepository.getById).not.toHaveBeenCalled();
    expect(briefRepository.update).toHaveBeenCalledWith(
      workspaceId,
      "brief-1",
      expect.objectContaining({
        updatedAt: expect.any(Date),
      }),
    );
  });

  it("fails closed when a pinned template version is missing", async () => {
    vi.mocked(briefRepository.getPendingById).mockResolvedValue({
      id: "brief-1",
      workspaceId,
      projectId,
      templateId,
      templateVersionId: "version-missing",
      reviewerId: null,
      title: "Client intake",
      status: "pending_score",
      scopeScore: null,
      scoringResultJson: null,
      submittedBy: actorId,
      submittedAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    } as never);
    vi.mocked(briefTemplateRepository.getVersionByBriefVersionId).mockResolvedValue(null as never);

    await expect(
      briefService.submitPendingBrief({
        workspaceId,
        projectId,
        briefId: "brief-1",
        responses: {},
      }),
    ).rejects.toThrow(NotFoundError);

    expect(briefTemplateRepository.getById).not.toHaveBeenCalled();
  });
});
