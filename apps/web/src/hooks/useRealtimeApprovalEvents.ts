import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { dashboardQueryKey } from "./query-keys";

/**
 * Subscribes to real-time approval_events changes via Supabase.
 * Invalidates deliverable and approval-event queries on changes.
 */
export function useRealtimeApprovalEvents(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`approval-events-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "approval_events",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["approval-events"] });
          queryClient.invalidateQueries({ queryKey: ["deliverables"] });
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
