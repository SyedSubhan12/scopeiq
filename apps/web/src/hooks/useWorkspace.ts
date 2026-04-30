import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface WorkspaceRecord {
  id: string;
  name: string;
  plan: "free" | "solo" | "studio" | "agency";
  brandColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  reminderSettings?: unknown;
  customDomain?: string | null;
  domainVerificationStatus?: "pending" | "verified" | "failed" | null;
  domainVerifiedAt?: string | null;
}

export function getWorkspaceQueryOptions() {
  return {
    queryKey: ["workspace"],
    queryFn: () => fetchWithAuth("/v1/workspaces/me") as Promise<{ data: WorkspaceRecord }>,
  };
}

export function useWorkspace() {
  return useQuery<{ data: WorkspaceRecord }>(getWorkspaceQueryOptions());
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; brandColor?: string; logoUrl?: string }) =>
      fetchWithAuth("/v1/workspaces/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
}

export function useDomainStatus() {
  return useQuery({
    queryKey: ["workspace", "domain-status"],
    queryFn: () =>
      fetchWithAuth("/v1/workspaces/me/domain/status") as Promise<{
        data: {
          customDomain: string | null;
          domainVerificationStatus: "pending" | "verified" | "failed" | null;
          domainVerifiedAt: string | null;
        };
      }>,
    refetchInterval: 30_000,
  });
}

export function useSetCustomDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domain: string) =>
      fetchWithAuth("/v1/workspaces/me/domain", {
        method: "PATCH",
        body: JSON.stringify({ domain }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace", "domain-status"] });
    },
  });
}

export function useRequestDomainVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchWithAuth("/v1/workspaces/me/domain/verify", { method: "POST" }) as Promise<{
        data: {
          dnsRecord: { recordType: string; host: string; value: string; ttlSeconds: number };
          verificationToken: string;
          customDomain: string;
        };
      }>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace", "domain-status"] });
    },
  });
}
