/**
 * Tests for portal-auth middleware security fixes:
 *   FIND-001 — expired client tokens must be rejected (401)
 *   FIND-005 — client with multiple active projects must be rejected (401)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { Hono } from "hono";

// ---------------------------------------------------------------------------
// Shared mock state — mutated per-test in beforeEach
// ---------------------------------------------------------------------------
const mockState = vi.hoisted(() => ({
  // Return value for the clients SELECT (array with 0 or 1 element)
  clientRows: [] as Array<{
    id: string;
    workspaceId: string;
    portalTokenHash: string;
    tokenExpiresAt: Date | null;
  }>,
  // Return value for the projects SELECT (array with 0, 1, or 2 elements)
  projectRows: [] as Array<{ id: string; workspaceId: string }>,
  // Return value for the initial project-token scan (empty → skip that branch)
  projectScanRows: [] as Array<{
    id: string;
    workspaceId: string;
    portalToken: string | null;
  }>,
}));

// ---------------------------------------------------------------------------
// Mock @novabots/db
// The select() chain tracks which table it is querying via .from() and
// returns the appropriate pre-configured rows when awaited.
// ---------------------------------------------------------------------------
vi.mock("@novabots/db", () => {
  const tables = {
    projects:  { _tag: "projects"  } as const,
    clients:   { _tag: "clients"   } as const,
    clientId:  { _tag: "clientId"  } as const,
    workspaceId: { _tag: "workspaceId" } as const,
    portalTokenHash: { _tag: "portalTokenHash" } as const,
    deletedAt: { _tag: "deletedAt" } as const,
    id:        { _tag: "id"        } as const,
  };

  const eq      = vi.fn();
  const and     = vi.fn();
  const isNull  = vi.fn();
  const constantTimeCompare = vi.fn(() => false);
  const verifyPortalToken   = vi.fn(() => false);

  const select = vi.fn(() => {
    let currentTable: { _tag?: string } | undefined;
    let limitN: number | undefined;

    const chain: Record<string, (...args: unknown[]) => unknown> & {
      then: (
        resolve: (v: unknown) => void,
        reject: (e: unknown) => void
      ) => void;
    } = {
      from(table: { _tag?: string }) {
        currentTable = table;
        return chain;
      },
      where() {
        return chain;
      },
      orderBy() {
        return chain;
      },
      limit(n: number) {
        limitN = n;
        return chain;
      },
      then(resolve, reject) {
        try {
          let rows: unknown[];
          if (currentTable?._tag === "clients") {
            rows = mockState.clientRows;
          } else if (currentTable?._tag === "projects") {
            // The project-token scan comes first (limitN === 500),
            // the client-project lookup comes second (limitN <= 2).
            rows =
              limitN !== undefined && limitN <= 2
                ? mockState.projectRows
                : mockState.projectScanRows;
          } else {
            rows = [];
          }
          resolve(
            limitN !== undefined ? rows.slice(0, limitN) : rows,
          );
        } catch (e) {
          reject(e);
        }
      },
    };
    return chain;
  });

  return {
    db: { select },
    ...tables,
    eq,
    and,
    isNull,
    constantTimeCompare,
    verifyPortalToken,
  };
});

// ---------------------------------------------------------------------------
// A minimal error handler that forwards UnauthorizedError status codes
// ---------------------------------------------------------------------------
vi.mock("../middleware/error.js", () => ({
  errorHandler: async (err: unknown, c: { json: (b: unknown, s: number) => unknown }) => {
    const e = err as { statusCode?: number; message?: string; code?: string };
    if (typeof e.statusCode === "number") {
      return c.json({ error: { code: e.code ?? "ERROR", message: e.message } }, e.statusCode);
    }
    return c.json({ error: { code: "INTERNAL_SERVER_ERROR" } }, 500);
  },
}));

// ---------------------------------------------------------------------------
// Import SUT *after* mocks are registered
// ---------------------------------------------------------------------------
import { portalAuthMiddleware } from "./portal-auth.js";
import { errorHandler } from "../middleware/error.js";

// ---------------------------------------------------------------------------
// Build a tiny Hono app that uses the middleware and returns 200 on success
// ---------------------------------------------------------------------------
const app = new Hono()
  .onError(errorHandler)
  .use("*", portalAuthMiddleware)
  .get("*", (c) => c.json({ ok: true }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TOKEN = "super-secret-portal-token";
const TOKEN_HASH = createHash("sha256").update(TOKEN).digest("hex");

function makeRequest(): Request {
  return new Request("http://localhost/test", {
    headers: { "X-Portal-Token": TOKEN },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("portalAuthMiddleware — client token security fixes", () => {
  beforeEach(() => {
    // Default: project-token scan returns nothing (skip that branch)
    mockState.projectScanRows = [];
    mockState.clientRows      = [];
    mockState.projectRows     = [];
  });

  // FIND-001 ----------------------------------------------------------------
  describe("FIND-001: token expiry enforcement", () => {
    it("rejects an expired client token (tokenExpiresAt = now - 1 s) with 401", async () => {
      const expiredAt = new Date(Date.now() - 1_000);

      mockState.clientRows = [{
        id: "client-1",
        workspaceId: "ws-1",
        portalTokenHash: TOKEN_HASH,
        tokenExpiresAt: expiredAt,
      }];
      // No project rows needed — should fail before the project lookup
      mockState.projectRows = [];

      const res = await app.fetch(makeRequest());
      expect(res.status).toBe(401);

      const body = await res.json() as { error: { message: string } };
      expect(body.error.message).toBe("Invalid or expired token");
    });

    it("accepts a non-expired client token (tokenExpiresAt = now + 1 h) with 200", async () => {
      const futureExpiry = new Date(Date.now() + 60 * 60 * 1_000);

      mockState.clientRows = [{
        id: "client-2",
        workspaceId: "ws-1",
        portalTokenHash: TOKEN_HASH,
        tokenExpiresAt: futureExpiry,
      }];
      mockState.projectRows = [{
        id: "project-1",
        workspaceId: "ws-1",
      }];

      const res = await app.fetch(makeRequest());
      expect(res.status).toBe(200);
    });

    it("accepts a client token with NULL tokenExpiresAt (never expires) with 200", async () => {
      mockState.clientRows = [{
        id: "client-3",
        workspaceId: "ws-1",
        portalTokenHash: TOKEN_HASH,
        tokenExpiresAt: null,
      }];
      mockState.projectRows = [{
        id: "project-2",
        workspaceId: "ws-1",
      }];

      const res = await app.fetch(makeRequest());
      expect(res.status).toBe(200);
    });
  });

  // FIND-005 ----------------------------------------------------------------
  describe("FIND-005: ambiguous multi-project guard", () => {
    it("returns 401 with the ambiguous message when a client has two active projects", async () => {
      mockState.clientRows = [{
        id: "client-4",
        workspaceId: "ws-1",
        portalTokenHash: TOKEN_HASH,
        tokenExpiresAt: null,
      }];
      // Two projects → ambiguous
      mockState.projectRows = [
        { id: "project-A", workspaceId: "ws-1" },
        { id: "project-B", workspaceId: "ws-1" },
      ];

      const res = await app.fetch(makeRequest());
      expect(res.status).toBe(401);

      const body = await res.json() as { error: { message: string } };
      expect(body.error.message).toBe(
        "Client token is ambiguous — multiple active projects",
      );
    });
  });
});
