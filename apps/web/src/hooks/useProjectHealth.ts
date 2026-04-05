import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface ProjectHealth {
  project: {
    id: string;
    name: string;
    status: string;
    budget: number | null;
    clientId: string | null;
  };
  scopeHealth: {
    pendingFlags: number;
    resolvedFlags: number;
    openChangeOrders: number;
    acceptedChangeOrders: number;
  };
  briefHealth: {
    totalBriefs: number;
    avgScore: number | null;
    flaggedCount: number;
    approvedCount: number;
  };
  deliverableHealth: {
    total: number;
    approved: number;
    inReview: number;
    changesRequested: number;
  };
  overallScore: number;
}

export function useProjectHealth(projectId: string) {
  return useQuery<{ data: ProjectHealth }>({
    queryKey: ["project-health", projectId],
    queryFn: () =>
      fetchWithAuth(`/v1/projects/${projectId}/health`) as Promise<{ data: ProjectHealth }>,
    enabled: !!projectId,
  });
}

export function useWorkspaceTimeline() {
  return useQuery<{ data: { weeks: { week: string; projects: number; briefs: number; deliverables: number; flags: number }[] } }>({
    queryKey: ["analytics", "timeline"],
    queryFn: () =>
      fetchWithAuth("/v1/analytics/workspace/timeline") as Promise<{
        data: { weeks: { week: string; projects: number; briefs: number; deliverables: number; flags: number }[] };
      }>,
  });
}
