"use client";

import { DashboardOverview } from "@/components/shared/DashboardOverview";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getDashboardQueryOptions } from "@/hooks/useDashboard";
import { useAuth } from "@/providers/auth-provider";
import { queryClient } from "@/lib/query-client";

export default function DashboardPage() {
  const { session, loading } = useAuth();
  const canPrefetch = !loading && !!session;

  useAssetsReady({
    scopeId: "page:dashboard",
    enabled: canPrefetch,
    tasks: [() => queryClient.ensureQueryData(getDashboardQueryOptions(canPrefetch))],
  });

  return <DashboardOverview />;
}
