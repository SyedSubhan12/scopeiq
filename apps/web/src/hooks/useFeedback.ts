import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface FeedbackItem {
  id: string;
  deliverableId: string;
  parentId: string | null;
  authorId: string | null;
  authorName: string | null;
  source: "portal" | "email_forward" | "manual_input";
  body: string;
  annotationJson: {
    xPos: number;
    yPos: number;
    pageNumber?: number | null;
    pinNumber: number;
    [key: string]: unknown;
  } | null;
  resolvedAt: string | null;
  createdAt: string;
}

export function useFeedback(deliverableId: string) {
  return useQuery<{ data: FeedbackItem[] }>({
    queryKey: ["feedback", deliverableId],
    queryFn: () => fetchWithAuth(`/v1/deliverables/${deliverableId}/feedback`) as Promise<{ data: FeedbackItem[] }>,
    enabled: !!deliverableId,
  });
}

export function useCreateFeedback(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      body: string;
      annotationJson?: FeedbackItem["annotationJson"];
      parentId?: string;
    }) =>
      fetchWithAuth(`/v1/deliverables/${deliverableId}/feedback`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feedback", deliverableId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useReplyFeedback(deliverableId: string, parentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      fetchWithAuth(`/v1/deliverables/${deliverableId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ body, parentId }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feedback", deliverableId] });
    },
  });
}

export function useUpdateFeedback(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      feedbackId,
      resolved,
    }: {
      feedbackId: string;
      resolved: boolean;
    }) =>
      fetchWithAuth(`/v1/feedback/${feedbackId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolved }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feedback", deliverableId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteFeedback(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedbackId: string) =>
      fetchWithAuth(`/v1/feedback/${feedbackId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feedback", deliverableId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useResolveFeedback(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedbackId: string) =>
      fetchWithAuth(`/v1/feedback/${feedbackId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolved: true }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feedback", deliverableId] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
