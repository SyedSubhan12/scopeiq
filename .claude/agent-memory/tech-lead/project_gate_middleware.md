---
name: project-gate-middleware
description: Feature-gate middleware checks workspace.features JSONB; Gate 1 always-on, Gates 2 and 3 flagged
metadata:
  type: project
---

`apps/api/src/middleware/gate.ts` exports `gateMiddleware(name: "approval_portal" | "brief_builder")`. It reads `workspaces.features` JSONB and returns 403 if `features[name] !== true`.

**Why:** Product wants the ability to hold beta workspaces back from features whose metrics have not been proven. Gate 1 (Scope Guard) ships universally for launch. Gate 2 (Approval Portal) and Gate 3 (Brief Builder) are flagged per workspace.

**How to apply:**
- New route in the Approval Portal surface? `router.use("*", authMiddleware); router.use("*", gateMiddleware("approval_portal"));`
- New route in the Brief Builder surface? Same pattern with `"brief_builder"`.
- New Gate? Extend the `GateName` union in `gate.ts` and add the corresponding `features.<name>` flip in the workspace admin path.
- Do NOT short-circuit the gate for "internal" or "admin" callers — those should be handled by separate auth flows, not by skipping the feature check.

Currently applied to `brief.route.ts`, `brief-template.route.ts` (brief_builder), and `deliverable.route.ts` (approval_portal). When wiring more routes, follow the same import-and-use-after-auth ordering.
