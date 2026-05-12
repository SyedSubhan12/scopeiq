---
name: IDOR fix — portal mark-read project scoping
description: findById and markRead in message.repository must scope on projectId as well as workspaceId; the pattern to follow when any single-entity lookup is exposed through a portal route
type: feedback
---

Always include `projectId` in the WHERE clause of `findById` and any single-entity mutation in the message repository when called from a portal route.

**Why:** `findById(id, workspaceId)` without a `projectId` predicate allowed a portal client authenticated for project A to mark messages in project B (same workspace) as read by guessing UUID — a classic IDOR. The fix (2026-05-02) added `eq(messages.projectId, projectId)` to both `findById` and `markRead` in `message.repository.ts`, added `projectId` as the third parameter to `portalMessagesService.markRead`, and updated both the portal route (`portal-messages.route.ts`) and the agency route (`messages.route.ts`, now requires `?projectId=` query param).

**How to apply:** Any time a portal route does a single-row lookup by `id`, verify the repository WHERE clause includes all three isolation axes: `id`, `workspaceId`, AND `projectId`. The generic 404 must be returned whether the row doesn't exist at all or exists in a different project — never leak cross-project existence.
