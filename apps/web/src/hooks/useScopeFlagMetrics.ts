import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface ScopeFlagMetrics {
  totalFlags: number;
  p95LatencyMs: number;
  flagsPerUserMonth: number;
}

export function useScopeFlagMetrics() {
  return useQuery<ScopeFlagMetrics>({
    queryKey: ["scope-flags", "metrics"],
    queryFn: () =>
      fetchWithAuth("/api/scope-flags/metrics") as Promise<ScopeFlagMetrics>,
    staleTime: 60_000,
  });
}
