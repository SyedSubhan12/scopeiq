import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface BriefFieldValue {
  field_key: string;
  value: string | string[];
}

export interface BriefFlag {
  id: string;
  field_key?: string;
  severity: "low" | "medium" | "high";
  message: string;
  suggested_question?: string;
}

export interface Brief {
  id: string;
  projectId: string;
  templateId: string;
  values: BriefFieldValue[];
  flags: BriefFlag[];
  clarityScore: number;
  status: "draft" | "submitted" | "approved" | "flagged";
  createdAt: string;
  updatedAt: string;
}

export function useBriefs(projectId: string) {
  return useQuery<{ data: any[] }>({
    queryKey: ["briefs", projectId],
    queryFn: () => fetchWithAuth(`/v1/projects/${projectId}/briefs`) as Promise<{ data: any[] }>,
    enabled: !!projectId,
  });
}

export function useBrief(projectId: string, briefId: string) {
  return useQuery<{ data: any }>({
    queryKey: ["brief", projectId, briefId],
    queryFn: () => fetchWithAuth(`/v1/projects/${projectId}/briefs/${briefId}`) as Promise<{ data: any }>,
    enabled: !!projectId && !!briefId,
  });
}

export function useCreateBrief(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { templateId: string; values?: BriefFieldValue[] }) =>
      fetchWithAuth(`/v1/projects/${projectId}/briefs`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["briefs", projectId] });
    },
  });
}

export function useUpdateBriefValues(projectId: string, briefId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BriefFieldValue[]) =>
      fetchWithAuth(`/v1/projects/${projectId}/briefs/${briefId}/values`, {
        method: "PATCH",
        body: JSON.stringify({ values }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["briefs", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["brief", projectId, briefId] });
    },
  });
}

export function useOverrideBriefFlag(projectId: string, briefId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (flagId: string) =>
      fetchWithAuth(`/v1/projects/${projectId}/briefs/${briefId}/flags/${flagId}/override`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brief", projectId, briefId] });
    },
  });
}

export function useSubmitBrief(projectId: string, briefId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchWithAuth(`/v1/projects/${projectId}/briefs/${briefId}/submit`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["briefs", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["brief", projectId, briefId] });
    },
  });
}
