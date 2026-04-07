import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import {
  auditLogQueryKey,
  changeOrderCountQueryKey,
  changeOrdersQueryKey,
  notificationsQueryKey,
} from "./query-keys";

export interface ChangeOrderLineItem {
  id?: string;
  description: string;
  hours: number;
  rate: number;
}

export interface ChangeOrder {
  id: string;
  workspaceId: string;
  projectId: string;
  scopeFlagId: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  lineItemsJson: ChangeOrderLineItem[];
  revisedTimeline: string | null;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  sentAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getChangeOrdersQueryOptions(projectId?: string) {
  return {
    queryKey: [...changeOrdersQueryKey, projectId] as const,
    queryFn: () =>
      fetchWithAuth(`/v1/change-orders${projectId ? `?projectId=${projectId}` : ""}`) as Promise<{
        data: ChangeOrder[];
      }>,
  };
}

export function useChangeOrders(projectId?: string) {
  return useQuery<{ data: ChangeOrder[] }>(getChangeOrdersQueryOptions(projectId));
}

export function useChangeOrderCount() {
  return useQuery<{ data: { count: number } }>({
    queryKey: ["change-orders", "count"],
    queryFn: () => fetchWithAuth("/v1/change-orders/count") as Promise<{ data: { count: number } }>,
  });
}

export function useCreateChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      projectId: string;
      scopeFlagId?: string;
      title: string;
      description?: string;
      amount?: number;
      lineItemsJson?: ChangeOrderLineItem[];
      revisedTimeline?: string;
    }) =>
      fetchWithAuth("/v1/change-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: changeOrdersQueryKey });
      void queryClient.invalidateQueries({ queryKey: changeOrderCountQueryKey });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKey });
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}

export function useUpdateChangeOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title?: string;
      description?: string;
      amount?: number;
      lineItemsJson?: ChangeOrderLineItem[];
      revisedTimeline?: string;
      status?: ChangeOrder["status"];
    }) =>
      fetchWithAuth(`/v1/change-orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: changeOrdersQueryKey });
      void queryClient.invalidateQueries({ queryKey: changeOrderCountQueryKey });
      void queryClient.invalidateQueries({ queryKey: auditLogQueryKey });
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
}
