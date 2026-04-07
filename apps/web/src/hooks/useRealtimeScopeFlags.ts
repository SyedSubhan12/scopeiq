import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  dashboardQueryKey,
  scopeFlagCountQueryKey,
  scopeFlagsQueryKey,
} from "./query-keys";

/**
 * Subscribes to real-time scope_flags changes via Supabase.
 * Invalidates React Query cache on INSERT/UPDATE/DELETE.
 * Scoped to workspace_id for fanout isolation.
 */
export function useRealtimeScopeFlags(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`scope-flags-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scope_flags",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: scopeFlagsQueryKey });
          queryClient.invalidateQueries({ queryKey: scopeFlagCountQueryKey });
          queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, queryClient]);
}
