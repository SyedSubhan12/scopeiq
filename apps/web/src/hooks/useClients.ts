import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import type { Client } from "@novabots/db";

type ClientsOptions = { cursor?: string; limit?: number };

export function getClientsQueryOptions(options?: ClientsOptions) {
  const params = new URLSearchParams();
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();

  return {
    queryKey: ["clients", options],
    queryFn: () => fetchWithAuth(`/v1/clients${qs ? `?${qs}` : ""}`) as Promise<{ data: Client[] }>,
  };
}

export function useClients(options?: ClientsOptions) {
  return useQuery<{ data: Client[] }>(getClientsQueryOptions(options));
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
