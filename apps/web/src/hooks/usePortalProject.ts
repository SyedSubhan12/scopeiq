import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPortalProject } from "@/lib/portal-auth";
import { supabase } from "@/lib/supabase";

/**
 * React Query hook for fetching portal project data.
 * This is the single source of truth for tab gating in the client portal.
 *
 * - Query key: ["portal-project", token]
 * - Fetches project + workspace branding + deliverables
 * - Subscribes to Supabase channel: `projects:${projectId}` for real-time status changes
 * - On project status change: invalidates cache so tab gating re-evaluates
 * - Enabled only when token is present
 * - Cached for 5 minutes (staleTime)
 *
 * Returns: { project, workspace, client, deliverables, isLoading, error }
 */
export function usePortalProject(token: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: ["portal-project", token],
    queryFn: async () => {
      const data = await getPortalProject(token);
      if (!data) {
        throw new Error("Invalid portal token");
      }
      return data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Supabase real-time subscription for project status changes
  useEffect(() => {
    const projectId = query.data?.project?.id;
    if (!projectId || !token) return;

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;

    const channel = supabase
      .channel(`portal-project-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["portal-project", token] });
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
  }, [query.data, token, queryClient]);

  const projectData = query.data;

  return {
    ...query,
    project: projectData?.project ?? null,
    workspace: projectData?.workspace ?? null,
    client: null,
    deliverables: projectData?.deliverables ?? [],
  };
}
