import { describe, it, expect, vi, beforeEach } from "vitest";
import { projectService } from "./project.service.js";
import { projectRepository } from "../repositories/project.repository.js";
import { writeAuditLog } from "@novabots/db";
import { NotFoundError } from "@novabots/types";

// Mock dependencies
vi.mock("../repositories/project.repository.js");
vi.mock("@novabots/db", () => ({
    db: {},
    writeAuditLog: vi.fn(),
    generatePortalToken: vi.fn(() => ({ raw: "mock-token", hash: "mock-hash" })),
}));

describe("ProjectService", () => {
    const workspaceId = "ws-123";
    const actorId = "user-123";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("listProjects", () => {
        it("should call repository list with workspaceId and options", async () => {
            const options = { status: "active", limit: 10 };
            await projectService.listProjects(workspaceId, options);
            expect(projectRepository.list).toHaveBeenCalledWith(workspaceId, options);
        });
    });

    describe("getProject", () => {
        it("should return the project if found", async () => {
            const mockProject = { id: "p-1", name: "Test Project" };
            vi.mocked(projectRepository.getById).mockResolvedValue(mockProject as any);

            const result = await projectService.getProject(workspaceId, "p-1");
            expect(result).toEqual(mockProject);
        });

        it("should throw NotFoundError if project not found", async () => {
            vi.mocked(projectRepository.getById).mockResolvedValue(null);
            await expect(projectService.getProject(workspaceId, "p-1")).rejects.toThrow(NotFoundError);
        });
    });

    describe("createProject", () => {
        it("should create project and write audit log", async () => {
            const data = { name: "New Project", clientId: "c-1" };
            const mockProject = { id: "p-new", ...data };
            vi.mocked(projectRepository.create).mockResolvedValue(mockProject as any);

            const result = await projectService.createProject(workspaceId, actorId, data);

            expect(result).toEqual(mockProject);
            expect(projectRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                workspaceId,
                name: "New Project",
                clientId: "c-1",
                portalToken: "mock-token",
            }));
            expect(writeAuditLog).toHaveBeenCalled();
        });
    });

    describe("updateProject", () => {
        it("should update project and write audit log", async () => {
            const data = { name: "Updated Name" };
            const mockProject = { id: "p-1", ...data };
            vi.mocked(projectRepository.update).mockResolvedValue(mockProject as any);

            const result = await projectService.updateProject(workspaceId, "p-1", actorId, data);

            expect(result).toEqual(mockProject);
            expect(projectRepository.update).toHaveBeenCalledWith(workspaceId, "p-1", data);
            expect(writeAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                action: "update",
                entityId: "p-1",
            }));
        });
    });

    describe("deleteProject", () => {
        it("should soft delete project and write audit log", async () => {
            const mockProject = { id: "p-1" };
            vi.mocked(projectRepository.softDelete).mockResolvedValue(mockProject as any);

            await projectService.deleteProject(workspaceId, "p-1", actorId);

            expect(projectRepository.softDelete).toHaveBeenCalledWith(workspaceId, "p-1");
            expect(writeAuditLog).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
                action: "delete",
                entityId: "p-1",
            }));
        });
    });
});
