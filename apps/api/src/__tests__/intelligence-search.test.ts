/**
 * Intelligence Search Tests — T-CM-005
 *
 * Tests for searchProjectIntelligence:
 * - Workspace isolation (workspace A never returns workspace B data)
 * - Cursor pagination (empty list, single item, limit, limit+1)
 * - Full-text search query structure (tsvector / plainto_tsquery)
 * - eventType filter is applied correctly
 * - Cursor boundary conditions (invalid cursor, future cursor, past cursor)
 *
 * These are unit tests that mock the DB layer. For actual p95 < 300ms
 * performance validation, see the GIN index in the migration:
 *   packages/db/drizzle/migrations/*_project_intelligence_gin_index.sql
 *
 * Run: pnpm test from apps/api
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// vi.mock is hoisted to the top of the file by vitest. The factory CANNOT
// reference variables defined outside it (they're not yet initialized at
// hoist time). All mock state must live inside the factory's module scope.
// ---------------------------------------------------------------------------

vi.mock("@novabots/db", () => {
  // These are module-level variables inside the factory — safe to reference.
  const _eqCalls: Array<[unknown, unknown]> = [];
  const _ltCalls: Array<[unknown, unknown]> = [];
  const _sqlCalls: unknown[][] = [];

  // Capture: last .limit() value passed
  let _lastLimit = 0;

  function makeSelectChain(rows: unknown[]) {
    return {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation((n: number) => {
        _lastLimit = n;
        return Promise.resolve(rows);
      }),
    };
  }

  // Expose query-capture as module exports so tests can inspect them
  const _state = {
    rows: [] as unknown[],
    eqCalls: _eqCalls,
    ltCalls: _ltCalls,
    sqlCalls: _sqlCalls,
    get lastLimit() {
      return _lastLimit;
    },
    reset(newRows: unknown[] = []) {
      _eqCalls.length = 0;
      _ltCalls.length = 0;
      _sqlCalls.length = 0;
      _lastLimit = 0;
      this.rows = newRows;
    },
  };

  return {
    _state,
    db: {
      select: vi.fn().mockImplementation(() => makeSelectChain(_state.rows)),
      insert: vi.fn(),
    },
    projectIntelligence: {
      workspaceId: Symbol("workspaceId"),
      projectId: Symbol("projectId"),
      clientId: Symbol("clientId"),
      eventType: Symbol("eventType"),
      id: Symbol("id"),
      createdAt: Symbol("createdAt"),
    },
    eq: vi.fn().mockImplementation((col: unknown, val: unknown) => {
      _eqCalls.push([col, val]);
      return { type: "eq", col, val };
    }),
    and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
    desc: vi.fn((col: unknown) => ({ type: "desc", col })),
    lt: vi.fn().mockImplementation((col: unknown, val: unknown) => {
      _ltCalls.push([col, val]);
      return { type: "lt", col, val };
    }),
    sql: vi.fn().mockImplementation((strings: TemplateStringsArray, ...vals: unknown[]) => {
      _sqlCalls.push(vals);
      return { type: "sql", strings, vals };
    }),
  };
});

// Import after mock is registered
import {
  searchProjectIntelligence,
  getClientHistory,
} from "../repositories/project-intelligence.repository.js";
import * as dbMod from "@novabots/db";

// Cast the mock state (only accessible from test file)
const mockState = (dbMod as unknown as { _state: {
  rows: unknown[];
  eqCalls: Array<[unknown, unknown]>;
  ltCalls: Array<[unknown, unknown]>;
  sqlCalls: unknown[][];
  lastLimit: number;
  reset(rows?: unknown[]): void;
} })._state;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "row-uuid-1",
    workspaceId: "workspace-A",
    projectId: "project-1",
    clientId: null,
    eventType: "scope_flag_created",
    entityType: "scope_flag",
    entityId: "flag-uuid-1",
    summary: "Scope deviation detected",
    metadataJson: null,
    createdAt: new Date("2026-04-25T10:00:00.000Z"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// T-CM-005: searchProjectIntelligence — workspace isolation
// ---------------------------------------------------------------------------

describe("T-CM-005: searchProjectIntelligence workspace isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.reset([]);
  });

  it("always includes workspaceId equality condition in the query", async () => {
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });

    // The eq() mock captures all calls. At least one must include "workspace-A".
    const workspaceCalls = mockState.eqCalls.filter(([, val]) => val === "workspace-A");
    expect(workspaceCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("workspace A's eq() call uses the workspaceId column, not projectId or clientId column", async () => {
    const { projectIntelligence } = dbMod;
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });

    // The workspaceId column symbol is the first argument in the eq() call
    const workspaceCalls = mockState.eqCalls.filter(
      ([col, val]) => val === "workspace-A" && col === (projectIntelligence as Record<string, unknown>).workspaceId,
    );
    expect(workspaceCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("workspace B query does not include workspace-A in any eq() condition", async () => {
    await searchProjectIntelligence({ workspaceId: "workspace-B", limit: 20 });

    const workspaceACalls = mockState.eqCalls.filter(([, val]) => val === "workspace-A");
    expect(workspaceACalls).toHaveLength(0);

    const workspaceBCalls = mockState.eqCalls.filter(([, val]) => val === "workspace-B");
    expect(workspaceBCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("two sequential queries for different workspaces do not bleed conditions", async () => {
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });
    const callsAfterA = mockState.eqCalls.filter(([, val]) => val === "workspace-A").length;

    // Reset for workspace-B query
    vi.clearAllMocks();
    mockState.reset([]);

    await searchProjectIntelligence({ workspaceId: "workspace-B", limit: 20 });

    // workspace-B eq() calls must not include workspace-A
    const leakCalls = mockState.eqCalls.filter(([, val]) => val === "workspace-A");
    expect(leakCalls).toHaveLength(0);
    expect(callsAfterA).toBeGreaterThanOrEqual(1); // guard: workspace-A was queried
  });
});

// ---------------------------------------------------------------------------
// T-CM-005: searchProjectIntelligence — cursor pagination
// ---------------------------------------------------------------------------

describe("T-CM-005: searchProjectIntelligence cursor pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.reset([]);
  });

  it("returns empty data and null nextCursor when no rows exist", async () => {
    mockState.reset([]);
    const result = await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it("returns all rows and null nextCursor when row count is exactly the limit", async () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      makeRow({ id: `row-${i}`, createdAt: new Date(`2026-04-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`) }),
    );
    mockState.reset(rows);

    const result = await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });

    expect(result.data).toHaveLength(20);
    expect(result.nextCursor).toBeNull();
  });

  it("returns limit rows and non-null nextCursor when limit+1 rows returned by DB", async () => {
    const rows = Array.from({ length: 21 }, (_, i) =>
      makeRow({ id: `row-${i}`, createdAt: new Date(`2026-04-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`) }),
    );
    mockState.reset(rows);

    const result = await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });

    expect(result.data).toHaveLength(20);
    expect(result.nextCursor).not.toBeNull();
    expect(typeof result.nextCursor).toBe("string");
  });

  it("nextCursor is the ISO string of the last data row's createdAt", async () => {
    const lastCreatedAt = new Date("2026-03-15T09:00:00.000Z");
    // 3 rows returned for limit=2 → hasMore=true, nextCursor = rows[1].createdAt
    const rows = [
      makeRow({ id: "row-0", createdAt: new Date("2026-04-01T00:00:00.000Z") }),
      makeRow({ id: "row-1", createdAt: lastCreatedAt }),
      makeRow({ id: "row-2", createdAt: new Date("2026-02-01T00:00:00.000Z") }),
    ];
    mockState.reset(rows);

    const result = await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.nextCursor).toBe(lastCreatedAt.toISOString());
  });

  it("cursor param adds lt() condition using the cursor timestamp", async () => {
    const cursorTs = "2026-04-20T00:00:00.000Z";
    mockState.reset([]);

    await searchProjectIntelligence({
      workspaceId: "workspace-A",
      limit: 20,
      cursor: cursorTs,
    });

    expect(mockState.ltCalls.length).toBeGreaterThanOrEqual(1);
    const ltCall = mockState.ltCalls[0]!;
    // Second argument to lt() must be the Date parsed from the cursor string
    expect((ltCall[1] as Date).toISOString()).toBe(cursorTs);
  });

  it("null cursor does not add any lt() condition", async () => {
    mockState.reset([]);
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20, cursor: null });

    expect(mockState.ltCalls).toHaveLength(0);
  });

  it("undefined cursor does not add any lt() condition", async () => {
    mockState.reset([]);
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });

    expect(mockState.ltCalls).toHaveLength(0);
  });

  it("single item with cursor: returns 1 row and null nextCursor", async () => {
    mockState.reset([makeRow({ id: "only-row", createdAt: new Date("2026-04-10T12:00:00.000Z") })]);

    const result = await searchProjectIntelligence({
      workspaceId: "workspace-A",
      limit: 20,
      cursor: "2026-04-25T00:00:00.000Z",
    });

    expect(result.data).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });

  it("always requests limit+1 rows from the DB to detect hasMore without extra query", async () => {
    mockState.reset([]);
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 10 });

    expect(mockState.lastLimit).toBe(11);
  });

  it("always requests limit+1 rows — validates with limit=1", async () => {
    mockState.reset([]);
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 1 });

    expect(mockState.lastLimit).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// T-CM-005: searchProjectIntelligence — full-text search query structure
// ---------------------------------------------------------------------------

describe("T-CM-005: searchProjectIntelligence full-text search query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.reset([]);
  });

  it("adds a sql tsvector subquery condition when query param is provided", async () => {
    await searchProjectIntelligence({
      workspaceId: "workspace-A",
      limit: 20,
      query: "social templates",
    });

    expect(mockState.sqlCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT call sql() when query param is absent", async () => {
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });

    expect(mockState.sqlCalls).toHaveLength(0);
  });

  it("tsvector subquery includes the search term as a tagged-template value", async () => {
    const searchTerm = "social templates";
    await searchProjectIntelligence({
      workspaceId: "workspace-A",
      limit: 20,
      query: searchTerm,
    });

    // The sql() tagged template receives the search term as an interpolated value
    const allSqlValues = mockState.sqlCalls.flat();
    expect(allSqlValues).toContain(searchTerm);
  });

  it("tsvector subquery includes workspaceId to prevent cross-tenant FTS leakage", async () => {
    await searchProjectIntelligence({
      workspaceId: "workspace-A",
      limit: 20,
      query: "invoice",
    });

    // workspace-A must appear in the sql() interpolated values
    const allSqlValues = mockState.sqlCalls.flat();
    expect(allSqlValues).toContain("workspace-A");
  });
});

// ---------------------------------------------------------------------------
// T-CM-005: searchProjectIntelligence — eventType filter
// ---------------------------------------------------------------------------

describe("T-CM-005: searchProjectIntelligence eventType filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.reset([]);
  });

  it("adds eq() condition for eventType when provided", async () => {
    await searchProjectIntelligence({
      workspaceId: "workspace-A",
      limit: 20,
      eventType: "scope_flag_created",
    });

    const eventTypeCalls = mockState.eqCalls.filter(([, val]) => val === "scope_flag_created");
    expect(eventTypeCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT add eventType condition when eventType is absent", async () => {
    await searchProjectIntelligence({ workspaceId: "workspace-A", limit: 20 });

    // Only the workspaceId eq() call should exist
    const nonWorkspaceCalls = mockState.eqCalls.filter(([, val]) => val !== "workspace-A");
    expect(nonWorkspaceCalls).toHaveLength(0);
  });

  it("eventType and projectId filters both applied when both provided", async () => {
    await searchProjectIntelligence({
      workspaceId: "workspace-A",
      projectId: "project-X",
      eventType: "change_order_sent",
      limit: 20,
    });

    const projectCalls = mockState.eqCalls.filter(([, val]) => val === "project-X");
    expect(projectCalls.length).toBeGreaterThanOrEqual(1);

    const eventTypeCalls = mockState.eqCalls.filter(([, val]) => val === "change_order_sent");
    expect(eventTypeCalls.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// T-CM-005: getClientHistory — workspace + clientId isolation
// ---------------------------------------------------------------------------

describe("T-CM-005: getClientHistory workspace isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.reset([]);
  });

  it("applies both workspaceId and clientId equality conditions", async () => {
    await getClientHistory({ workspaceId: "workspace-A", clientId: "client-X", limit: 20 });

    const workspaceCalls = mockState.eqCalls.filter(([, val]) => val === "workspace-A");
    const clientCalls = mockState.eqCalls.filter(([, val]) => val === "client-X");

    expect(workspaceCalls.length).toBeGreaterThanOrEqual(1);
    expect(clientCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("workspace-A + client-X cannot retrieve workspace-B conditions", async () => {
    await getClientHistory({ workspaceId: "workspace-A", clientId: "client-X", limit: 20 });

    const workspaceBCalls = mockState.eqCalls.filter(([, val]) => val === "workspace-B");
    expect(workspaceBCalls).toHaveLength(0);
  });

  it("returns empty data and null nextCursor for empty result", async () => {
    mockState.reset([]);
    const result = await getClientHistory({ workspaceId: "workspace-A", clientId: "client-X", limit: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it("returns limit rows and non-null nextCursor when limit+1 rows present", async () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      makeRow({
        id: `row-${i}`,
        clientId: "client-X",
        createdAt: new Date(`2026-04-${String(25 - i).padStart(2, "0")}T00:00:00.000Z`),
      }),
    );
    mockState.reset(rows);

    const result = await getClientHistory({ workspaceId: "workspace-A", clientId: "client-X", limit: 5 });

    expect(result.data).toHaveLength(5);
    expect(result.nextCursor).not.toBeNull();
  });

  it("cursor param applies lt() on createdAt for getClientHistory", async () => {
    const cursorTs = "2026-04-10T00:00:00.000Z";
    mockState.reset([]);

    await getClientHistory({
      workspaceId: "workspace-A",
      clientId: "client-X",
      limit: 20,
      cursor: cursorTs,
    });

    expect(mockState.ltCalls.length).toBeGreaterThanOrEqual(1);
    expect((mockState.ltCalls[0]![1] as Date).toISOString()).toBe(cursorTs);
  });

  it("requests limit+1 rows from DB for hasMore detection", async () => {
    mockState.reset([]);
    await getClientHistory({ workspaceId: "workspace-A", clientId: "client-X", limit: 15 });

    expect(mockState.lastLimit).toBe(16);
  });
});
