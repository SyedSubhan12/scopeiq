import { rateCardRepository } from "../repositories/rate-card.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError } from "@novabots/types";
import { stripUndefined } from "../lib/strip-undefined.js";

export const rateCardService = {
  async listRateCard(workspaceId: string) {
    return rateCardRepository.list(workspaceId);
  },

  async createRateCardItem(
    workspaceId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const { name, rateInCents, unit, description, currency } = data as {
      name: string;
      rateInCents: number;
      unit?: string;
      description?: string;
      currency?: string;
    };

    const item = await rateCardRepository.create({
      workspaceId,
      name,
      rateInCents,
      unit: unit ?? "hour",
      description: description ?? null,
      currency: currency ?? "USD",
    });

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "rate_card_item",
      entityId: item.id,
      action: "create",
    });

    return item;
  },

  async updateRateCardItem(
    workspaceId: string,
    itemId: string,
    actorId: string,
    data: Record<string, unknown>,
  ) {
    const item = await rateCardRepository.update(workspaceId, itemId, stripUndefined(data));
    if (!item) {
      throw new NotFoundError("RateCardItem", itemId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "rate_card_item",
      entityId: itemId,
      action: "update",
    });

    return item;
  },

  async deleteRateCardItem(workspaceId: string, itemId: string, actorId: string) {
    const item = await rateCardRepository.softDelete(workspaceId, itemId);
    if (!item) {
      throw new NotFoundError("RateCardItem", itemId);
    }

    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId,
      entityType: "rate_card_item",
      entityId: itemId,
      action: "delete",
    });

    return item;
  },
};
