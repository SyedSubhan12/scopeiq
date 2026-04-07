import { describe, expect, it } from "vitest";
import {
  auditLogQueryKey,
  changeOrderCountQueryKey,
  changeOrdersQueryKey,
  dashboardQueryKey,
  getDashboardRealtimeInvalidationKeys,
  getSidebarInvalidationKeys,
  notificationsQueryKey,
  scopeFlagCountQueryKey,
  scopeFlagsQueryKey,
} from "./query-keys";

describe("query keys", () => {
  it("keeps sidebar count invalidation aligned with the change-order and scope-flag counts", () => {
    expect(getSidebarInvalidationKeys()).toEqual([
      changeOrdersQueryKey,
      changeOrderCountQueryKey,
      scopeFlagsQueryKey,
      scopeFlagCountQueryKey,
      dashboardQueryKey,
    ]);
  });

  it("targets the dashboard overview cache for realtime invalidation", () => {
    expect(getDashboardRealtimeInvalidationKeys()).toEqual([dashboardQueryKey]);
  });

  it("exposes stable keys for mutation-side invalidation", () => {
    expect(auditLogQueryKey).toEqual(["audit-log"]);
    expect(notificationsQueryKey).toEqual(["notifications"]);
  });
});
