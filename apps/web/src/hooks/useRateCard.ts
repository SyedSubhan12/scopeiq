import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import type { RateCardItem } from "@novabots/db";

export function getRateCardQueryOptions() {
  return {
    queryKey: ["rate-card"],
    queryFn: () => fetchWithAuth("/v1/rate-card") as Promise<{ data: RateCardItem[] }>,
  };
}

export function useRateCard() {
  return useQuery<{ data: RateCardItem[] }>(getRateCardQueryOptions());
}

export function useCreateRateCardItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; rateInCents: number; unit?: string; description?: string }) =>
      fetchWithAuth("/v1/rate-card", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rate-card"] });
    },
  });
}
