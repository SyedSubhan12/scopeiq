---
name: cloudflare-custom-domain
description: Cloudflare for SaaS custom hostname integration pattern and non-fatal fallback behavior
metadata:
  type: project
---

Cloudflare for SaaS integration lives at `apps/api/src/services/cloudflare/custom-hostname.service.ts`.

Three env vars: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ACCOUNT_ID` — all optional in Zod schema so local dev runs without CF credentials.

**Why:** CF API calls are wrapped try/catch in the route — missing creds log a warning and fall through to TXT-only DNS verification. This keeps the feature usable in staging before CF for SaaS is provisioned.

**How to apply:** Any code that calls `customHostnameService.*` should be in a try/catch or the caller should treat CF as "best-effort enrichment" on top of the TXT verification flow.

The Cloudflare hostname ID returned by `addCustomHostname()` must be stored somewhere to support later `removeCustomHostname(id)`. Currently the route returns it in the response body — the client is responsible for persisting it (e.g. in a future `workspace.cfHostnameId` column). A `// TODO` marks this gap.

API field names `custom_metadata` and `ssl.settings.certificate_authority` carry `// TODO: confirm cloudflare API field name` comments — verify against live CF API docs before first production deploy.
