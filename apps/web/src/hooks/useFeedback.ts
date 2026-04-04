import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface FeedbackItem {
  id: string;
  deliverable_id: string;
  x_pos: number;
  y_pos: number;
  page_number?: number | null;
  pin_number: number;
  content: string;
  author_type: "client" | "agency";
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export function useFeedback(deliverableId: string) {
  return useQuery({
    queryKey: ["feedback", deliverableId],
    queryFn: () => fetchWithAuth(`/v1/deliverables/${deliverableId}/feedback`),
    enabled: !!deliverableId,
  });
}

export function useCreateFeedback(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      x_pos: number;
      y_pos: number;
      page_number?: number;
      content: string;
      author_type: "client" | "agency";
    }) =>
      fetchWithAuth(`/v1/deliverables/${deliverableId}/feedback`, {
        method: "POST",
        body: JSON.stringify(data),
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
      data,
    }: {
      feedbackId: string;
      data: { content?: string; is_resolved?: boolean };
    }) =>
      fetchWithAuth(`/v1/feedback/${feedbackId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feedback", deliverableId] });
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
    },
  });
}

export function useResolveFeedback(deliverableId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedbackId: string) =>
      fetchWithAuth(`/v1/feedback/${feedbackId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_resolved: true }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["feedback", deliverableId] });
    },
  });
}
