/**
 * Branding API
 *
 * POST  /v1/branding/logo/upload-url — get presigned URL for logo upload (≤2 MB)
 * POST  /v1/branding/logo/confirm    — persist logo_url after successful direct upload
 * PATCH /v1/branding                 — update brand colors / hide-branding toggle
 *
 * Upload flow (presigned — never multipart through API):
 *   1. Client calls POST /branding/logo/upload-url with { contentType, fileSizeBytes }
 *   2. API validates size (≤2 MB) + MIME, returns presigned PUT URL + objectKey
 *   3. Client PUTs the file directly to R2/MinIO
 *   4. Client calls POST /branding/logo/confirm with { objectKey }
 *   5. API persists logoUrl on workspace
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { getUploadUrl } from "../lib/storage.js";
import { workspaceRepository } from "../repositories/workspace.repository.js";
import { db, writeAuditLog } from "@novabots/db";
import { ValidationError } from "@novabots/types";

export const brandingRouter = new Hono();

brandingRouter.use("*", authMiddleware);

const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_LOGO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

const uploadUrlSchema = z.object({
  contentType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
});

const confirmLogoSchema = z.object({
  objectKey: z.string().min(1),
  publicUrl: z.string().url(),
});

const updateBrandingSchema = z.object({
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a 6-digit hex color")
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a 6-digit hex color")
    .optional(),
  hideScopeiqBranding: z.boolean().optional(),
});

/**
 * POST /v1/branding/logo/upload-url
 * Returns a presigned PUT URL for direct-to-storage logo upload.
 */
brandingRouter.post(
  "/logo/upload-url",
  zValidator("json", uploadUrlSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const { contentType, fileSizeBytes } = c.req.valid("json");

    if (!ALLOWED_LOGO_MIME_TYPES.has(contentType)) {
      throw new ValidationError(
        `File type '${contentType}' is not allowed for logos. Accepted: ${[...ALLOWED_LOGO_MIME_TYPES].join(", ")}`,
      );
    }

    if (fileSizeBytes > LOGO_MAX_BYTES) {
      throw new ValidationError(
        `Logo must be ≤ 2 MB. Received ${(fileSizeBytes / 1024 / 1024).toFixed(1)} MB`,
      );
    }

    const objectKey = `workspaces/${workspaceId}/logo`;
    const uploadUrl = await getUploadUrl(objectKey, contentType, 900);

    // Compute public URL — matches existing workspace route pattern
    const protocol = process.env.STORAGE_USE_SSL === "true" ? "https" : "http";
    const host = process.env.STORAGE_ENDPOINT ?? "localhost";
    const port = process.env.STORAGE_PORT ? `:${process.env.STORAGE_PORT}` : "";
    const bucket = process.env.STORAGE_BUCKET ?? "scopeiq-assets";
    const publicUrl = `${protocol}://${host}${port}/${bucket}/${objectKey}`;

    return c.json({ data: { uploadUrl, objectKey, publicUrl } }, 200);
  },
);

/**
 * POST /v1/branding/logo/confirm
 * Called by the client after a successful direct upload to persist the logoUrl.
 */
brandingRouter.post(
  "/logo/confirm",
  zValidator("json", confirmLogoSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const { objectKey, publicUrl } = c.req.valid("json");

    // Security: ensure the objectKey belongs to this workspace
    if (!objectKey.startsWith(`workspaces/${workspaceId}/`)) {
      throw new ValidationError("Object key does not belong to this workspace");
    }

    await workspaceRepository.update(workspaceId, { logoUrl: publicUrl });

    await writeAuditLog(db, {
      workspaceId,
      actorId: userId,
      entityType: "workspace",
      entityId: workspaceId,
      action: "update",
      metadata: { field: "logoUrl", objectKey, event: "logo_uploaded" },
    });

    return c.json({ data: { logoUrl: publicUrl } }, 200);
  },
);

/**
 * PATCH /v1/branding
 * Update brand colors and/or hide-branding toggle.
 * hideScopeiqBranding requires studio/agency plan (enforced via features JSON).
 */
brandingRouter.patch(
  "/",
  zValidator("json", updateBrandingSchema),
  async (c) => {
    const workspaceId = c.get("workspaceId");
    const userId = c.get("userId");
    const body = c.req.valid("json");

    if (body.hideScopeiqBranding !== undefined) {
      const workspace = await workspaceRepository.getByIdWithDomain(workspaceId);
      const plan = workspace?.plan ?? "free";
      if (plan !== "studio" && plan !== "agency") {
        throw new ValidationError("Hiding ScopeIQ branding requires the Studio or Agency plan");
      }
    }

    const updates: Partial<{
      brandColor: string;
      secondaryColor: string;
      settingsJson: Record<string, unknown>;
    }> = {};

    if (body.brandColor !== undefined) {
      updates.brandColor = body.brandColor;
    }
    if (body.secondaryColor !== undefined) {
      updates.secondaryColor = body.secondaryColor;
    }

    if (body.hideScopeiqBranding !== undefined) {
      const existing = await workspaceRepository.getById(workspaceId);
      const existingSettings =
        (existing?.settingsJson as Record<string, unknown> | null) ?? {};
      updates.settingsJson = {
        ...existingSettings,
        hideScopeiqBranding: body.hideScopeiqBranding,
      };
    }

    await workspaceRepository.update(workspaceId, updates);

    await writeAuditLog(db, {
      workspaceId,
      actorId: userId,
      entityType: "workspace",
      entityId: workspaceId,
      action: "update",
      metadata: { fields: Object.keys(updates), event: "branding_updated" },
    });

    return c.json({ data: { updated: true } }, 200);
  },
);
