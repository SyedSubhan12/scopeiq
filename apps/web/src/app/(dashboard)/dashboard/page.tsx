"use client";

import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  Plus,
  AlertCircle,
  History,
} from "lucide-react";
import { MetricCard, Card, Badge, Button, Skeleton, Avatar } from "@novabots/ui";
import { useProjects } from "@/hooks/useProjects";
import { useScopeFlagCount, useScopeFlags } from "@/hooks/useScopeFlags";
import { useChangeOrderCount } from "@/hooks/useChangeOrders";
import { useAuditLog } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { PortfolioHealth } from "@/components/analytics/PortfolioHealth";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const { data: projectsData, isLoading: loadingProjects } = useProjects({ limit: 5 });
  const { data: flagCountData, isLoading: loadingFlags } = useScopeFlagCount();
  const { data: coCountData, isLoading: loadingCOs } = useChangeOrderCount();
  const { data: auditLogData, isLoading: loadingAudit } = useAuditLog({ limit: 8 });
  const { data: priorityFlagsData } = useScopeFlags();
  const workspaceId = useWorkspaceStore((s) => s.id);
  const { user } = useAuth();

  const projects = projectsData?.data ?? [];
  const auditLogs = auditLogData?.data ?? [];
  const priorityFlags = (priorityFlagsData?.data ?? [])
    .filter((f: any) => f.status === "pending_review")
    .slice(0, 3);

  const activeProjects = projects.filter(
    (p: { status: string }) => p.status === "active",
  ).length;

  const isLoading = loadingProjects || loadingFlags || loadingCOs || loadingAudit;

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            {greeting}{fullName ? `, ${fullName}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Portfolio Intelligence */}
      {workspaceId && <PortfolioHealth workspaceId={workspaceId} />}

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <MetricCard label="Active Projects" value={activeProjects} />
            <MetricCard label="Active Flags" value={flagCountData?.data?.count ?? 0} />
            <MetricCard label="Pending COs" value={coCountData?.data?.count ?? 0} />
            <MetricCard label="Active Projects" value={activeProjects} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Col: Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[rgb(var(--text-primary))]">
                <History className="h-5 w-5 text-primary" />
                Recent Activity
              </h2>
              <Link href="/activity" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>

            <Card className="divide-y divide-[rgb(var(--border-subtle))] p-0 overflow-hidden">
              {loadingAudit ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-[rgb(var(--surface-subtle))] transition-colors">
                    <Avatar name={log.actorId || "System"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[rgb(var(--text-primary))]">
                        <span className="font-semibold">User</span> {log.action === "create" ? "created" : "updated"} a {log.entityType.replace("_", " ")}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 truncate">
                        ID: {log.entityId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[rgb(var(--text-muted))] whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[rgb(var(--text-muted))]">
                  No recent activity found.
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Right Col: High-Priority Flags & Deadlines */}
        <div className="space-y-8">
          {/* Priority Flags */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[rgb(var(--text-primary))]">
              <ShieldAlert className="h-5 w-5 text-status-red" />
              Priority Flags
            </h2>
            <div className="space-y-3">
              {priorityFlags.length > 0 ? (
                priorityFlags.map((flag: any) => (
                  <Link key={flag.id} href={`/projects/${flag.projectId}/scope`}>
                    <Card hoverable className="border-l-4 border-l-status-red p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">
                            {flag.reason}
                          </p>
                          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                            Project ID: {flag.projectId.slice(0, 8)}
                          </p>
                        </div>
                        <Badge status="flagged" className="shrink-0">{flag.severity}</Badge>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="py-6 text-center text-sm text-[rgb(var(--text-muted))]">
                  All clear! No pending flags.
                </Card>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="mb-4 text-base font-semibold text-[rgb(var(--text-primary))]">
              Resources
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/briefs">
                <Card hoverable className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Brief Templates</p>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">Manage intake forms</p>
                  </div>
                </Card>
              </Link>
              <Link href="/settings">
                <Card hoverable className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Compliance Guard</p>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">Setup guardrails</p>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


