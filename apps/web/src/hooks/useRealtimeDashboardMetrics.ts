import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { dashboardQueryKey } from "./query-keys";

export function useRealtimeDashboardMetrics(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const invalidateDashboard = () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    };

    const channel = supabase
      .channel(`dashboard-metrics-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidateDashboard,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliverables",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidateDashboard,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scope_flags",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        invalidateDashboard,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspaces",
          filter: `id=eq.${workspaceId}`,
        },
        invalidateDashboard,
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient, workspaceId]);
}
