import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export function useDeleteRateCardItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      fetchWithAuth(`/v1/rate-card/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rate-card"] });
    },
  });
}

export function useUpdateRateCardItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name: string;
      rateInCents: number;
      unit?: string;
      description?: string;
    }) =>
      fetchWithAuth(`/v1/rate-card/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rate-card"] });
    },
  });
}
