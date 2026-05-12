/**
 * Regression tests for portal-messages route.
 *
 * Key security regression: IDOR on POST /portal/messages/:id/read
 * A portal client authenticated for project P1 must not be able to mark a
 * message that belongs to project P2 (same workspace) as read.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

// ──────────────────────────────────────────────────────────────────
// Shared mutable state threaded through the vi.hoisted closure so
// individual tests can control what the DB returns.
// ──────────────────────────────────────────────────────────────────
const state = vi.hoisted(() => ({
  // findById: maps `${id}:${workspaceId}:${projectId}` → MessageRow | null
  findByIdMap: {} as Record<string, Record<string, unknown> | null>,
  // markReadCalls: collects every (id, workspaceId, projectId) tuple
  markReadCalls: [] as Array<{ id: string; workspaceId: string; projectId: string }>,
  // markReadResult: what markRead resolves to
  markReadResult: null as Record<string, unknown> | null,
  // transactionCallback invoked synchronously with a stub trx
  auditLogCalls: [] as unknown[],
}));

// ──────────────────────────────────────────────────────────────────
// Mock portal-auth — project determined per-test via portalProjectId
// ──────────────────────────────────────────────────────────────────
const authState = vi.hoisted(() => ({ projectId: "project-1" }));

vi.mock("../middleware/portal-auth.js", () => ({
  portalAuthMiddleware: async (c: {
    set: (k: string, v: string) => void;
  }, next: () => Promise<void>) => {
    c.set("portalProjectId", authState.projectId);
    c.set("portalWorkspaceId", "workspace-1");
    c.set("portalClientId", "client-1");
    await next();
  },
}));

// ──────────────────────────────────────────────────────────────────
// Mock @novabots/db — only the subset used by markRead path
// ──────────────────────────────────────────────────────────────────
vi.mock("@novabots/db", () => {
  const eq = vi.fn();
  const and = vi.fn();
  const isNull = vi.fn();

  const trxStub = { _isTrx: true };

  const db = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn((resolve: (v: unknown[]) => void) => resolve([])),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    }),
    transaction: vi.fn(async (cb: (trx: typeof trxStub) => Promise<unknown>) => cb(trxStub)),
  };

  const writeAuditLog = vi.fn(async () => {
    state.auditLogCalls.push("called");
  });

  return { db, eq, and, isNull, messages: {}, projects: {}, writeAuditLog };
});

// ──────────────────────────────────────────────────────────────────
// Mock the repository so we can control findById / markRead outcomes
// without hitting Drizzle's query builder.
// ──────────────────────────────────────────────────────────────────
vi.mock("../repositories/message.repository.js", () => ({
  messageRepository: {
    findById: vi.fn(
      async (id: string, workspaceId: string, projectId: string) =>
        state.findByIdMap[`${id}:${workspaceId}:${projectId}`] ?? null,
    ),
    markRead: vi.fn(async (id: string, workspaceId: string, projectId: string) => {
      state.markReadCalls.push({ id, workspaceId, projectId });
      return state.markReadResult;
    }),
  },
}));

// ──────────────────────────────────────────────────────────────────
// Mock dispatchCheckScopeJob (pulled in transitively)
// ──────────────────────────────────────────────────────────────────
vi.mock("../jobs/check-scope.job.js", () => ({
  dispatchCheckScopeJob: vi.fn(),
}));

// ──────────────────────────────────────────────────────────────────
// Mock error middleware — surface NotFoundError as 404
// ──────────────────────────────────────────────────────────────────
vi.mock("../middleware/error.js", () => ({
  errorHandler: async (
    err: { statusCode?: number; code?: string; message?: string },
    c: { json: (body: unknown, status: number) => unknown },
  ) => {
    const status = typeof err?.statusCode === "number" ? err.statusCode : 500;
    return c.json(
      {
        error: {
          code: err.code ?? "INTERNAL_SERVER_ERROR",
          message: err.message ?? "An unexpected error occurred",
        },
      },
      status,
    );
  },
}));

import { portalMessagesRouter } from "./portal-messages.route.js";
import { errorHandler } from "../middleware/error.js";
import { messageRepository } from "../repositories/message.repository.js";

const app = new Hono()
  .onError(errorHandler)
  .route("/portal/messages", portalMessagesRouter);

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
function makeMessage(id: string, projectId: string, readAt: Date | null = null) {
  return {
    id,
    projectId,
    workspaceId: "workspace-1",
    authorType: "agency",
    authorId: null,
    authorName: null,
    body: "Hello",
    attachmentsJson: null,
    threadId: null,
    readAt,
    scopeCheckStatus: "pending",
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
}

// ──────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────
describe("POST /portal/messages/:id/read", () => {
  beforeEach(() => {
    state.findByIdMap = {};
    state.markReadCalls = [];
    state.markReadResult = null;
    state.auditLogCalls = [];
    authState.projectId = "project-1";
    vi.clearAllMocks();
  });

  it("marks a message read when it belongs to the authenticated project", async () => {
    const msgId = "00000000-0000-0000-0000-000000000001";
    const msg = makeMessage(msgId, "project-1");
    const readMsg = { ...msg, readAt: new Date() };

    // findById called with (id, workspaceId, projectId) — project-1 match
    state.findByIdMap[`${msgId}:workspace-1:project-1`] = msg;
    state.markReadResult = readMsg;

    const res = await app.fetch(
      new Request(`http://localhost/portal/messages/${msgId}/read`, { method: "POST" }),
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { id: string; read_at: string | null } };
    expect(body.data.id).toBe(msgId);
    expect(body.data.read_at).not.toBeNull();

    // markRead must have been called with projectId scoping
    expect(state.markReadCalls).toHaveLength(1);
    expect(state.markReadCalls[0]).toMatchObject({
      id: msgId,
      workspaceId: "workspace-1",
      projectId: "project-1",
    });
  });

  it("returns 404 when a client of P1 attempts to mark a P2 message as read (IDOR regression)", async () => {
    // P2 message exists in the same workspace — but the auth context says project-1
    const p2MsgId = "00000000-0000-0000-0000-000000000002";
    const p2Msg = makeMessage(p2MsgId, "project-2");

    // Only register the message under project-2; a project-1 lookup must return null
    state.findByIdMap[`${p2MsgId}:workspace-1:project-2`] = p2Msg;
    // Explicitly absent: state.findByIdMap[`${p2MsgId}:workspace-1:project-1`]

    authState.projectId = "project-1"; // client is authenticated for P1

    const res = await app.fetch(
      new Request(`http://localhost/portal/messages/${p2MsgId}/read`, { method: "POST" }),
    );

    expect(res.status).toBe(404);

    // markRead (the UPDATE) must never have been called
    expect(state.markReadCalls).toHaveLength(0);

    // P2 message readAt must be untouched (still null in our stub)
    expect(p2Msg.readAt).toBeNull();
  });

  it("returns 200 idempotently when the message is already read", async () => {
    const msgId = "00000000-0000-0000-0000-000000000003";
    const alreadyRead = makeMessage(msgId, "project-1", new Date("2026-01-02T00:00:00Z"));

    state.findByIdMap[`${msgId}:workspace-1:project-1`] = alreadyRead;
    // markReadResult intentionally left null — service short-circuits before calling repo

    const res = await app.fetch(
      new Request(`http://localhost/portal/messages/${msgId}/read`, { method: "POST" }),
    );

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { id: string; read_at: string } };
    expect(body.data.id).toBe(msgId);
    // markRead (the UPDATE query) should not have been called
    expect(state.markReadCalls).toHaveLength(0);
  });

  it("returns 404 for a completely unknown message UUID", async () => {
    // findByIdMap is empty — message doesn't exist in any project
    const unknownId = "ffffffff-ffff-ffff-ffff-ffffffffffff";

    const res = await app.fetch(
      new Request(`http://localhost/portal/messages/${unknownId}/read`, { method: "POST" }),
    );

    expect(res.status).toBe(404);
    expect(state.markReadCalls).toHaveLength(0);
  });

  it("rejects an invalid (non-UUID) message id with 400", async () => {
    const res = await app.fetch(
      new Request("http://localhost/portal/messages/not-a-uuid/read", { method: "POST" }),
    );

    // zValidator returns 400 for schema failures
    expect(res.status).toBe(400);
    expect(state.markReadCalls).toHaveLength(0);
  });

  it("passes projectId to findById — not just workspaceId", async () => {
    // Verify the repository is called with three args, projectId being the auth project
    const msgId = "00000000-0000-0000-0000-000000000004";
    state.findByIdMap[`${msgId}:workspace-1:project-1`] = makeMessage(msgId, "project-1");
    state.markReadResult = { ...makeMessage(msgId, "project-1"), readAt: new Date() };

    authState.projectId = "project-1";

    await app.fetch(
      new Request(`http://localhost/portal/messages/${msgId}/read`, { method: "POST" }),
    );

    expect(vi.mocked(messageRepository.findById)).toHaveBeenCalledWith(
      msgId,
      "workspace-1",
      "project-1",
    );
  });
});
