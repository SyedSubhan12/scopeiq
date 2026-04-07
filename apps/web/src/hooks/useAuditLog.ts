import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface AuditLogEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  createdAt: string;
  metadataJson?: Record<string, unknown> | null;
}

export function useAuditLog(options?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.entityType) params.set("entityType", options.entityType);
  if (options?.entityId) params.set("entityId", options.entityId);
  if (options?.limit) params.set("limit", String(options.limit));

  const qs = params.toString();

  return useQuery<{ data: AuditLogEvent[]; pagination?: { next_cursor?: string | null; has_more?: boolean } }>({
    queryKey: ["audit-log", options],
    queryFn: () =>
      fetchWithAuth(`/v1/audit-log${qs ? `?${qs}` : ""}`) as Promise<{
        data: AuditLogEvent[];
        pagination?: { next_cursor?: string | null; has_more?: boolean };
      }>,
    enabled: options?.enabled ?? true,
    retry: false,
  });
}
