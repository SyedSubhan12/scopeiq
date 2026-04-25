import {
  db,
  messages,
  eq,
  and,
  isNull,
  asc,
  or,
  lt,
  sql,
} from "@novabots/db";
import type { MessageAttachment } from "@novabots/db";

export interface MessageRow {
  id: string;
  projectId: string;
  workspaceId: string;
  authorType: string;
  authorId: string | null;
  authorName: string | null;
  body: string;
  attachmentsJson: MessageAttachment[] | null;
  threadId: string | null;
  readAt: Date | null;
  scopeCheckStatus: string;
  createdAt: Date;
}

export interface ListMessagesOptions {
  projectId: string;
  workspaceId: string;
  limit: number;
  cursor?: { createdAt: Date; id: string } | undefined;
}

export interface CreateMessageInput {
  workspaceId: string;
  projectId: string;
  authorId: string | null;
  authorName: string | null;
  authorType: "agency" | "client";
  body: string;
  source: "portal" | "email_forward" | "manual_input";
  threadId?: string | null;
  attachmentsJson?: MessageAttachment[] | null;
}

export const messageRepository = {
  async list(opts: ListMessagesOptions): Promise<MessageRow[]> {
    const { projectId, workspaceId, limit, cursor } = opts;

    const baseWhere = and(
      eq(messages.projectId, projectId),
      eq(messages.workspaceId, workspaceId),
    );

    const cursorWhere =
      cursor != null
        ? or(
            lt(messages.createdAt, cursor.createdAt),
            and(
              sql`${messages.createdAt} = ${cursor.createdAt}`,
              lt(messages.id, cursor.id),
            ),
          )
        : undefined;

    const where = cursorWhere != null ? and(baseWhere, cursorWhere) : baseWhere;

    const rows = await db
      .select({
        id: messages.id,
        projectId: messages.projectId,
        workspaceId: messages.workspaceId,
        authorType: messages.authorType,
        authorId: messages.authorId,
        authorName: messages.authorName,
        body: messages.body,
        attachmentsJson: messages.attachmentsJson,
        threadId: messages.threadId,
        readAt: messages.readAt,
        scopeCheckStatus: messages.scopeCheckStatus,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(where)
      .orderBy(asc(messages.createdAt))
      .limit(limit + 1);

    return rows as MessageRow[];
  },

  async findById(id: string, workspaceId: string): Promise<MessageRow | null> {
    const [row] = await db
      .select({
        id: messages.id,
        projectId: messages.projectId,
        workspaceId: messages.workspaceId,
        authorType: messages.authorType,
        authorId: messages.authorId,
        authorName: messages.authorName,
        body: messages.body,
        attachmentsJson: messages.attachmentsJson,
        threadId: messages.threadId,
        readAt: messages.readAt,
        scopeCheckStatus: messages.scopeCheckStatus,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(and(eq(messages.id, id), eq(messages.workspaceId, workspaceId)))
      .limit(1);

    return (row as MessageRow) ?? null;
  },

  async create(input: CreateMessageInput): Promise<MessageRow> {
    const values: {
      workspaceId: string;
      projectId: string;
      authorType: "agency" | "client";
      source: "portal" | "email_forward" | "manual_input";
      body: string;
      scopeCheckStatus: string;
      authorId?: string;
      authorName?: string;
      threadId?: string;
      attachmentsJson?: MessageAttachment[];
    } = {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      authorType: input.authorType,
      source: input.source,
      body: input.body,
      scopeCheckStatus: "pending",
    };

    if (input.authorId != null) values.authorId = input.authorId;
    if (input.authorName != null) values.authorName = input.authorName;
    if (input.threadId != null) values.threadId = input.threadId;
    if (input.attachmentsJson != null) values.attachmentsJson = input.attachmentsJson;

    const [row] = await db
      .insert(messages)
      .values(values)
      .returning();

    if (!row) {
      throw new Error("Failed to insert message");
    }

    return row as MessageRow;
  },

  async markRead(id: string, workspaceId: string): Promise<MessageRow | null> {
    const [row] = await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.id, id),
          eq(messages.workspaceId, workspaceId),
          isNull(messages.readAt),
        ),
      )
      .returning();

    return (row as MessageRow) ?? null;
  },
};
