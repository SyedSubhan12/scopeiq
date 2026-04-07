"use client";

import { useState } from "react";
import { BarChart2, TrendingUp, ShieldAlert, FileText, FolderKanban, Package } from "lucide-react";
import { Card, Skeleton, Badge } from "@novabots/ui";
import { PortfolioHealth } from "@/components/analytics/PortfolioHealth";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getChangeOrdersQueryOptions } from "@/hooks/change-orders";
import { getWorkspaceTimelineQueryOptions } from "@/hooks/useProjectHealth";
import { getProjectsQueryOptions } from "@/hooks/useProjects";
import { queryClient } from "@/lib/query-client";
import { getScopeFlagsQueryOptions } from "@/hooks/useScopeFlags";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useProjects } from "@/hooks/useProjects";
import { useScopeFlags } from "@/hooks/useScopeFlags";
import { useWorkspaceTimeline } from "@/hooks/useProjectHealth";
import { useChangeOrders } from "@/hooks/change-orders";

type Range = "7d" | "30d" | "90d" | "all";

const RANGE_LABELS: { value: Range; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  draft: "bg-gray-400",
  paused: "bg-amber-500",
  completed: "bg-blue-500",
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--border-subtle))]">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-medium text-[rgb(var(--text-secondary))]">{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  useAssetsReady({
    scopeId: "page:analytics",
    tasks: [
      () => queryClient.ensureQueryData(getProjectsQueryOptions()),
      () => queryClient.ensureQueryData(getScopeFlagsQueryOptions()),
      () => queryClient.ensureQueryData(getWorkspaceTimelineQueryOptions()),
      () => queryClient.ensureQueryData(getChangeOrdersQueryOptions()),
    ],
  });

  const [range, setRange] = useState<Range>("30d");
  const workspaceId = useWorkspaceStore((s) => s.id);
  const { data: projectsData, isLoading: loadingProjects } = useProjects();
  const { data: flagsData, isLoading: loadingFlags } = useScopeFlags();
  const { data: timelineData, isLoading: loadingTimeline } = useWorkspaceTimeline();
  const { data: cosData } = useChangeOrders();

  const projects: any[] = projectsData?.data ?? [];
  const flags: any[] = flagsData?.data ?? [];
  const cos: any[] = cosData?.data ?? [];
  const weeks = timelineData?.data?.weeks ?? [];

  // Project status breakdown
  const statusCounts = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Top projects by pending flags
  const flagsByProject = flags.reduce(
    (acc, f) => {
      if (f.status === "pending_review" || f.status === "pending") {
        acc[f.projectId] = (acc[f.projectId] ?? 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const topRiskProjects = projects
    .map((p) => ({ ...p, flagCount: flagsByProject[p.id] ?? 0 }))
    .filter((p) => p.flagCount > 0)
    .sort((a, b) => b.flagCount - a.flagCount)
    .slice(0, 5);

  // Change order status breakdown
  const coStatusCounts = cos.reduce(
    (acc, co) => {
      acc[co.status] = (acc[co.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Timeline — last N weeks
  const filteredWeeks = range === "all" ? weeks : weeks.slice(-(range === "7d" ? 1 : range === "30d" ? 4 : 13));
  const maxWeekVal = Math.max(
    1,
    ...filteredWeeks.flatMap((w) => [w.projects, w.briefs, w.deliverables, w.flags]),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
            <BarChart2 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Portfolio-level insights across all projects
          </p>
        </div>
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max rounded-xl border border-[rgb(var(--border-default))] bg-white p-1 gap-1">
          {RANGE_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                range === value
                  ? "bg-primary text-white"
                  : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
              }`}
            >
              {label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Portfolio KPIs */}
      {workspaceId && <PortfolioHealth workspaceId={workspaceId} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Project Status Breakdown */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Project Status</h3>
          </div>
          {loadingProjects ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-7 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {["active", "draft", "paused", "completed"].map((status) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs capitalize text-[rgb(var(--text-muted))] sm:w-20">{status}</span>
                  <Bar
                    value={statusCounts[status] ?? 0}
                    max={projects.length || 1}
                    color={STATUS_COLORS[status] ?? "bg-gray-400"}
                  />
                </div>
              ))}
              <p className="pt-1 text-xs text-[rgb(var(--text-muted))]">{projects.length} total projects</p>
            </div>
          )}
        </Card>

        {/* Change Order Status */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Change Orders</h3>
          </div>
          {cos.length === 0 ? (
            <p className="py-6 text-center text-sm text-[rgb(var(--text-muted))]">No change orders yet</p>
          ) : (
            <div className="space-y-3">
              {["pending", "sent", "accepted", "declined"].map((status) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs capitalize text-[rgb(var(--text-muted))] sm:w-20">{status}</span>
                  <Bar
                    value={coStatusCounts[status] ?? 0}
                    max={cos.length || 1}
                    color={
                      status === "accepted" ? "bg-emerald-500" :
                      status === "declined" ? "bg-red-400" :
                      status === "sent" ? "bg-blue-400" : "bg-amber-400"
                    }
                  />
                </div>
              ))}
              <p className="pt-1 text-xs text-[rgb(var(--text-muted))]">{cos.length} total change orders</p>
            </div>
          )}
        </Card>

        {/* Top Projects at Risk */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Projects at Risk</h3>
          </div>
          {loadingFlags ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : topRiskProjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-[rgb(var(--text-muted))]">All clear — no pending flags</p>
          ) : (
            <div className="divide-y divide-[rgb(var(--border-subtle))]">
              {topRiskProjects.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{p.name}</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {p.budget ? `$${Number(p.budget).toLocaleString()}` : "No budget set"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge status="flagged">{p.flagCount} flag{p.flagCount !== 1 ? "s" : ""}</Badge>
                    <Badge status={p.status as any}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Activity Timeline */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Weekly Activity</h3>
          </div>
          {loadingTimeline ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : filteredWeeks.length === 0 ? (
            <p className="py-6 text-center text-sm text-[rgb(var(--text-muted))]">No activity data yet</p>
          ) : (
            <div className="space-y-2">
              {["projects", "briefs", "deliverables", "flags"].map((metric) => (
                <div key={metric} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs capitalize text-[rgb(var(--text-muted))] sm:w-24">{metric}</span>
                  <Bar
                    value={filteredWeeks.reduce((s, w) => s + (w as any)[metric], 0)}
                    max={maxWeekVal * filteredWeeks.length || 1}
                    color={
                      metric === "projects" ? "bg-primary" :
                      metric === "briefs" ? "bg-blue-400" :
                      metric === "deliverables" ? "bg-violet-400" : "bg-red-400"
                    }
                  />
                </div>
              ))}
              <p className="pt-1 text-xs text-[rgb(var(--text-muted))]">
                {filteredWeeks.length} week{filteredWeeks.length !== 1 ? "s" : ""} of data
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
