import { db, projects, clients, eq, and, isNull, desc, gt } from "@novabots/db";
import type { NewProject } from "@novabots/db";

export const projectRepository = {
  async list(
    workspaceId: string,
    options: { status?: string; clientId?: string; cursor?: string; limit?: number },
  ) {
    const limit = options.limit ?? 20;
    const conditions = [
      eq(projects.workspaceId, workspaceId),
      isNull(projects.deletedAt),
    ];
    if (options.status) {
      conditions.push(eq(projects.status, options.status as typeof projects.status.enumValues[number]));
    }
    if (options.clientId) {
      conditions.push(eq(projects.clientId, options.clientId));
    }
    if (options.cursor) {
      conditions.push(gt(projects.id, options.cursor));
    }

    const results = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        budget: projects.budget,
        currency: projects.currency,
        startDate: projects.startDate,
        endDate: projects.endDate,
        portalToken: projects.portalToken,
        createdAt: projects.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
        },
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt))
      .limit(limit + 1);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return {
      data,
      pagination: {
        next_cursor: hasMore ? data[data.length - 1]!.id : null,
        has_more: hasMore,
      },
    };
  },

  async getById(workspaceId: string, projectId: string) {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.workspaceId, workspaceId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);
    return project ?? null;
  },

  async create(data: NewProject) {
    const [project] = await db.insert(projects).values(data).returning();
    return project!;
  },

  async update(workspaceId: string, projectId: string, data: Partial<NewProject>) {
    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.workspaceId, workspaceId),
          isNull(projects.deletedAt),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async softDelete(workspaceId: string, projectId: string) {
    const [deleted] = await db
      .update(projects)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.workspaceId, workspaceId),
          isNull(projects.deletedAt),
        ),
      )
      .returning();
    return deleted ?? null;
  },
};
