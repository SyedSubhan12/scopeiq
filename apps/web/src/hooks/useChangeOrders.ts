import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export function useChangeOrders(projectId?: string) {
    return useQuery<{ data: any[] }>({
        queryKey: ["change-orders", projectId],
        queryFn: () => fetchWithAuth(`/v1/change-orders${projectId ? `?projectId=${projectId}` : ""}`) as Promise<{ data: any[] }>,
    });
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
            lineItemsJson?: any[];
        }) =>
            fetchWithAuth("/v1/change-orders", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["change-orders"] });
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
            status?: string;
        }) =>
            fetchWithAuth(`/v1/change-orders/${id}`, {
                method: "PATCH",
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["change-orders"] });
        },
    });
}
