import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export function useClients(options?: { cursor?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();

  return useQuery({
    queryKey: ["clients", options],
    queryFn: () => fetchWithAuth(`/v1/clients${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; contactName?: string; contactEmail?: string; notes?: string }) =>
      fetchWithAuth("/v1/clients", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
