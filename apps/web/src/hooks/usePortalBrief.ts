import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type BriefStatus =
  | "NOT_SUBMITTED"
  | "pending_score"
  | "scoring"
  | "scored"
  | "clarification_needed"
  | "approved"
  | "rejected";

export type PortalBriefFlag = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  prompt: string;
  reason: string;
  severity: "low" | "medium" | "high";
};

export type PortalBrief = {
  id: string;
  title: string;
  status: BriefStatus;
  scopeScore: number | null;
  flags: PortalBriefFlag[];
  answers: Record<string, unknown>;
  submittedAt: string | null;
};

/**
 * Fetches the latest brief for the current portal session.
 */
async function fetchPortalBrief(token: string): Promise<PortalBrief | null> {
  const response = await fetch(`${API_BASE_URL}/portal/session`, {
    headers: { "X-Portal-Token": token },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch brief");
  }

  const { data } = (await response.json()) as {
    data: {
      pendingBrief: {
        id: string;
        title: string;
        status: BriefStatus;
        scopeScore: number | null;
        fields: Array<{
          key: string;
          label: string;
          value: string | null;
        }>;
        flags?: Array<{
          id: string;
          field_key: string;
          message: string;
          suggested_question: string | null;
          severity: "low" | "medium" | "high";
        }>;
        scoringResultJson?: {
          flags?: Array<{
            id?: string;
            field_key?: string;
            message?: string;
            suggested_question?: string;
            severity?: "low" | "medium" | "high";
          }>;
        } | null;
      } | null;
    };
  };

  if (!data.pendingBrief) return null;

  const brief = data.pendingBrief;
  const scoringFlags = brief.scoringResultJson?.flags ?? [];
  const allFlags = (brief.flags ?? scoringFlags).map((flag, index) => ({
    id: flag.id ?? `flag_${index}`,
    fieldKey: flag.field_key ?? "",
    fieldLabel:
      brief.fields.find((f) => f.key === flag.field_key)?.label ?? flag.field_key ?? "",
    prompt: flag.suggested_question ?? flag.message ?? "Please clarify this field",
    reason: flag.message ?? "AI scoring flagged this as unclear",
    severity: flag.severity ?? "medium",
  }));

  const answers = Object.fromEntries(
    brief.fields.map((field) => [field.key, field.value ?? ""]),
  );

  return {
    id: brief.id,
    title: brief.title,
    status: brief.status,
    scopeScore: brief.scopeScore ?? null,
    flags: allFlags,
    answers,
    submittedAt: null,
  };
}

/**
 * Submits updated brief answers back to the API.
 */
async function submitBriefAnswers(
  token: string,
  briefId: string,
  responses: Record<string, string>,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/portal/session/brief/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Portal-Token": token,
    },
    body: JSON.stringify({
      briefId,
      responses,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Failed to submit brief");
  }
}

/**
 * Submits clarification answers back to the API.
 */
async function submitClarificationAnswers(
  token: string,
  briefId: string,
  clarificationRequestId: string,
  responses: Record<string, string>,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/portal/session/brief/clarify-submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Portal-Token": token,
    },
    body: JSON.stringify({
      briefId,
      clarificationRequestId,
      responses,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Failed to submit clarifications");
  }
}

export interface UsePortalBriefReturn {
  brief: PortalBrief | null;
  isLoading: boolean;
  error: Error | null;
  submit: (
    responses: Record<string, string>,
    clarificationRequestId?: string,
  ) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * React Query hook that:
 * 1. Fetches the latest brief for the portal session
 * 2. Subscribes to Supabase channel: `briefs:${projectId}` for real-time status updates
 * 3. Falls back to polling if Supabase is unavailable
 *
 * @param token - The portal session token
 * @param projectId - The project ID for Supabase subscription scope
 */
export function usePortalBrief(
  token: string,
  projectId: string | null,
): UsePortalBriefReturn {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: brief, isLoading, error } = useQuery({
    queryKey: ["portal-brief", token],
    queryFn: () => fetchPortalBrief(token),
    enabled: !!token,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      // Keep polling while brief is in a transitional state
      const currentBrief = query.state.data;
      if (
        currentBrief &&
        (currentBrief.status === "pending_score" || currentBrief.status === "scoring")
      ) {
        return 3000;
      }
      return false;
    },
    retry: false,
  });

  // Supabase real-time subscription
  useEffect(() => {
    if (!projectId || !token) return;

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      // Supabase not configured — polling fallback is already active via refetchInterval
      return;
    }

    const channel = supabase
      .channel(`portal-brief-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "briefs",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          // Invalidate the brief query to refetch with new status
          void queryClient.invalidateQueries({ queryKey: ["portal-brief", token] });
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
  }, [projectId, token, queryClient]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (params: {
      responses: Record<string, string>;
      clarificationRequestId?: string;
    }) => {
      if (!brief) throw new Error("No brief loaded");

      if (params.clarificationRequestId) {
        await submitClarificationAnswers(
          token,
          brief.id,
          params.clarificationRequestId,
          params.responses,
        );
      } else {
        await submitBriefAnswers(token, brief.id, params.responses);
      }

      // Refetch brief to get updated status
      await queryClient.invalidateQueries({ queryKey: ["portal-brief", token] });
    },
  });

  const submit = useCallback(
    async (responses: Record<string, string>, clarificationRequestId?: string) => {
      const params: { responses: Record<string, string>; clarificationRequestId?: string } = {
        responses,
      };
      if (clarificationRequestId !== undefined) {
        params.clarificationRequestId = clarificationRequestId;
      }
      await submitMutation.mutateAsync(params);
    },
    [submitMutation],
  );

  return {
    brief: brief ?? null,
    isLoading,
    error: error instanceof Error ? error : null,
    submit,
    isSubmitting: submitMutation.isPending,
  };
}
