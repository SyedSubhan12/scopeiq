import { useQuery } from "@tanstack/react-query";
import { getPortalProject } from "@/lib/portal-auth";

/**
 * React Query hook for fetching portal project data.
 *
 * - Query key: ["portal-project", token]
 * - Fetches project + workspace branding + deliverables
 * - Enabled only when token is present
 * - Cached for 5 minutes (staleTime)
 */
export function usePortalProject(token: string) {
  return useQuery({
    queryKey: ["portal-project", token],
    queryFn: async () => {
      const data = await getPortalProject(token);
      if (!data) {
        throw new Error("Invalid portal token");
      }
      return data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
