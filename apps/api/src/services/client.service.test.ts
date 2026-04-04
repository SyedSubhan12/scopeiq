import { describe, it, expect, vi, beforeEach } from "vitest";
import { clientService } from "./client.service.js";
import { clientRepository } from "../repositories/client.repository.js";
import { writeAuditLog } from "@novabots/db";
import { NotFoundError } from "@novabots/types";

// Mock dependencies
vi.mock("../repositories/client.repository.js");
vi.mock("@novabots/db", () => ({
    db: {},
    writeAuditLog: vi.fn(),
}));

describe("ClientService", () => {
    const workspaceId = "ws-123";
    const actorId = "user-123";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("listClients", () => {
        it("should call repository list with workspaceId and options", async () => {
            const options = { limit: 10 };
            await clientService.listClients(workspaceId, options);
            expect(clientRepository.list).toHaveBeenCalledWith(workspaceId, options);
        });
    });

    describe("getClient", () => {
        it("should return the client if found", async () => {
            const mockClient = { id: "c-1", name: "Test Client" };
            vi.mocked(clientRepository.getById).mockResolvedValue(mockClient as any);

            const result = await clientService.getClient(workspaceId, "c-1");
            expect(result).toEqual(mockClient);
        });

        it("should throw NotFoundError if client not found", async () => {
            vi.mocked(clientRepository.getById).mockResolvedValue(null);
            await expect(clientService.getClient(workspaceId, "c-1")).rejects.toThrow(NotFoundError);
        });
    });

    describe("createClient", () => {
        it("should create client and write audit log", async () => {
            const data = { name: "New Client", contactEmail: "client@test.com" };
            const mockClient = { id: "c-new", ...data };
            vi.mocked(clientRepository.create).mockResolvedValue(mockClient as any);

            const result = await clientService.createClient(workspaceId, actorId, data);

            expect(result).toEqual(mockClient);
            expect(clientRepository.create).toHaveBeenCalled();
            expect(writeAuditLog).toHaveBeenCalled();
        });
    });

    describe("updateClient", () => {
        it("should update client and write audit log", async () => {
            const data = { name: "Updated Client Name" };
            const mockClient = { id: "c-1", ...data };
            vi.mocked(clientRepository.update).mockResolvedValue(mockClient as any);

            const result = await clientService.updateClient(workspaceId, "c-1", actorId, data);

            expect(result).toEqual(mockClient);
            expect(clientRepository.update).toHaveBeenCalledWith(workspaceId, "c-1", data);
        });
    });
});
