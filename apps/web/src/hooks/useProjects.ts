import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export function useProjects(options?: { status?: string | undefined; clientId?: string | undefined; cursor?: string | undefined; limit?: number | undefined }) {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.clientId) params.set("clientId", options.clientId);
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();

  return useQuery<{ data: any[] }>({
    queryKey: ["projects", options],
    queryFn: () => fetchWithAuth(`/v1/projects${qs ? `?${qs}` : ""}`) as Promise<{ data: any[] }>,
  });
}

export function useProject(id: string) {
  return useQuery<{ data: any }>({
    queryKey: ["project", id],
    queryFn: () => fetchWithAuth(`/v1/projects/${id}`) as Promise<{ data: any }>,
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; clientId: string; description?: string; budget?: number }) =>
      fetchWithAuth("/v1/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; status?: string; budget?: number }) =>
      fetchWithAuth(`/v1/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/v1/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
