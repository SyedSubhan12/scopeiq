"use client";

import Link from "next/link";
import { AlertCircle, Plus, RefreshCcw } from "lucide-react";
import { Button, Skeleton } from "@novabots/ui";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/providers/auth-provider";
import { MetricCardGrid } from "./MetricCardGrid";
import { RecentActivity } from "./RecentActivity";
import { ScopeFlagsSummary } from "./ScopeFlagsSummary";
import { UpcomingDeadlines } from "./UpcomingDeadlines";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28 max-sm:w-full sm:max-w-[7rem]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const { session, loading: authLoading } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useDashboard(
    !authLoading && !!session,
  );

  if (authLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Your session is still loading. Refresh this page if the dashboard does not appear.
        </p>
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard data.";

    return (
      <div className="flex items-center justify-center py-16">
        <div className="max-w-xl rounded-[28px] border border-[rgb(var(--border-subtle))] bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">
            Dashboard data could not load
          </h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
            {message}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
            <Link href="/projects/new">
              <Button variant="secondary">Create project</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[rgb(var(--text-muted))]">
          No dashboard data available.
        </p>
      </div>
    );
  }

  const dashboard = data.data;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            {dashboard.greeting}
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>
        <Link href="/projects/new" className="max-sm:w-full">
          <Button size="sm" className="max-sm:w-full max-sm:justify-center">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <MetricCardGrid metrics={dashboard.metrics} />

      {/* Two-column layout: Activity + Flags/Deadlines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity activities={dashboard.recentActivity} />
        <div className="space-y-6">
          <ScopeFlagsSummary flags={dashboard.urgentFlags} />
          <UpcomingDeadlines deadlines={dashboard.upcomingDeadlines} />
        </div>
      </div>
    </div>
  );
}
