/**
 * Security regression tests for the Resend inbound-email webhook route.
 *
 * Covers:
 *  1. FIND-010 IDOR: data.project_id is ignored; project is derived from To: only.
 *  2. Malformed To: address → 400, no DB write.
 *  3. HTML sanitization: <script> and onerror= removed before persisting.
 *  4. Oversized body: Content-Length > 10 MB → 413.
 *  5. Happy path: valid To:, body sanitized, message + audit log written, job dispatched.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

// ──────────────────────────────────────────────────────────────────
// Shared mutable state
// ──────────────────────────────────────────────────────────────────
const state = vi.hoisted(() => ({
  // rows inserted into messages table
  insertedMessages: [] as Array<{
    workspaceId: string;
    projectId: string;
    authorName: string | null;
    source: string;
    body: string;
  }>,
  // audit log calls
  auditLogCalls: [] as unknown[],
  // project lookup results — keyed by projectId
  projectMap: {} as Record<string, { id: string; workspaceId: string } | null>,
  // scope-check dispatch calls
  dispatchCalls: [] as unknown[],
}));

// ──────────────────────────────────────────────────────────────────
// Mock @novabots/db
// ──────────────────────────────────────────────────────────────────
vi.mock("@novabots/db", () => {
  const eq = vi.fn((_col: unknown, val: unknown) => ({ _eq: val }));
  const and = vi.fn((...args: unknown[]) => ({ _and: args }));
  const isNull = vi.fn((col: unknown) => ({ _isNull: col }));

  // Fake transaction — executes the callback with a stub tx that captures inserts
  const trxStub = {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(async function (this: { _pending?: {
        workspaceId: string;
        projectId: string;
        authorName: string | null;
        source: string;
        body: string;
      } }) {
        // Resolved by the outer select mock setting _pending
        const row = {
          id: "msg-uuid-1",
          workspaceId: "workspace-1",
          projectId: "proj-uuid-1",
          authorName: null,
          source: "email_forward",
          body: "",
        };
        state.insertedMessages.push(row);
        return [row];
      }),
    }),
  };

  const db = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(async function (this: unknown) {
        // Return the project registered in state.projectMap for any pending lookup.
        // We cheat by grabbing the last project registered (tests set exactly one).
        const entries = Object.values(state.projectMap);
        const project = entries[0] ?? null;
        return project ? [project] : [];
      }),
    }),
    transaction: vi.fn(async (cb: (tx: typeof trxStub) => Promise<unknown>) => {
      // Fresh insert mock per transaction so we can capture values
      const insertMock = vi.fn().mockImplementation(function () {
        return {
          values: vi.fn().mockImplementation(function (vals: typeof state.insertedMessages[0]) {
            state.insertedMessages.push({ id: "msg-uuid-1", ...vals } as unknown as typeof state.insertedMessages[0]);
            return {
              returning: vi.fn().mockResolvedValue([{
                id: "msg-uuid-1",
                workspaceId: vals.workspaceId,
                projectId: vals.projectId,
                authorName: vals.authorName,
                source: vals.source,
                body: vals.body,
              }]),
            };
          }),
        };
      });
      const tx = { insert: insertMock };
      return cb(tx as unknown as typeof trxStub);
    }),
  };

  const writeAuditLog = vi.fn(async () => {
    state.auditLogCalls.push("called");
  });

  return {
    db,
    eq,
    and,
    isNull,
    messages: {},
    projects: {},
    writeAuditLog,
  };
});

// ──────────────────────────────────────────────────────────────────
// Mock dispatchCheckScopeJob
// ──────────────────────────────────────────────────────────────────
vi.mock("../jobs/check-scope.job.js", () => ({
  dispatchCheckScopeJob: vi.fn(async (...args: unknown[]) => {
    state.dispatchCalls.push(args);
  }),
}));

// ──────────────────────────────────────────────────────────────────
// Import route AFTER mocks are registered
// ──────────────────────────────────────────────────────────────────
import { resendWebhookRouter } from "./resend-webhook.route.js";

const app = new Hono().route("/webhooks/resend", resendWebhookRouter);

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

const INBOUND_DOMAIN = "inbound.example.com";

function buildPayload(
  toAddress: string,
  extra: Record<string, unknown> = {},
): string {
  return JSON.stringify({
    type: "email.received",
    data: {
      to: toAddress,
      from: "sender@example.com",
      subject: "Test subject",
      text: "Hello plain text",
      html: extra.html ?? null,
      ...extra,
    },
  });
}

function makeRequest(
  body: string,
  extraHeaders: Record<string, string> = {},
): Request {
  return new Request("http://localhost/webhooks/resend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(Buffer.byteLength(body, "utf8")),
      ...extraHeaders,
    },
    body,
  });
}

// ──────────────────────────────────────────────────────────────────
// Reset state before each test
// ──────────────────────────────────────────────────────────────────
beforeEach(() => {
  state.insertedMessages = [];
  state.auditLogCalls = [];
  state.dispatchCalls = [];
  state.projectMap = {};
  vi.clearAllMocks();
});

// ──────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────

describe("POST /webhooks/resend — security regressions", () => {

  describe("FIND-010 IDOR: project derived from To: only", () => {
    it("inserts into the project from To:, ignoring data.project_id (victim project)", async () => {
      const legitimateProjectId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const victimProjectId     = "ffffffff-ffff-ffff-ffff-ffffffffffff";

      // Only the legitimate project exists in the DB
      state.projectMap = {
        [legitimateProjectId]: { id: legitimateProjectId, workspaceId: "workspace-1" },
      };

      const payload = buildPayload(
        `project-${legitimateProjectId}@${INBOUND_DOMAIN}`,
        {
          // Attacker-supplied project_id pointing at victim — must be ignored
          project_id: victimProjectId,
        },
      );

      const res = await app.fetch(makeRequest(payload));
      expect(res.status).toBe(200);

      // Message must land in the legitimate project, NOT the victim
      expect(state.insertedMessages).toHaveLength(1);
      expect(state.insertedMessages[0]?.projectId).toBe(legitimateProjectId);
      expect(state.insertedMessages[0]?.projectId).not.toBe(victimProjectId);
    });
  });

  describe("Malformed To: address", () => {
    it("returns 400 and writes nothing when To: has no project- prefix", async () => {
      state.projectMap = {};
      const payload = buildPayload(`random-address@${INBOUND_DOMAIN}`);
      const res = await app.fetch(makeRequest(payload));

      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Unrecognized inbound address");
      expect(state.insertedMessages).toHaveLength(0);
      expect(state.auditLogCalls).toHaveLength(0);
    });

    it("returns 400 when To: is completely missing", async () => {
      const payload = JSON.stringify({
        type: "email.received",
        data: { from: "x@y.com", subject: "hi", text: "body" },
      });
      const res = await app.fetch(makeRequest(payload));

      expect(res.status).toBe(400);
      expect(state.insertedMessages).toHaveLength(0);
    });

    it("returns 400 when project-<uuid> part is not a valid UUID", async () => {
      const payload = buildPayload(`project-not-a-uuid@${INBOUND_DOMAIN}`);
      const res = await app.fetch(makeRequest(payload));

      expect(res.status).toBe(400);
      expect(state.insertedMessages).toHaveLength(0);
    });
  });

  describe("HTML sanitization (XSS prevention)", () => {
    it("strips <script> tags and onerror= attributes before persisting", async () => {
      const projectId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      state.projectMap = {
        [projectId]: { id: projectId, workspaceId: "workspace-1" },
      };

      const maliciousHtml =
        '<p>Hello</p><script>alert(1)</script><img src="x" onerror="evil()">';

      const payload = buildPayload(`project-${projectId}@${INBOUND_DOMAIN}`, {
        html: maliciousHtml,
      });

      const res = await app.fetch(makeRequest(payload));
      expect(res.status).toBe(200);

      expect(state.insertedMessages).toHaveLength(1);
      const body = state.insertedMessages[0]?.body ?? "";

      // Script tag must be gone
      expect(body).not.toContain("<script>");
      expect(body).not.toContain("alert(1)");
      // onerror attribute must be gone
      expect(body).not.toContain("onerror");
      // Safe content must survive
      expect(body).toContain("<p>Hello</p>");
    });
  });

  describe("FIND-016: body-size limit", () => {
    it("returns 413 when Content-Length exceeds 10 MB", async () => {
      const payload = buildPayload(`project-a1b2c3d4-e5f6-7890-abcd-ef1234567890@${INBOUND_DOMAIN}`);

      const res = await app.fetch(
        new Request("http://localhost/webhooks/resend", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            // 20 MB — above the 10 MB cap
            "content-length": String(20 * 1024 * 1024),
          },
          body: payload,
        }),
      );

      expect(res.status).toBe(413);
      const body = await res.json() as { error: string };
      expect(body.error).toBe("Body too large");
      // No DB interaction
      expect(state.insertedMessages).toHaveLength(0);
      expect(state.auditLogCalls).toHaveLength(0);
    });
  });

  describe("Happy path", () => {
    it("persists a sanitized message, writes an audit log, and dispatches scope-check job", async () => {
      const projectId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      state.projectMap = {
        [projectId]: { id: projectId, workspaceId: "workspace-1" },
      };

      const safeHtml = "<p>Please add <strong>Feature X</strong> to the scope.</p>";
      const payload = buildPayload(`project-${projectId}@${INBOUND_DOMAIN}`, {
        html: safeHtml,
        from: "client@example.com",
        subject: "Scope addition request",
      });

      const res = await app.fetch(makeRequest(payload));
      expect(res.status).toBe(200);

      const respBody = await res.json() as { received: boolean; messageId: string };
      expect(respBody.received).toBe(true);
      expect(typeof respBody.messageId).toBe("string");

      // Message row persisted
      expect(state.insertedMessages).toHaveLength(1);
      const msg = state.insertedMessages[0]!;
      expect(msg.projectId).toBe(projectId);
      expect(msg.workspaceId).toBe("workspace-1");
      expect(msg.source).toBe("email_forward");
      // HTML preserved (safe tags survive sanitization)
      expect(msg.body).toContain("Feature X");
      // No script tags
      expect(msg.body).not.toContain("<script>");

      // Audit log written
      expect(state.auditLogCalls).toHaveLength(1);

      // BullMQ job dispatched
      expect(state.dispatchCalls).toHaveLength(1);
    });
  });
});
