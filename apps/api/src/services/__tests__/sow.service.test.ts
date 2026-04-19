import { describe, it, expect, vi, beforeEach } from "vitest";
import { sowService, parseRevisionLimitFromText } from "../sow.service.js";
import { db, writeAuditLog } from "@novabots/db";
import { NotFoundError, ValidationError } from "@novabots/types";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@novabots/db", () => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  // Chain builder used by db.select().from().where().limit()
  const chain = () => ({
    from: () => chain(),
    where: () => chain(),
    limit: () => Promise.resolve([]),
    orderBy: () => Promise.resolve([]),
    then: (fn: (v: unknown[]) => unknown) => Promise.resolve([]).then(fn),
  });

  return {
    db: {
      select: vi.fn(() => chain()),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => Promise.resolve([])) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })) })),
      delete: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
      transaction: vi.fn(async (fn: (trx: unknown) => unknown) => fn({})),
    },
    writeAuditLog: vi.fn().mockResolvedValue(undefined),
    // Table / column exports used by sow.service.ts
    projects: { id: "id", workspaceId: "workspaceId", sowId: "sowId", deletedAt: "deletedAt" },
    statementsOfWork: { id: "id", workspaceId: "workspaceId", deletedAt: "deletedAt", status: "status" },
    sowClauses: { sowId: "sowId", sortOrder: "sortOrder", clauseType: "clauseType" },
    eq: vi.fn((a, b) => ({ _op: "eq", a, b })),
    and: vi.fn((...args) => ({ _op: "and", args })),
    isNull: vi.fn((col) => ({ _op: "isNull", col })),
    gt: vi.fn((col, val) => ({ _op: "gt", col, val })),
    desc: vi.fn((col) => ({ _op: "desc", col })),
  };
});

vi.mock("../../jobs/parse-sow.job.js", () => ({
  dispatchParseSowJob: vi.fn().mockResolvedValue("job-id-001"),
}));

