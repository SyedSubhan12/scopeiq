import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export function getWorkspaceQueryOptions() {
  return {
    queryKey: ["workspace"],
    queryFn: () => fetchWithAuth("/v1/workspaces/me") as Promise<{ data: any }>,
  };
}

export function useWorkspace() {
  return useQuery<{ data: any }>(getWorkspaceQueryOptions());
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; brandColor?: string; logoUrl?: string }) =>
      fetchWithAuth("/v1/workspaces/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
}
