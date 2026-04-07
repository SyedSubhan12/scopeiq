export const dashboardQueryKey = ["dashboard"] as const;
export const changeOrdersQueryKey = ["change-orders"] as const;
export const changeOrderCountQueryKey = ["change-orders", "count"] as const;
export const scopeFlagsQueryKey = ["scope-flags"] as const;
export const scopeFlagCountQueryKey = ["scope-flags", "count"] as const;
export const notificationsQueryKey = ["notifications"] as const;
export const auditLogQueryKey = ["audit-log"] as const;

export function getSidebarInvalidationKeys() {
  return [changeOrdersQueryKey, changeOrderCountQueryKey, scopeFlagsQueryKey, scopeFlagCountQueryKey, dashboardQueryKey] as const;
}

export function getDashboardRealtimeInvalidationKeys() {
  return [dashboardQueryKey] as const;
}
