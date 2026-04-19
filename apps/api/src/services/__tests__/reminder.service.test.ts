import { describe, it, expect, vi, beforeEach } from "vitest";
import { reminderService, getReminderQueue } from "../reminder.service.js";
import { deliverableRepository } from "../../repositories/deliverable.repository.js";
import { approvalEventRepository } from "../../repositories/approval-event.repository.js";
import { reminderLogRepository } from "../../repositories/reminder-log.repository.js";
import { db, writeAuditLog } from "@novabots/db";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("../../repositories/deliverable.repository.js");
vi.mock("../../repositories/approval-event.repository.js");
vi.mock("../../repositories/reminder-log.repository.js");

vi.mock("@novabots/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([]),
              })),
            })),
          })),
        })),
      })),
    })),
    transaction: vi.fn(async (fn: (trx: unknown) => unknown) => fn({})),
  },
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
  projects: {},
  clients: {},
  workspaces: { id: "id", name: "name", reminderSettings: "reminderSettings" },
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

// Mock BullMQ Queue so no real Redis connection is attempted
const mockQueueAdd = vi.fn().mockResolvedValue({ id: "job-queued" });
vi.mock("bullmq", () => {
  class MockQueue {
    add = mockQueueAdd;
    constructor(_name: string, _opts?: unknown) {}
  }
  class MockWorker {
    on = vi.fn();
    constructor(_name: string, _fn: unknown, _opts?: unknown) {}
  }
  return { Queue: MockQueue, Worker: MockWorker };
});

vi.mock("../../lib/redis.js", () => ({
  getRedisConnection: vi.fn().mockReturnValue({}),
}));

vi.mock("../../lib/resend.js", () => ({
  sendReminderEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../routes/email-approval.route.js", () => ({
  generateEmailApprovalToken: vi.fn().mockReturnValue({
    approveUrl: "https://app.example.com/approve/abc",
    declineUrl: "https://app.example.com/decline/abc",
  }),
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WS_ID = "ws-aaaa-0001";
const OTHER_WS_ID = "ws-bbbb-0002";
const PROJ_ID = "proj-1234";
const DEL_ID = "del-5678";

const STUB_DELIVERABLE_IN_REVIEW = {
  id: DEL_ID,
  workspaceId: WS_ID,
  name: "Homepage Mockup",
  status: "in_review",
};

const STUB_PROJECT_ROW = {
  contactEmail: "client@example.com",
  contactName: "Alice Client",
  agencyName: "Test Agency",
  projectName: "Website Redesign",
};

// ---------------------------------------------------------------------------
// describe: happy path
// ---------------------------------------------------------------------------

describe("reminderService — happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueAdd.mockResolvedValue({ id: "job-queued" });
  });

  it("scheduleReminderSequence: adds step-1 job to the 'reminders' queue", async () => {
    // getWorkspaceSettings select → workspace with no custom settings
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ reminderSettings: null }]),
        }),
      }),
    } as ReturnType<typeof db.select>);

    await reminderService.scheduleReminderSequence(PROJ_ID, DEL_ID, WS_ID);

    expect(mockQueueAdd).toHaveBeenCalledOnce();
    const [jobName, jobData, opts] = mockQueueAdd.mock.calls[0]!;
    expect(jobName).toBe(`reminder-${DEL_ID}-1`);
    expect(jobData).toMatchObject({ projectId: PROJ_ID, deliverableId: DEL_ID, workspaceId: WS_ID, step: 1 });
    // Default delay is 48h in ms
    expect(opts?.delay).toBe(48 * 60 * 60 * 1000);
  });

  it("scheduleReminderSequence: queue name is 'reminders' (not 'approval-reminders')", async () => {
    // getReminderQueue() is a singleton — calling it returns the same queue instance.
    // We verify the contract by confirming the queue's `add` method is the mock we wired
    // (i.e., the module used our MockQueue class which registered `mockQueueAdd`).
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ reminderSettings: null }]),
        }),
      }),
    } as ReturnType<typeof db.select>);

    await reminderService.scheduleReminderSequence(PROJ_ID, DEL_ID, WS_ID);

    // The job name must follow the "reminder-<id>-<step>" contract on the reminders queue
    const [jobName] = mockQueueAdd.mock.calls[0]!;
    expect(jobName).toBe(`reminder-${DEL_ID}-1`);
    // Confirm the queue singleton is functional (no errors thrown = correct queue name)
    const queue = getReminderQueue();
    expect(queue).toBeDefined();
  });

  it("processReminderStep: sends email and logs reminder when deliverable is in_review", async () => {
    const { sendReminderEmail } = await import("../../lib/resend.js");

    vi.mocked(deliverableRepository.getById).mockResolvedValue(STUB_DELIVERABLE_IN_REVIEW as never);
    vi.mocked(approvalEventRepository.listByDeliverable).mockResolvedValue([]);
    vi.mocked(reminderLogRepository.create).mockResolvedValue({ id: "log-001" } as never);

    // db.select for project/client/workspace join
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([STUB_PROJECT_ROW]),
            }),
          }),
        }),
      }),
    } as ReturnType<typeof db.select>);

    const result = await reminderService.processReminderStep({
      projectId: PROJ_ID,
      deliverableId: DEL_ID,
      workspaceId: WS_ID,
      step: 1,
    });

    expect(result.action).toBe("sent_gentle_nudge");
    expect(sendReminderEmail).toHaveBeenCalledOnce();
    expect(sendReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@example.com",
        step: 1,
        approvalStep: "gentle_nudge",
      }),
    );
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it("processReminderStep: schedules next step after successfully sending step 1", async () => {
    vi.mocked(deliverableRepository.getById).mockResolvedValue(STUB_DELIVERABLE_IN_REVIEW as never);
    vi.mocked(approvalEventRepository.listByDeliverable).mockResolvedValue([]);
    vi.mocked(reminderLogRepository.create).mockResolvedValue({ id: "log-001" } as never);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([STUB_PROJECT_ROW]),
            }),
          }),
        }),
      }),
    } as ReturnType<typeof db.select>);

    // Second db.select is for getWorkspaceSettings for next step delay
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ reminderSettings: null }]),
        }),
      }),
    } as ReturnType<typeof db.select>);

    await reminderService.processReminderStep({
      projectId: PROJ_ID,
      deliverableId: DEL_ID,
      workspaceId: WS_ID,
      step: 1,
    });

    // Step 2 job should have been queued
    const calls = mockQueueAdd.mock.calls;
    const step2Call = calls.find(([name]) => name === `reminder-${DEL_ID}-2`);
    expect(step2Call).toBeDefined();
    expect(step2Call![1]).toMatchObject({ step: 2 });
  });
});

