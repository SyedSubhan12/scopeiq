/**
 * Tests for ai-callback route hardening.
 *
 * Covers:
 *  1. FIND-014: concurrent change-order-generated — exactly one row inserted
 *  2. FIND-014: idempotent brief-scored — second call returns already_processed
 *  3. FIND-018: scope-checked cross-workspace — message in P2 returns 404 for P1 callback
 *  4. FIND-016: body-size guard — Content-Length > 5 MB returns 413
 *  5. Auth gate regression — missing X-AI-Secret returns 401
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

// ──────────────────────────────────────────────────────────────────
// Shared mutable state for DB mock control
// ──────────────────────────────────────────────────────────────────
const state = vi.hoisted(() => ({
  // change-order-generated
  scopeFlagRow: null as Record<string, unknown> | null,
  changeOrderInsertResult: [] as Array<{ id: string }>,
  // brief-scored
  briefUpdateResult: [] as Array<{ workspaceId: string; projectId: string | null }>,
  briefExistsResult: [] as Array<{ id: string }>,
  // scope-checked
  projectRow: null as Record<string, unknown> | null,
  messageClaimResult: [] as Array<{ id: string }>,
  messageExistsResult: [] as Array<{ id: string }>,
  // misc
  auditLogCalls: 0,
}));

// ──────────────────────────────────────────────────────────────────
// Mock @novabots/db
// The trx stub has the same shape as db — tests override per-call
// behaviour through state.* flags.
// ──────────────────────────────────────────────────────────────────
vi.mock("@novabots/db", () => {
  const eq = vi.fn((..._args: unknown[]) => "eq");
  const and = vi.fn((..._args: unknown[]) => "and");
  const isNull = vi.fn((..._args: unknown[]) => "isNull");
  const sql = { DESC: "DESC" };

  // We build a chainable query stub whose terminal method (returning/then/limit)
  // resolves based on which query is being made. Because all five handlers call
  // db/trx methods in a specific order we track a call counter per test.
  let callIdx = 0;
  const resetCallIdx = () => { callIdx = 0; };

  // A generic chainable builder that resolves to `resolvedValue` at the end
  function queryChain(resolvedValue: unknown[]) {
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => chain,
      limit: () => Promise.resolve(resolvedValue),
      orderBy: () => chain,
      set: () => chain,
      returning: () => Promise.resolve(resolvedValue),
      onConflictDoNothing: () => chain,
      values: () => chain,
    };
    return chain;
  }

  // trx stub — per-call behaviour wired through state.*
  function makeTrxStub() {
    return {
      _callIdx: 0,

      select(_fields: unknown) {
        const self = this;
        const chain = {
          from: (_t: unknown) => chain,
          where: (_w: unknown) => chain,
          limit: (_n: unknown): Promise<unknown[]> => {
            self._callIdx += 1;
            // Brief exists check (called when update returned 0 rows)
            return Promise.resolve(state.briefExistsResult);
          },
          orderBy: (_col: unknown, _dir: unknown) => chain,
          innerJoin: (_t: unknown, _c: unknown) => chain,
        };
        return chain;
      },

      update(_table: unknown) {
        const self = this;
        const chain = {
          set: (_v: unknown) => chain,
          where: (_w: unknown) => chain,
          returning: (): Promise<unknown[]> => {
            // brief.update returning
            return Promise.resolve(state.briefUpdateResult);
          },
        };
        return chain;
      },

      insert(_table: unknown) {
        const chain = {
          values: (_v: unknown) => chain,
          onConflictDoNothing: (_o: unknown) => chain,
          returning: (): Promise<unknown[]> => {
            return Promise.resolve(state.changeOrderInsertResult);
          },
        };
        return chain;
      },

      delete(_table: unknown) {
        return { where: (_w: unknown) => Promise.resolve() };
      },
    };
  }

  // scope-checked needs a trx that handles the message UPDATE atomically
  function makeScopeCheckedTrxStub() {
    return {
      update(_table: unknown) {
        const chain = {
          set: (_v: unknown) => chain,
          where: (_w: unknown) => chain,
          returning: (): Promise<unknown[]> => {
            return Promise.resolve(state.messageClaimResult);
          },
        };
        return chain;
      },

      select(_fields: unknown) {
        const chain = {
          from: (_t: unknown) => chain,
          where: (_w: unknown) => chain,
          limit: (_n: unknown): Promise<unknown[]> => {
            return Promise.resolve(state.messageExistsResult);
          },
          innerJoin: (_t: unknown, _c: unknown) => chain,
        };
        return chain;
      },

      insert(_table: unknown) {
        const chain = {
          values: (_v: unknown) => chain,
          returning: (): Promise<unknown[]> => Promise.resolve([{ id: "flag-id-1" }]),
        };
        return chain;
      },
    };
  }

  const db = {
    _resetCallIdx: resetCallIdx,

    select(_fields: unknown) {
      const chain = {
        from: (_t: unknown) => chain,
        innerJoin: (_t: unknown, _c: unknown) => chain,
        where: (_w: unknown) => chain,
        limit: (_n: unknown): Promise<unknown[]> => {
          // Return project data for scope-checked
          if (state.projectRow) return Promise.resolve([state.projectRow]);
          return Promise.resolve([]);
        },
        orderBy: (_col: unknown, _dir: unknown) => chain,
      };
      return chain;
    },

    transaction: vi.fn(async (cb: (trx: ReturnType<typeof makeTrxStub>) => Promise<unknown>) => {
      const trx = makeTrxStub();
      return cb(trx);
    }),

    update(_table: unknown) {
      const chain = {
        set: (_v: unknown) => chain,
        where: (_w: unknown) => chain,
        returning: (): Promise<unknown[]> => Promise.resolve([]),
      };
      return chain;
    },

    insert(_table: unknown) {
      const chain = {
        values: (_v: unknown) => chain,
        onConflictDoNothing: (_o: unknown) => chain,
        returning: (): Promise<unknown[]> => Promise.resolve(state.changeOrderInsertResult),
      };
      return chain;
    },
  };

  const scopeCheckedTrxStub = makeScopeCheckedTrxStub();

  const writeAuditLog = vi.fn(async () => {
    state.auditLogCalls += 1;
  });

  return {
    db,
    writeAuditLog,
    eq,
    and,
    isNull,
    sql,
    statementsOfWork: {},
    sowClauses: {},
    scopeFlags: {},
    changeOrders: { id: "id" },
    briefs: { id: "id", scoredAt: "scoredAt", workspaceId: "workspaceId", projectId: "projectId" },
    briefVersions: { id: "id", briefId: "briefId", versionNumber: "versionNumber" },
    deliverables: { id: "id", workspaceId: "workspaceId", aiFeedbackSummary: "aiFeedbackSummary" },
    messages: { id: "id", projectId: "projectId", status: "status" },
    projects: { id: "id", workspaceId: "workspaceId", deletedAt: "deletedAt", sowId: "sowId" },
    clients: {},
    workspaces: { id: "id", name: "name", settingsJson: "settingsJson", stripeCustomerId: "stripeCustomerId" },
  };
});

// ──────────────────────────────────────────────────────────────────
// Mock side-effect imports
// ──────────────────────────────────────────────────────────────────
vi.mock("../middleware/ai-rate-limiter.js", () => ({
  aiRateLimitMiddleware: (_key: string, _getIp: unknown) =>
    async (_c: unknown, next: () => Promise<void>) => next(),
}));

vi.mock("../jobs/scope-flag-alert.job.js", () => ({
  dispatchScopeFlagAlertJob: vi.fn(async () => undefined),
}));

vi.mock("../services/clarification-email.service.js", () => ({
  dispatchClarificationEmail: vi.fn(async () => undefined),
}));

vi.mock("../services/scope-flag.service.js", () => ({
  computeSlaDeadline: vi.fn(async () => new Date()),
}));

vi.mock("../repositories/project-intelligence.repository.js", () => ({
  logProjectEvent: vi.fn(async () => undefined),
}));

vi.mock("../services/take-rate.service.js", () => ({
  takeRateService: {
    createPaymentIntent: vi.fn(async () => ({
      paymentIntentId: "pi_test",
      takeRatePct: 0.05,
      takeRateAmountCents: 500,
    })),
  },
}));

// ──────────────────────────────────────────────────────────────────
// Build app under test — set AI_CALLBACK_SECRET before importing
// ──────────────────────────────────────────────────────────────────
process.env.AI_CALLBACK_SECRET = "test-secret";

import { aiCallbackRouter } from "./ai-callback.route.js";

const app = new Hono().route("/ai-callback", aiCallbackRouter);

const SECRET_HEADER = { "X-AI-Secret": "test-secret", "Content-Type": "application/json" };

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
function makeChangeOrderPayload(overrides: Record<string, unknown> = {}) {
  return {
    scopeFlagId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    changeOrderId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    title: "Extra work",
    totalAmountCents: 50000,
    ...overrides,
  };
}

function makeBriefScoredPayload(overrides: Record<string, unknown> = {}) {
  return {
    briefId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    score: 72,
    summary: "Looks fine",
    status: "scored",
    ...overrides,
  };
}

function makeScopeCheckedPayload(overrides: Record<string, unknown> = {}) {
  return {
    projectId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    messageId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    isDeviation: false,
    confidence: 0.3,
    reasoning: "Looks fine",
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────
describe("POST /ai-callback/change-order-generated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.scopeFlagRow = { workspaceId: "ws-1", projectId: "proj-1" };
    state.changeOrderInsertResult = [{ id: "cccccccc-cccc-cccc-cccc-cccccccccccc" }];
    state.auditLogCalls = 0;
  });

  it("returns 200 ok on first call (happy path)", async () => {
    const res = await app.fetch(
      new Request("http://localhost/ai-callback/change-order-generated", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeChangeOrderPayload()),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.changeOrderId).toBe("cccccccc-cccc-cccc-cccc-cccccccccccc");
  });

  it("returns already_processed on second call (duplicate changeOrderId)", async () => {
    // First call: INSERT succeeds
    state.changeOrderInsertResult = [{ id: "cccccccc-cccc-cccc-cccc-cccccccccccc" }];
    const res1 = await app.fetch(
      new Request("http://localhost/ai-callback/change-order-generated", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeChangeOrderPayload()),
      }),
    );
    expect(res1.status).toBe(200);
    expect((await res1.json() as Record<string, unknown>).status).toBe("ok");

    // Second call: ON CONFLICT DO NOTHING — returning returns empty array
    state.changeOrderInsertResult = [];
    const res2 = await app.fetch(
      new Request("http://localhost/ai-callback/change-order-generated", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeChangeOrderPayload()),
      }),
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.json() as Record<string, unknown>;
    expect(body2.status).toBe("already_processed");
    expect(body2.changeOrderId).toBe("cccccccc-cccc-cccc-cccc-cccccccccccc");
  });

  it("concurrent calls: both return 2xx, exactly one inserts", async () => {
    // Simulate the race: both requests enter the transaction. The first wins the
    // PK lock and gets the row back; the second's ON CONFLICT DO NOTHING returns [].
    let insertCallCount = 0;
    state.changeOrderInsertResult = [{ id: "cccccccc-cccc-cccc-cccc-cccccccccccc" }];

    // We'll intercept the second parallel call by toggling the result after the
    // first transaction callback has been invoked once.
    const { db } = await import("@novabots/db");
    const originalTransaction = db.transaction.bind(db);
    let txCount = 0;
    (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (trx: unknown) => Promise<unknown>) => {
        txCount += 1;
        // First transaction wins the insert
        if (txCount === 1) {
          insertCallCount += 1;
          state.changeOrderInsertResult = [{ id: "cccccccc-cccc-cccc-cccc-cccccccccccc" }];
        } else {
          // Second transaction: insert returns nothing (ON CONFLICT DO NOTHING)
          state.changeOrderInsertResult = [];
        }
        return originalTransaction(cb);
      },
    );

    const payload = JSON.stringify(makeChangeOrderPayload());
    const [res1, res2] = await Promise.all([
      app.fetch(
        new Request("http://localhost/ai-callback/change-order-generated", {
          method: "POST",
          headers: { ...SECRET_HEADER },
          body: payload,
        }),
      ),
      app.fetch(
        new Request("http://localhost/ai-callback/change-order-generated", {
          method: "POST",
          headers: { ...SECRET_HEADER },
          body: payload,
        }),
      ),
    ]);

    // Both must be 2xx
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const [b1, b2] = await Promise.all([
      res1.json() as Promise<Record<string, unknown>>,
      res2.json() as Promise<Record<string, unknown>>,
    ]);

    // One is ok, one is already_processed
    const statuses = [b1.status, b2.status].sort();
    expect(statuses).toEqual(["already_processed", "ok"]);
  });

  it("returns 404 when scope flag not found", async () => {
    // Scope flag lookup returns nothing
    state.scopeFlagRow = null;
    // We need to override the trx.select behaviour to return []
    const { db } = await import("@novabots/db");
    (db.transaction as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async (cb: (trx: unknown) => Promise<unknown>) => {
        const fakeTrx = {
          select: () => ({
            from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
          }),
        };
        return cb(fakeTrx);
      },
    );

    const res = await app.fetch(
      new Request("http://localhost/ai-callback/change-order-generated", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeChangeOrderPayload()),
      }),
    );

    expect(res.status).toBe(404);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toMatch(/scope flag/i);
  });
});

describe("POST /ai-callback/brief-scored", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.briefUpdateResult = [{ workspaceId: "ws-1", projectId: "proj-1" }];
    state.briefExistsResult = [];
    state.auditLogCalls = 0;
  });

  it("returns ok on first call (happy path)", async () => {
    const res = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.score).toBe(72);
  });

  it("returns already_processed on second call (idempotent UPDATE)", async () => {
    // First call: UPDATE wins (scoredAt was NULL)
    state.briefUpdateResult = [{ workspaceId: "ws-1", projectId: "proj-1" }];
    const res1 = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );
    expect(res1.status).toBe(200);

    // Second call: UPDATE returns [] (scoredAt is now NOT NULL — WHERE isNull fails)
    // and brief exists check returns a row
    state.briefUpdateResult = [];
    state.briefExistsResult = [{ id: "dddddddd-dddd-dddd-dddd-dddddddddddd" }];

    const res2 = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.json() as Record<string, unknown>;
    expect(body2.status).toBe("already_processed");
    expect(body2.briefId).toBe("dddddddd-dddd-dddd-dddd-dddddddddddd");
  });

  it("returns 404 when brief not found", async () => {
    // UPDATE returns [] and existence check also returns []
    state.briefUpdateResult = [];
    state.briefExistsResult = [];

    const res = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );
    expect(res.status).toBe(404);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toMatch(/brief not found/i);
  });
});

describe("POST /ai-callback/scope-checked — cross-workspace guard (FIND-018)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.auditLogCalls = 0;
  });

  it("returns 404 when messageId belongs to a different project (cross-workspace mismatch)", async () => {
    // Project P1 exists
    state.projectRow = {
      workspaceId: "ws-1",
      sowId: null,
      workspaceName: "AgencyCo",
    };
    // Message claim fails (message is in P2, not P1)
    state.messageClaimResult = [];
    // Message existence check also returns [] — message doesn't exist in P1
    state.messageExistsResult = [];

    const { db } = await import("@novabots/db");
    (db.transaction as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async (cb: (trx: unknown) => Promise<unknown>) => {
        // Trx stub: update(messages) returns [] (claim fails), select returns []
        const fakeTrx = {
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => Promise.resolve([]), // message not in P1
              }),
            }),
          }),
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([]), // message not found in P1
              }),
            }),
          }),
          insert: () => ({
            values: () => ({
              returning: () => Promise.resolve([{ id: "flag-1" }]),
            }),
          }),
        };
        return cb(fakeTrx);
      },
    );

    const res = await app.fetch(
      new Request("http://localhost/ai-callback/scope-checked", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(
          makeScopeCheckedPayload({
            projectId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", // P1
            messageId: "ffffffff-ffff-ffff-ffff-ffffffffffff",  // message owned by P2
          }),
        ),
      }),
    );

    expect(res.status).toBe(404);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toMatch(/message not found/i);
  });

  it("returns already_processed when message is no longer pending_check in the same project", async () => {
    state.projectRow = {
      workspaceId: "ws-1",
      sowId: null,
      workspaceName: "AgencyCo",
    };
    // Message exists in P1 but update claims 0 rows (already processed)
    state.messageClaimResult = [];
    state.messageExistsResult = [{ id: "ffffffff-ffff-ffff-ffff-ffffffffffff" }];

    const { db } = await import("@novabots/db");
    (db.transaction as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async (cb: (trx: unknown) => Promise<unknown>) => {
        const fakeTrx = {
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => Promise.resolve([]), // not pending_check
              }),
            }),
          }),
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ id: "ffffffff-ffff-ffff-ffff-ffffffffffff" }]),
              }),
            }),
          }),
        };
        return cb(fakeTrx);
      },
    );

    const res = await app.fetch(
      new Request("http://localhost/ai-callback/scope-checked", {
        method: "POST",
        headers: SECRET_HEADER,
        body: JSON.stringify(makeScopeCheckedPayload()),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe("already_processed");
  });
});

describe("FIND-016: body-size guard", () => {
  it("returns 413 when Content-Length > 5 MB", async () => {
    const res = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: {
          "X-AI-Secret": "test-secret",
          "Content-Type": "application/json",
          "Content-Length": String(6 * 1024 * 1024),
        },
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );

    expect(res.status).toBe(413);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toMatch(/body too large/i);
  });

  it("does not reject when Content-Length is exactly 5 MB", async () => {
    // 5 MB exactly should pass the guard (limit is > 5 MB)
    state.briefUpdateResult = [{ workspaceId: "ws-1", projectId: "proj-1" }];

    const res = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: {
          "X-AI-Secret": "test-secret",
          "Content-Type": "application/json",
          "Content-Length": String(5 * 1024 * 1024),
        },
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );

    // Must not be 413 — could be 200 or 400 depending on body parse
    expect(res.status).not.toBe(413);
  });
});

describe("Auth gate regression", () => {
  it("returns 401 when X-AI-Secret is missing", async () => {
    const res = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );

    expect(res.status).toBe(401);
    const body = await res.json() as Record<string, unknown>;
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when X-AI-Secret is wrong", async () => {
    const res = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AI-Secret": "wrong-secret",
        },
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("body-size guard fires AFTER auth — unauthenticated oversized request gets 401, not 413", async () => {
    // Auth check comes before the body-size middleware, so even an oversized body
    // from an unauthenticated caller must see 401 first.
    const res = await app.fetch(
      new Request("http://localhost/ai-callback/brief-scored", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(6 * 1024 * 1024),
          // No X-AI-Secret
        },
        body: JSON.stringify(makeBriefScoredPayload()),
      }),
    );

    expect(res.status).toBe(401);
  });
});
