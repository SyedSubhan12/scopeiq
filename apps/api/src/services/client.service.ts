import { clientRepository } from "../repositories/client.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";

export const clientService = {
  async listClients(
    workspaceId: string,
    options: Record<string, unknown>,
  ) {
    const clean = stripUndefined(options) as { cursor?: string; limit?: number };
    return clientRepository.list(workspaceId, clean);
  },

  async getClient(workspaceId: string, clientId: string) {
    const client = await clientRepository.getById(workspaceId, clientId);
    if (!client) {
      throw new NotFoundError("Client", clientId);
    }
    return client;
  },

  async createClient(
    workspaceId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const { name, contactName, contactEmail, notes } = data as {
      name: string;
      contactName?: string;
      contactEmail?: string;
      notes?: string;
    };

    const client = await clientRepository.create({
      workspaceId,
      name,
      contactName: contactName ?? null,
      contactEmail: contactEmail ?? null,
      notes: notes ?? null,
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "client",
      entityId: client.id,
      action: "create",
    });

    return client;
  },

  async updateClient(
    workspaceId: string,
    clientId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const client = await clientRepository.update(workspaceId, clientId, stripUndefined(data));
    if (!client) {
      throw new NotFoundError("Client", clientId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "client",
      entityId: clientId,
      action: "update",
      metadata: { fields: Object.keys(data) },
    });

    return client;
  },
};
