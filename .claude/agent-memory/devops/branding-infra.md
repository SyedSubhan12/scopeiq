---
name: branding-infra
description: Workspace branding columns, logo upload flow, CSS variable injection in portal layout
metadata:
  type: project
---

Workspace schema (`packages/db/src/schema/workspaces.schema.ts`) already has:
- `logoUrl text` — direct URL after upload
- `brandColor varchar(7)` — hex, default `#0F6E56`
- `secondaryColor varchar(7)` — hex, default `#1D9E75`
- `settingsJson jsonb` — `hideScopeiqBranding: boolean` stored here

Logo upload uses the **presigned URL flow** (golden rule 4: never multipart through API):
  1. `POST /v1/branding/logo/upload-url` — returns signed PUT URL, objectKey, publicUrl
  2. Client PUTs directly to R2/MinIO
  3. `POST /v1/branding/logo/confirm` — persists logoUrl on workspace

**Why:** Consistent with the existing workspace logo upload in `workspace.route.ts` and avoids API memory pressure on large files.

CSS variables `--brand-primary`, `--brand-bg`, `--brand-fg` are injected server-side in `apps/web/src/app/(portal)/[portalToken]/layout.tsx` alongside the pre-existing `--portal-*` vars from `generatePortalTheme()`. This eliminates FOUC.

`[data-scopeiq-brand]` attribute marks the "Powered by ScopeIQ" span in `PortalFooter.tsx` for Playwright assertions and future CSS hiding on paid plans.
