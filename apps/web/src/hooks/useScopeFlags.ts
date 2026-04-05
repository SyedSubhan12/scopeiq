import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export function useScopeFlags(projectId?: string) {
    return useQuery<{ data: any[] }>({
        queryKey: ["scope-flags", projectId],
        queryFn: () => fetchWithAuth(`/v1/scope-flags${projectId ? `?projectId=${projectId}` : ""}`) as Promise<{ data: any[] }>,
    });
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
        mutationFn: (data: { status: string; reason?: string }) =>
            fetchWithAuth(`/v1/scope-flags/${id}`, {
                method: "PATCH",
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["scope-flags"] });
        },
    });
}
