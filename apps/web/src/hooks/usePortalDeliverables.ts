import { useQuery } from "@tanstack/react-query";
import { generatePortalHeaders } from "@/lib/portal-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface PortalDeliverable {
  id: string;
  name: string;
  status: string;
  revisionRound: number;
  maxRevisions: number;
  fileUrl: string | null;
  mimeType: string | null;
  externalUrl: string | null;
  type: string;
  description: string | null;
  dueDate: string | null;
}

/**
 * React Query hook for fetching portal deliverables.
 *
 * - Query key: ["portal-deliverables", projectId]
 * - Fetches deliverables for client view via portal session
 * - Enabled only when projectId and token are present
 * - Returns deliverable list with status
 */
export function usePortalDeliverables(projectId: string, token: string) {
  return useQuery<{ data: PortalDeliverable[] }>({
    queryKey: ["portal-deliverables", projectId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/portal/session`, {
        headers: generatePortalHeaders(token),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch portal deliverables");
      }
      const json = await response.json();
      return { data: json.data.deliverables as PortalDeliverable[] };
    },
    enabled: !!projectId && !!token,
    staleTime: 2 * 60 * 1000,
  });
}
