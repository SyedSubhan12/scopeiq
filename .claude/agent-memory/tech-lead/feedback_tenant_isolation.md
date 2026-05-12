---
name: feedback-tenant-isolation
description: Drizzle queries must filter by workspaceId; cross-project lookups within a workspace must also take projectId
metadata:
  type: feedback
---

Every repository method that touches a workspace-scoped table accepts `workspaceId` as the first scoping argument and filters on it. Methods that operate on records nested under a project (messages, deliverable feedback, anything portal-facing) take BOTH `workspaceId` AND `projectId`.

**Why:** Two reasons.
1. Golden rule #2 — "Database via Drizzle ORM only — always include `workspaceId` in queries." This is non-negotiable.
2. Wave 0 surfaced an IDOR-style class of bug where a client of project A could mark messages from project B as read because the service only scoped by workspaceId. Cross-project leakage within the same workspace is a real attack surface, not a theoretical one. The fix landed in commit 5bb930e.

**How to apply:**
- Adding a new repo method? First arg is `workspaceId: string`. If the table is project-nested, second arg is `projectId: string`.
- Reviewing a route? Trace the projectId source. For agency routes, accept `?projectId=` via `zValidator("query", ...)`. For portal routes, read `portalProjectId` from the auth context (set by `portal-auth.ts`).
- When a record isn't found in the caller's scope, return a generic 404 — do NOT throw ForbiddenError, that leaks cross-project existence.
- For sweep jobs that previously ran "global" queries (find-in-review-since, list-breachable), iterate `workspaceRepository.listAll()` and call the scoped repo method per workspace. The fan-out cost is fine; the leakage isn't.
