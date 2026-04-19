import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import {
  mapBriefRecord,
  mapBriefVersionRecord,
  type BriefRecord,
  type BriefVersionRecord,
  type BriefFlag as NormalizedBriefFlag,
} from "@/lib/briefs";
export type Brief = BriefRecord;
export type BriefFlag = NormalizedBriefFlag;

export interface BriefFieldValue {
  field_key: string;
  value: string | string[];
}

export function useBriefs(projectId: string) {
  return useQuery<{ data: Brief[] }>({
    queryKey: ["briefs", projectId],
    queryFn: async () => {
      const response = (await fetchWithAuth(`/v1/projects/${projectId}/briefs`)) as {
        data: Record<string, unknown>[];
      };
      return { data: response.data.map(mapBriefRecord) };
    },
    enabled: !!projectId,
  });
}

export function useAllBriefs() {
  return useQuery<{ data: Brief[] }>({
    queryKey: ["briefs", "all"],
    queryFn: async () => {
      const response = (await fetchWithAuth("/v1/briefs")) as {
        data: Record<string, unknown>[];
      };
      return { data: response.data.map(mapBriefRecord) };
    },
  });
}

export function useBrief(briefId: string) {
  return useQuery<{ data: Brief }>({
    queryKey: ["brief", briefId],
    queryFn: async () => {
      const response = (await fetchWithAuth(`/v1/briefs/${briefId}`)) as {
        data: Record<string, unknown>;
      };
      return { data: mapBriefRecord(response.data) };
    },
    enabled: !!briefId,
  });
}

export function useBriefVersions(briefId: string) {
  return useQuery<{ data: BriefVersionRecord[] }>({
    queryKey: ["brief", briefId, "versions"],
    queryFn: async () => {
      const response = (await fetchWithAuth(`/v1/briefs/${briefId}/versions`)) as {
        data: Record<string, unknown>[];
      };
      return { data: response.data.map(mapBriefVersionRecord) };
    },
    enabled: !!briefId,
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
      void queryClient.invalidateQueries({ queryKey: ["briefs"] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId] });
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
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId] });
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
      void queryClient.invalidateQueries({ queryKey: ["briefs"] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId] });
    },
  });
}

export function useOverrideBrief(briefId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title?: string;
      status?: "pending_score" | "scored" | "clarification_needed" | "approved" | "rejected";
      scopeScore?: number;
      scoringResultJson?: Record<string, unknown>;
    }) =>
      fetchWithAuth(`/v1/briefs/${briefId}/override`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["briefs"] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId] });
    },
  });
}

export function useReviewBrief(briefId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      action: "approve" | "clarify" | "hold" | "override";
      status: "clarification_needed" | "approved" | "rejected";
      note?: string;
    }) =>
      fetchWithAuth(`/v1/briefs/${briefId}/review`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["briefs"] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId, "versions"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });
}

export function useCreateClarificationRequest(briefId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      message?: string;
      items: Array<{
        fieldKey: string;
        fieldLabel: string;
        prompt: string;
        severity: "low" | "medium" | "high";
        sourceFlagId?: string;
      }>;
    }) =>
      fetchWithAuth(`/v1/briefs/${briefId}/clarification-request`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["briefs"] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId, "versions"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });
}

export function useAssignBriefReviewer(briefId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewerId: string | null) =>
      fetchWithAuth(`/v1/briefs/${briefId}/reviewer`, {
        method: "POST",
        body: JSON.stringify({ reviewerId }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["briefs"] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId] });
      void queryClient.invalidateQueries({ queryKey: ["brief", briefId, "versions"] });
    },
  });
}
