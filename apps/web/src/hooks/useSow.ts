import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export type ClauseType = "deliverable" | "revision_limit" | "timeline" | "exclusion" | "payment_term" | "other";

export interface SowClause {
  id: string;
  sowId: string;
  clauseType: ClauseType;
  originalText: string;
  summary: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface StatementOfWork {
  id: string;
  workspaceId: string;
  title: string;
  fileUrl: string | null;
  fileKey: string | null;
  fileSizeBytes: number | null;
  parsedTextPreview: string | null;
  parsingResultJson: Record<string, any> | null;
  parsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  clauses?: SowClause[];
}

export function useSow(sowId: string) {
  return useQuery<{ data: StatementOfWork }>({
    queryKey: ["sow", sowId],
    queryFn: () => fetchWithAuth(`/v1/sow/${sowId}`) as Promise<{ data: StatementOfWork }>,
    enabled: !!sowId,
  });
}

export function useProjectSow(projectId: string) {
  return useQuery<{ data: StatementOfWork | null }>({
    queryKey: ["projects", projectId, "sow"],
    queryFn: () =>
      fetchWithAuth(`/v1/projects/${projectId}/sow`) as Promise<{ data: StatementOfWork | null }>,
    enabled: !!projectId,
  });
}

export function useCreateSow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { projectId: string; title: string; rawText: string }) =>
      fetchWithAuth("/v1/sow", {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<{ data: StatementOfWork }>,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["projects", variables.projectId, "sow"] });
    },
  });
}

export function useUpdateSowClauses(sowId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clauses: { clauseType: ClauseType; originalText: string; summary?: string | null; sortOrder?: number }[]) =>
      fetchWithAuth(`/v1/sow/${sowId}/clauses`, {
        method: "PATCH",
        body: JSON.stringify({ clauses }),
      }) as Promise<{ data: SowClause[] }>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sow", sowId] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "sow"] });
    },
  });
}

export function useActivateSow(sowId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clauses: { clauseType: ClauseType; originalText: string; summary?: string | null; sortOrder?: number }[]) =>
      fetchWithAuth(`/v1/sow/${sowId}/activate`, {
        method: "PATCH",
        body: JSON.stringify({ clauses }),
      }) as Promise<{ data: StatementOfWork }>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sow", sowId] });
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId, "sow"] });
      void queryClient.invalidateQueries({ queryKey: ["scope-flags", projectId] });
    },
  });
}
