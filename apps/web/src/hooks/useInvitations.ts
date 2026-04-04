import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

interface Invitation {
    id: string;
    email: string;
    role: string;
    token: string;
    expiresAt: string;
    acceptedAt: string | null;
    createdAt: string;
}

export function useInvitations() {
    return useQuery({
        queryKey: ["invitations"],
        queryFn: () => apiClient.get<{ data: Invitation[] }>("/v1/invites"),
    });
}

export function useCreateInvite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { email: string; role: string }) =>
            apiClient.post("/v1/invites", data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["invitations"] });
        },
    });
}

export function useRevokeInvite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/v1/invites/${id}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["invitations"] });
        },
    });
}
