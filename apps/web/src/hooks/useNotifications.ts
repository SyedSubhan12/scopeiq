import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { subHours } from "date-fns";
import { useAuth } from "@/providers/auth-provider";

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorName?: string;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export function getNotificationsQueryOptions(limit = 20) {
  return {
    queryKey: ["notifications", limit] as const,
    queryFn: () =>
      fetchWithAuth(`/v1/notifications?limit=${limit}`) as Promise<AuditLogResponse>,
  };
}

export function useNotifications(limit = 20, enabled = true) {
  const { session } = useAuth();
  return useQuery<AuditLogResponse>({
    ...getNotificationsQueryOptions(limit),
    enabled: enabled && !!session,
  });
}

export function getAuditLogQueryOptions(options?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.entityType) params.set("entityType", options.entityType);
  if (options?.entityId) params.set("entityId", options.entityId);
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();

  return {
    queryKey: ["audit-log", options] as const,
    queryFn: () =>
      fetchWithAuth(`/v1/audit-log${qs ? `?${qs}` : ""}`) as Promise<AuditLogResponse>,
  };
}

export function useAuditLog(options?: {
  entityType?: string;
  entityId?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { session } = useAuth();
  const queryOptions = getAuditLogQueryOptions(options);
  return useQuery<AuditLogResponse>({
    ...queryOptions,
    enabled: (options?.enabled ?? true) && !!session,
  });
}

/**
 * Returns the count of notifications from the last 24 hours.
 * Treated as "unread" count — used by the bell badge in TopBar.
 */
export function useUnreadNotificationCount(): number {
  const { session } = useAuth();
  const { data } = useNotifications(50, !!session);
  if (!data?.data) return 0;
  const cutoff = subHours(new Date(), 24);
  return data.data.filter((n) => new Date(n.createdAt) > cutoff).length;
}
