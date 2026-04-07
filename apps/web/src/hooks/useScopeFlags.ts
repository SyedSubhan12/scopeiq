import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import {
  auditLogQueryKey,
  dashboardQueryKey,
  notificationsQueryKey,
  scopeFlagCountQueryKey,
  scopeFlagsQueryKey,
} from "./query-keys";

export interface ScopeFlag {
  id: string;
  workspaceId: string;
  projectId: string;
  sowClauseId: string | null;
  messageText: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  status: "pending" | "confirmed" | "dismissed" | "snoozed" | "change_order_sent" | "resolved";
  title: string;
  description: string | null;
  suggestedResponse: string | null;
  aiReasoning: string | null;
  matchingClausesJson?: unknown[] | null;
  evidence?: Record<string, unknown> | null;
  flaggedBy: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getScopeFlagsQueryOptions(projectId?: string) {
  return {
    queryKey: [...scopeFlagsQueryKey, projectId] as const,
    queryFn: () =>
      fetchWithAuth(`/v1/scope-flags${projectId ? `?projectId=${projectId}` : ""}`) as Promise<{
        data: ScopeFlag[];
      }>,
  };
}

export function useScopeFlags(projectId?: string) {
  return useQuery<{ data: ScopeFlag[] }>(getScopeFlagsQueryOptions(projectId));
}

export function useScopeFlagCount() {
  return useQuery<{ data: { count: number } }>({
    queryKey: ["scope-flags", "count"],
    queryFn: () => fetchWithAuth("/v1/scope-flags/count") as Promise<{ data: { count: number } }>,
  });
}

export function useUpdateScopeFlag(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: ScopeFlag["status"]; reason?: string }) =>
      fetchWithAuth(`/v1/scope-flags/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scopeFlagsQueryKey });
      void queryClient.invalidateQueries({ queryKey: scopeFlagCountQueryKey });
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKey });
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}
