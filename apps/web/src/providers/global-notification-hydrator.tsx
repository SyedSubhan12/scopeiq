"use client";

import { getNotificationsQueryOptions, useNotifications } from "@/hooks/useNotifications";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { mapAuditLogEntryToNotification } from "@/lib/notification-utils";
import { useAuth } from "@/providers/auth-provider";
import { queryClient } from "@/lib/query-client";
import { useNotificationStore } from "@/stores/notification.store";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

function isDashboardShellRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/briefs") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/scope-flags") ||
    pathname.startsWith("/change-orders") ||
    pathname.startsWith("/settings")
  );
}

export function GlobalNotificationHydrator() {
  const pathname = usePathname();
  const { session, loading } = useAuth();
  const shouldHydrate = !loading && Boolean(session) && isDashboardShellRoute(pathname);
  const replaceNotifications = useNotificationStore((state) => state.replaceNotifications);

  useAssetsReady({
    scopeId: "global:notifications",
    enabled: shouldHydrate,
    tasks: [() => queryClient.ensureQueryData(getNotificationsQueryOptions(10))],
  });

  const { data } = useNotifications(10);

  useEffect(() => {
    if (!shouldHydrate || !data?.data) {
      return;
    }

    replaceNotifications(data.data.map(mapAuditLogEntryToNotification));
  }, [data, replaceNotifications, shouldHydrate]);

  return null;
}
