import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Subscribes to real-time deliverables changes via Supabase.
 * Invalidates React Query cache on INSERT/UPDATE/DELETE.
 * Scoped to project_id for fanout isolation.
 * Satisfies FR-AP-003: counter updates in real time without a page refresh.
 */
export function useRealtimeDeliverables(projectId: string | null) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`deliverables-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliverables",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
          void queryClient.invalidateQueries({ queryKey: ["deliverables"] });
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
  }, [projectId, queryClient]);
}
