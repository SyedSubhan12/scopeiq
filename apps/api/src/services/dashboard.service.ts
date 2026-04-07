import { db, projects, deliverables, scopeFlags, auditLog, users, clients, eq, and, isNull, desc, count, sql, inArray } from "@novabots/db";
import { billingService } from "./billing.service.js";

export interface DashboardMetrics {
  activeProjects: number;
  awaitingApproval: number;
  pendingScopeFlags: number;
  mrr: number;
}

export interface UrgentFlag {
  id: string;
  projectId: string;
  projectName: string | null;
  severity: string;
  title: string;
  description: string | null;
  createdAt: Date;
}

export interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string | null;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface DeadlineEntry {
  projectId: string;
  projectName: string;
  endDate: Date | string | null;
  daysRemaining: number;
  clientId: string | null;
  clientName: string | null;
}

export interface DashboardOverview {
  greeting: string;
  metrics: DashboardMetrics;
  urgentFlags: UrgentFlag[];
  recentActivity: ActivityEntry[];
  upcomingDeadlines: DeadlineEntry[];
}

function buildGreeting(name: string | null): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${timeOfDay}, ${name}` : timeOfDay;
}

async function getActiveProjects(workspaceId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(projects)
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.status, "active"),
        isNull(projects.deletedAt),
      ),
    );
  return Number(result[0]?.count ?? 0);
}

async function getAwaitingApproval(workspaceId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(deliverables)
    .where(
      and(
        eq(deliverables.workspaceId, workspaceId),
        eq(deliverables.status, "in_review"),
        isNull(deliverables.deletedAt),
      ),
    );
  return Number(result[0]?.count ?? 0);
}

async function getPendingScopeFlags(workspaceId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(scopeFlags)
    .where(
      and(
        eq(scopeFlags.workspaceId, workspaceId),
        eq(scopeFlags.status, "pending"),
      ),
    );
  return Number(result[0]?.count ?? 0);
}

async function getMRR(workspaceId: string): Promise<number> {
  return billingService.getMonthlyRecurringRevenue(workspaceId);
}

async function getUrgentFlags(workspaceId: string): Promise<UrgentFlag[]> {
  const flags = await db
    .select({
      id: scopeFlags.id,
      projectId: scopeFlags.projectId,
      severity: scopeFlags.severity,
      title: scopeFlags.title,
      description: scopeFlags.description,
      createdAt: scopeFlags.createdAt,
    })
    .from(scopeFlags)
    .where(
      and(
        eq(scopeFlags.workspaceId, workspaceId),
        eq(scopeFlags.status, "pending"),
      ),
    )
    .orderBy(
      sql`CASE WHEN ${scopeFlags.severity} = 'high' THEN 0 WHEN ${scopeFlags.severity} = 'medium' THEN 1 ELSE 2 END`,
      desc(scopeFlags.createdAt),
    )
    .limit(3);

  if (flags.length === 0) return [];

  const projectIds = flags.map((f) => f.projectId).filter(Boolean) as string[];
  const projectsMap = new Map<string, string | null>();

  if (projectIds.length > 0) {
    const projectResults = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(and(inArray(projects.id, projectIds), isNull(projects.deletedAt)));

    for (const p of projectResults) {
      projectsMap.set(p.id, p.name);
    }
  }

  return flags.map((flag) => ({
    id: flag.id,
    projectId: flag.projectId,
    projectName: projectsMap.get(flag.projectId) ?? null,
    severity: flag.severity,
    title: flag.title,
    description: flag.description,
    createdAt: flag.createdAt,
  }));
}

async function getRecentActivity(workspaceId: string): Promise<ActivityEntry[]> {
  const activities = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      actorId: auditLog.actorId,
      createdAt: auditLog.createdAt,
      metadata: auditLog.metadataJson,
    })
    .from(auditLog)
    .where(eq(auditLog.workspaceId, workspaceId))
    .orderBy(desc(auditLog.createdAt))
    .limit(10);

  if (activities.length === 0) return [];

  const actorIds = [...new Set(
    activities.map((a) => a.actorId).filter((id): id is string => id !== null),
  )];

  const actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const userResults = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, actorIds));

    for (const u of userResults) {
      actorMap.set(u.id, u.fullName);
    }
  }

  return activities.map((entry) => ({
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    actorName: entry.actorId ? actorMap.get(entry.actorId) ?? null : null,
    createdAt: entry.createdAt,
    metadata: (entry.metadata as Record<string, unknown>) ?? {},
  }));
}

async function getUpcomingDeadlines(workspaceId: string): Promise<DeadlineEntry[]> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      endDate: projects.endDate,
      clientId: projects.clientId,
    })
    .from(projects)
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.status, "active"),
        isNull(projects.deletedAt),
      ),
    )
    .orderBy(projects.endDate);

  // Filter in JS for date range (endDate is a string/date column)
  const filtered = results.filter((r) => {
    if (!r.endDate) return false;
    const end = new Date(r.endDate);
    return end > now && end <= sevenDaysFromNow;
  });

  if (filtered.length === 0) return [];

  const clientIds = [...new Set(
    filtered.map((r) => r.clientId).filter((id): id is string => id !== null),
  )];

  const clientMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const clientResults = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(inArray(clients.id, clientIds));

    for (const c of clientResults) {
      clientMap.set(c.id, c.name);
    }
  }

  const deadlines: DeadlineEntry[] = [];

  for (const row of filtered) {
    if (!row.endDate) continue;

    deadlines.push({
      projectId: row.projectId,
      projectName: row.projectName,
      endDate: row.endDate,
      daysRemaining: Math.ceil((new Date(row.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      clientId: row.clientId,
      clientName: row.clientId ? clientMap.get(row.clientId) ?? null : null,
    });
  }

  return deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export const dashboardService = {
  async getDashboardOverview(workspaceId: string, userId: string): Promise<DashboardOverview> {
    // 1. Get user for greeting
    const userResult = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userName = userResult[0]?.fullName ?? null;
    const greeting = buildGreeting(userName);

    // 2. Get metrics (parallel queries for performance)
    const [activeProjects, awaitingApproval, pendingScopeFlags, mrr] = await Promise.all([
      getActiveProjects(workspaceId),
      getAwaitingApproval(workspaceId),
      getPendingScopeFlags(workspaceId),
      getMRR(workspaceId),
    ]);

    // 3. Get urgent flags
    const urgentFlags = await getUrgentFlags(workspaceId);

    // 4. Get recent activity
    const recentActivity = await getRecentActivity(workspaceId);

    // 5. Get upcoming deadlines
    const upcomingDeadlines = await getUpcomingDeadlines(workspaceId);

    return {
      greeting,
      metrics: { activeProjects, awaitingApproval, pendingScopeFlags, mrr },
      urgentFlags,
      recentActivity,
      upcomingDeadlines,
    };
  },
};
