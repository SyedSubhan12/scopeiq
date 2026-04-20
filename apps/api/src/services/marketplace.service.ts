import { marketplaceRepository, MARKETPLACE_CATALOG } from "../repositories/marketplace.repository.js";
import { briefTemplateRepository } from "../repositories/brief-template.repository.js";
import { writeAuditLog } from "@novabots/db";
import { db } from "@novabots/db";
import { NotFoundError } from "@novabots/types";

export const marketplaceService = {
  async listInstalls(workspaceId: string) {
    const installs = await marketplaceRepository.findInstalls(workspaceId);
    return installs.map((i) => i.slug);
  },

  async install(workspaceId: string, userId: string, slug: string) {
    // Validate slug exists in catalog
    const catalogEntry = MARKETPLACE_CATALOG[slug];
    if (!catalogEntry) {
      throw new NotFoundError("MarketplaceTemplate", slug);
    }

    // Check if already installed (idempotent)
    const existingInstall = await marketplaceRepository.findInstallBySlug(workspaceId, slug);
    if (existingInstall) {
      return {
        slug,
        briefTemplateId: existingInstall.briefTemplateId,
      };
    }

    // Create a brief_template from the catalog entry
    const template = await briefTemplateRepository.create({
      workspaceId,
      name: catalogEntry.title,
      description: catalogEntry.description,
      fieldsJson: catalogEntry.fieldsJson as unknown,
      brandingJson: {},
      isDefault: false,
      status: "draft",
    });

    // Record the install
    const install = await marketplaceRepository.createInstall({
      workspaceId,
      slug,
      briefTemplateId: template.id,
      installedByUserId: userId,
    });

    // Audit log
    await writeAuditLog(db as Parameters<typeof writeAuditLog>[0], {
      workspaceId,
      actorId: userId,
      entityType: "marketplace_install",
      entityId: install.id,
      action: "create",
      metadata: {
        slug,
        templateId: template.id,
      },
    });

    return {
      slug,
      briefTemplateId: template.id,
    };
  },
};
