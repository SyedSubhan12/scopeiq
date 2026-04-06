import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface BriefField {
  key: string;
  type: "text" | "textarea" | "single_choice" | "multi_choice" | "date" | "file_upload";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  conditions?: {
    field_key: string;
    operator: "equals" | "not_equals" | "contains";
    value: string;
  }[];
  order: number;
}

export interface BriefTemplate {
  id: string;
  name: string;
  description?: string;
  fields: BriefField[];
  createdAt: string;
  updatedAt: string;
}

export function getBriefTemplatesQueryOptions() {
  return {
    queryKey: ["brief-templates"],
    queryFn: () => fetchWithAuth("/v1/brief-templates") as Promise<{ data: any[] }>,
  };
}

export function useBriefTemplates() {
  return useQuery<{ data: any[] }>(getBriefTemplatesQueryOptions());
}

export function useBriefTemplate(id: string) {
  return useQuery<{ data: any }>({
    queryKey: ["brief-template", id],
    queryFn: () => fetchWithAuth(`/v1/brief-templates/${id}`) as Promise<{ data: any }>,
    enabled: !!id,
  });
}

export function useCreateBriefTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; fields?: BriefField[] }) =>
      fetchWithAuth("/v1/brief-templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brief-templates"] });
    },
  });
}

export function useUpdateBriefTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; fields?: BriefField[] }) =>
      fetchWithAuth(`/v1/brief-templates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["brief-templates"] });
      void queryClient.invalidateQueries({ queryKey: ["brief-template", id] });
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
