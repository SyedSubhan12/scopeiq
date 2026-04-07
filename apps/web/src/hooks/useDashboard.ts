import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { dashboardQueryKey } from "./query-keys";

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
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface DeadlineEntry {
  projectId: string;
  projectName: string;
  endDate: string | null;
  daysRemaining: number;
  clientId: string | null;
  clientName: string | null;
}

export interface DashboardData {
  greeting: string;
  metrics: DashboardMetrics;
  urgentFlags: UrgentFlag[];
  recentActivity: ActivityEntry[];
  upcomingDeadlines: DeadlineEntry[];
}

export interface DashboardResponse {
  data: DashboardData;
}

export function getDashboardQueryOptions(enabled = true) {
  return {
    queryKey: dashboardQueryKey,
    queryFn: () =>
      fetchWithAuth("/v1/dashboard") as Promise<DashboardResponse>,
    refetchInterval: 60_000,
    enabled,
  };
}

export function useDashboard(enabled = true) {
  return useQuery<DashboardResponse>(getDashboardQueryOptions(enabled));
}