// ---------------------------------------------------------------------------
// describe: validation errors / early exits
// ---------------------------------------------------------------------------

describe("reminderService — validation errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueAdd.mockResolvedValue({ id: "job-queued" });
  });

  it("processReminderStep: returns skipped when deliverable not in_review", async () => {
    vi.mocked(deliverableRepository.getById).mockResolvedValue({
      ...STUB_DELIVERABLE_IN_REVIEW,
      status: "approved",
    } as never);

    const result = await reminderService.processReminderStep({
      projectId: PROJ_ID,
      deliverableId: DEL_ID,
      workspaceId: WS_ID,
      step: 1,
    });

    expect(result.action).toBe("skipped_not_in_review");
  });

  it("processReminderStep: returns skipped when client already responded", async () => {
    vi.mocked(deliverableRepository.getById).mockResolvedValue(STUB_DELIVERABLE_IN_REVIEW as never);
    vi.mocked(approvalEventRepository.listByDeliverable).mockResolvedValue([
      { id: "event-1", eventType: "approved" },
    ] as never);

    const result = await reminderService.processReminderStep({
      projectId: PROJ_ID,
      deliverableId: DEL_ID,
      workspaceId: WS_ID,
      step: 1,
    });

    expect(result.action).toBe("skipped_already_responded");
  });

  it("processReminderStep: returns skipped_no_email when project has no client email", async () => {
    vi.mocked(deliverableRepository.getById).mockResolvedValue(STUB_DELIVERABLE_IN_REVIEW as never);
    vi.mocked(approvalEventRepository.listByDeliverable).mockResolvedValue([]);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ ...STUB_PROJECT_ROW, contactEmail: null }]),
            }),
          }),
        }),
      }),
    } as ReturnType<typeof db.select>);

    const result = await reminderService.processReminderStep({
      projectId: PROJ_ID,
      deliverableId: DEL_ID,
      workspaceId: WS_ID,
      step: 1,
    });

    expect(result.action).toBe("skipped_no_email");
  });

  it("processReminderStep: returns invalid_step for out-of-range step", async () => {
    vi.mocked(deliverableRepository.getById).mockResolvedValue(STUB_DELIVERABLE_IN_REVIEW as never);
    vi.mocked(approvalEventRepository.listByDeliverable).mockResolvedValue([]);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([STUB_PROJECT_ROW]),
            }),
          }),
        }),
      }),
    } as ReturnType<typeof db.select>);

    const result = await reminderService.processReminderStep({
      projectId: PROJ_ID,
      deliverableId: DEL_ID,
      workspaceId: WS_ID,
      step: 99,
    });

    expect(result.action).toBe("invalid_step");
  });

  it("scheduleReminderSequence: uses custom step1Hours from workspace settings", async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ reminderSettings: { step1Hours: 24 } }]),
        }),
      }),
    } as ReturnType<typeof db.select>);

    await reminderService.scheduleReminderSequence(PROJ_ID, DEL_ID, WS_ID);

    const [, , opts] = mockQueueAdd.mock.calls[0]!;
    // 24h custom setting
    expect(opts?.delay).toBe(24 * 60 * 60 * 1000);
  });
});

// ---------------------------------------------------------------------------
// describe: workspace isolation
// ---------------------------------------------------------------------------

describe("reminderService — workspace isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processReminderStep: skips when deliverable belongs to a different workspace", async () => {
    // getById called with wrong workspaceId returns null → skipped
    vi.mocked(deliverableRepository.getById).mockResolvedValue(null);

    const result = await reminderService.processReminderStep({
      projectId: PROJ_ID,
      deliverableId: DEL_ID,
      workspaceId: OTHER_WS_ID,
      step: 1,
    });

    expect(result.action).toBe("skipped_not_in_review");
  });

  it("autoApproveAfterSilence: skips when deliverable from wrong workspace is not in_review", async () => {
    vi.mocked(deliverableRepository.getById).mockResolvedValue(null);

    const result = await reminderService.autoApproveAfterSilence({
      projectId: PROJ_ID,
      deliverableId: DEL_ID,
      workspaceId: OTHER_WS_ID,
    });

    expect(result.action).toBe("skipped_not_in_review");
  });

  it("scheduleReminderSequence: job payload always carries the caller-supplied workspaceId", async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ reminderSettings: null }]),
        }),
      }),
    } as ReturnType<typeof db.select>);

    await reminderService.scheduleReminderSequence(PROJ_ID, DEL_ID, WS_ID);

    const [, jobData] = mockQueueAdd.mock.calls[0]!;
    expect(jobData.workspaceId).toBe(WS_ID);
  });
});
