import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import {
  mapTemplateRecord,
  mapTemplateVersionRecord,
  type BriefTemplateField,
  type BriefTemplateBrandingRecord,
  type BriefTemplateRecord,
  type BriefTemplateVersionRecord,
} from "@/lib/briefs";

export type BriefField = BriefTemplateField;
export type BriefTemplate = BriefTemplateRecord;
export type BriefTemplateVersion = BriefTemplateVersionRecord;
export type BriefTemplateBranding = BriefTemplateBrandingRecord;

export function getBriefTemplatesQueryOptions() {
  return {
    queryKey: ["brief-templates"],
    queryFn: async () => {
      const response = (await fetchWithAuth("/v1/brief-templates")) as { data: Record<string, unknown>[] };
      return {
        data: response.data.map(mapTemplateRecord),
      };
    },
  };
}

export function useBriefTemplates() {
  return useQuery<{ data: BriefTemplate[] }>(getBriefTemplatesQueryOptions());
}

export function useBriefTemplate(id: string) {
  return useQuery<{ data: BriefTemplate }>({
    queryKey: ["brief-template", id],
    queryFn: async () => {
      const response = (await fetchWithAuth(`/v1/brief-templates/${id}`)) as {
        data: Record<string, unknown>;
      };
      return { data: mapTemplateRecord(response.data) };
    },
    enabled: !!id,
  });
}

export function useCreateBriefTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      fields?: BriefField[];
      branding?: BriefTemplateBranding;
      isDefault?: boolean;
    }) =>
      fetchWithAuth("/v1/brief-templates", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.fields ? { fieldsJson: data.fields } : {}),
          ...(data.branding ? { brandingJson: data.branding } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brief-templates"] });
    },
  });
}

export function useBriefTemplateVersions(id: string) {
  return useQuery<{ data: BriefTemplateVersion[] }>({
    queryKey: ["brief-template", id, "versions"],
    queryFn: async () => {
      const response = (await fetchWithAuth(`/v1/brief-templates/${id}/versions`)) as {
        data: Record<string, unknown>[];
      };
      return { data: response.data.map(mapTemplateVersionRecord) };
    },
    enabled: !!id,
  });
}

export function useUpdateBriefTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?: string;
      description?: string;
      fields?: BriefField[];
      branding?: BriefTemplateBranding;
      isDefault?: boolean;
    }) =>
      fetchWithAuth(`/v1/brief-templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.fields !== undefined ? { fieldsJson: data.fields } : {}),
          ...(data.branding !== undefined ? { brandingJson: data.branding } : {}),
          ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brief-templates"] });
      void queryClient.invalidateQueries({ queryKey: ["brief-template", id] });
    },
  });
}

export function usePublishBriefTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchWithAuth(`/v1/brief-templates/${id}/publish`, {
        method: "POST",
      }) as Promise<{ data: { template: Record<string, unknown>; version: Record<string, unknown> } }>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brief-templates"] });
      void queryClient.invalidateQueries({ queryKey: ["brief-template", id] });
      void queryClient.invalidateQueries({ queryKey: ["brief-template", id, "versions"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });
}

export function useRestoreBriefTemplateVersion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      fetchWithAuth(`/v1/brief-templates/${id}/restore`, {
        method: "POST",
        body: JSON.stringify({ versionId }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brief-templates"] });
      void queryClient.invalidateQueries({ queryKey: ["brief-template", id] });
      void queryClient.invalidateQueries({ queryKey: ["brief-template", id, "versions"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
    },
  });
}

export function useDeleteBriefTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/v1/brief-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brief-templates"] });
    },
  });
}

export function getMarketplaceInstallsQueryOptions() {
  return {
    queryKey: ["marketplace-installs"],
    queryFn: async () => {
      const response = (await fetchWithAuth("/v1/brief-templates/marketplace/installs")) as {
        data: { installedSlugs: string[] };
      };
      return response;
    },
  };
}

export function useMarketplaceInstalls() {
  return useQuery<{ data: { installedSlugs: string[] } }>(getMarketplaceInstallsQueryOptions());
}

export function useInstallMarketplaceTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      fetchWithAuth(`/v1/brief-templates/install/${slug}`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["marketplace-installs"] });
      void queryClient.invalidateQueries({ queryKey: ["brief-templates"] });
    },
  });
}
