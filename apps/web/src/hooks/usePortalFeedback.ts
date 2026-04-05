import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackItem } from "./useFeedback";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function portalFetch(path: string, token: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            "X-Portal-Token": token,
            "Content-Type": "application/json",
        },
    });
    if (!res.ok) throw new Error("Portal request failed");
    return res.json();
}

export function usePortalFeedback(deliverableId: string, portalToken: string) {
    return useQuery<{ data: FeedbackItem[] }>({
        queryKey: ["portal-feedback", deliverableId],
        queryFn: () => portalFetch(`/portal/deliverables/${deliverableId}/feedback`, portalToken) as Promise<{ data: FeedbackItem[] }>,
        enabled: !!deliverableId && !!portalToken,
    });
}

export function useCreatePortalFeedback(deliverableId: string, portalToken: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            body: string;
            annotationJson?: FeedbackItem["annotationJson"];
        }) =>
            portalFetch(`/portal/deliverables/${deliverableId}/feedback`, portalToken, {
                method: "POST",
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["portal-feedback", deliverableId] });
        },
    });
}

export function useResolvePortalFeedback(deliverableId: string, portalToken: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (feedbackId: string) =>
            portalFetch(`/portal/feedback/${feedbackId}`, portalToken, {
                method: "PATCH",
                body: JSON.stringify({ resolvedAt: new Date().toISOString() }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["portal-feedback", deliverableId] });
        },
    });
}

export function usePortalApprove(deliverableId: string, portalToken: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (comment?: string) =>
            portalFetch(`/portal/deliverables/${deliverableId}/approve`, portalToken, {
                method: "POST",
                body: JSON.stringify({ comment }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["portal-session"] });
        },
    });
}

export function usePortalRequestRevision(deliverableId: string, portalToken: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (comment: string) =>
            portalFetch(`/portal/deliverables/${deliverableId}/request-revision`, portalToken, {
                method: "POST",
                body: JSON.stringify({ comment }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["portal-session"] });
        },
    });
}