vi.mock("../../lib/storage.js", () => ({
  getDownloadUrl: vi.fn().mockResolvedValue("https://storage.example.com/signed"),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WS_ID = "ws-aaaa-0001";
const OTHER_WS_ID = "ws-bbbb-0002";
const ACTOR_ID = "user-xxxx";
const SOW_ID = "sow-1111-2222";
const PROJ_ID = "proj-3333-4444";

const STUB_SOW = {
  id: SOW_ID,
  workspaceId: WS_ID,
  title: "Website Redesign SOW",
  status: "draft",
  fileUrl: null,
  fileKey: null,
  fileSizeBytes: null,
  parsedTextPreview: null,
  parsedAt: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Make db.select() resolve with a single row on the first call only. */
function stubSelectOnce(row: unknown) {
  const chainWithRow = () => ({
    from: () => chainWithRow(),
    where: () => chainWithRow(),
    limit: () => Promise.resolve([row]),
    orderBy: () => Promise.resolve([row]),
    then: (fn: (v: unknown[]) => unknown) => Promise.resolve([row]).then(fn),
  });
  vi.mocked(db.select).mockReturnValueOnce(chainWithRow() as ReturnType<typeof db.select>);
}

function stubSelectEmpty() {
  const chainEmpty = () => ({
    from: () => chainEmpty(),
    where: () => chainEmpty(),
    limit: () => Promise.resolve([]),
    orderBy: () => Promise.resolve([]),
    then: (fn: (v: unknown[]) => unknown) => Promise.resolve([]).then(fn),
  });
  vi.mocked(db.select).mockReturnValueOnce(chainEmpty() as ReturnType<typeof db.select>);
}

// ---------------------------------------------------------------------------
// describe: happy path
// ---------------------------------------------------------------------------

describe("sowService — happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create: inserts sow, links project, writes audit log, and returns sow with clauses", async () => {
    // First select resolves with the project; transaction inserts sow + clauses
    stubSelectOnce({ id: PROJ_ID, sowId: null });

    vi.mocked(db.transaction).mockImplementationOnce(async (fn) => {
      // Simulate trx.insert().values().returning() -> [STUB_SOW]
      const trx = {
        insert: vi.fn(() => ({
          values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([STUB_SOW]) })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
        })),
        delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      };
      return fn(trx);
    });

    const result = await sowService.create(WS_ID, ACTOR_ID, {
      projectId: PROJ_ID,
      title: "Website Redesign SOW",
    });

    expect(result.id).toBe(SOW_ID);
    expect(result.title).toBe("Website Redesign SOW");
    expect(Array.isArray(result.clauses)).toBe(true);
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "create", entityType: "statement_of_work" }),
    );
  });

  it("getById: returns sow with clauses array when found", async () => {
    // First select for the SOW itself
    stubSelectOnce(STUB_SOW);
    // Second select for clauses
    const chainClauses = () => ({
      from: () => chainClauses(),
      where: () => chainClauses(),
      orderBy: () => Promise.resolve([{ id: "clause-1", clauseType: "deliverable", originalText: "Build portal" }]),
    });
    vi.mocked(db.select).mockReturnValueOnce(chainClauses() as ReturnType<typeof db.select>);

    const result = await sowService.getById(WS_ID, SOW_ID);

    expect(result.id).toBe(SOW_ID);
    expect(Array.isArray(result.clauses)).toBe(true);
    expect(result.clauses).toHaveLength(1);
    expect(result.clauses[0]!.clauseType).toBe("deliverable");
  });

  it("parseRevisionLimitFromText: parses canonical '2 rounds of revisions'", () => {
    expect(parseRevisionLimitFromText("Client is entitled to 2 rounds of revisions.")).toBe(2);
  });

  it("parseRevisionLimitFromText: parses '5 revisions' phrase", () => {
    expect(parseRevisionLimitFromText("Up to 5 revisions are included in scope.")).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// describe: validation errors
// ---------------------------------------------------------------------------

describe("sowService — validation errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create: throws NotFoundError when project does not exist", async () => {
    stubSelectEmpty();

    await expect(
      sowService.create(WS_ID, ACTOR_ID, { projectId: "nonexistent-proj", title: "Test" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("getById: throws NotFoundError when SOW does not exist", async () => {
    stubSelectEmpty();

    await expect(sowService.getById(WS_ID, "nonexistent-sow")).rejects.toThrow(NotFoundError);
  });

  it("parseRevisionLimitFromText: returns null for empty string", () => {
    expect(parseRevisionLimitFromText("")).toBeNull();
  });

  it("parseRevisionLimitFromText: returns null when no revision clause present", () => {
    expect(parseRevisionLimitFromText("Standard terms and conditions apply.")).toBeNull();
  });

  it("parseRevisionLimitFromText: returns null for zero rounds (0 not > 0)", () => {
    expect(parseRevisionLimitFromText("0 rounds of revisions")).toBeNull();
  });

  it("parseRevisionLimitFromText: returns null for value >= 100", () => {
    expect(parseRevisionLimitFromText("1000 revisions included")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describe: workspace isolation
// ---------------------------------------------------------------------------

describe("sowService — workspace isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getById: throws NotFoundError when sowId exists but belongs to different workspace", async () => {
    // The service filters by workspaceId — wrong ws → empty result
    stubSelectEmpty();

    await expect(sowService.getById(OTHER_WS_ID, SOW_ID)).rejects.toThrow(NotFoundError);
  });

  it("create: throws NotFoundError when project belongs to different workspace", async () => {
    // Project exists but workspaceId filter excludes it
    stubSelectEmpty();

    await expect(
      sowService.create(OTHER_WS_ID, ACTOR_ID, { projectId: PROJ_ID, title: "Cross-WS SOW" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("update: throws NotFoundError when updating SOW from wrong workspace", async () => {
    stubSelectEmpty();

    await expect(
      sowService.update(OTHER_WS_ID, ACTOR_ID, SOW_ID, { title: "Hijacked" }),
    ).rejects.toThrow(NotFoundError);
  });
});
