import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface WorkspaceRecord {
  id: string;
  name: string;
  plan: "solo" | "studio" | "agency";
  brandColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  reminderSettings?: unknown;
}

export function getWorkspaceQueryOptions() {
  return {
    queryKey: ["workspace"],
    queryFn: () => fetchWithAuth("/v1/workspaces/me") as Promise<{ data: WorkspaceRecord }>,
  };
}

export function useWorkspace() {
  return useQuery<{ data: WorkspaceRecord }>(getWorkspaceQueryOptions());
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
