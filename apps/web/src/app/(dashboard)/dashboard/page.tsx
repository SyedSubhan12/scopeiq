"use client";

import { DashboardOverview } from "@/components/shared/DashboardOverview";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getDashboardQueryOptions } from "@/hooks/useDashboard";
import { queryClient } from "@/lib/query-client";

export default function DashboardPage() {
  useAssetsReady({
    scopeId: "page:dashboard",
    tasks: [() => queryClient.ensureQueryData(getDashboardQueryOptions())],
  });

  return <DashboardOverview />;
}

