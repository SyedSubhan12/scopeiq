import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface Deliverable {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  status: "not_started" | "in_progress" | "in_review" | "revision_requested" | "approved";
  file_url?: string | null;
  file_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  object_key?: string | null;
  revision_round: number;
  revision_limit: number;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadUrlResponse {
  upload_url: string;
  object_key: string;
}

export function useDeliverables(projectId: string) {
  return useQuery({
    queryKey: ["deliverables", projectId],
    queryFn: () => fetchWithAuth(`/v1/projects/${projectId}/deliverables`),
    enabled: !!projectId,
  });
}

export function useDeliverable(id: string) {
  return useQuery({
    queryKey: ["deliverable", id],
    queryFn: () => fetchWithAuth(`/v1/deliverables/${id}`),
    enabled: !!id,
  });
}

export function useCreateDeliverable(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      revision_limit?: number;
      due_date?: string;
    }) =>
      fetchWithAuth(`/v1/projects/${projectId}/deliverables`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
    },
  });
}

export function useUpdateDeliverable(id: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?: string;
      description?: string;
      status?: Deliverable["status"];
      revision_limit?: number;
      due_date?: string;
    }) =>
      fetchWithAuth(`/v1/deliverables/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["deliverable", id] });
    },
  });
}

export function useDeleteDeliverable(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/v1/deliverables/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
    },
  });
}

export function useGetUploadUrl() {
  return useMutation({
    mutationFn: ({
      deliverableId,
      file_name,
      content_type,
      file_size,
    }: {
      deliverableId: string;
      file_name: string;
      content_type: string;
      file_size: number;
    }) =>
      fetchWithAuth(`/v1/deliverables/${deliverableId}/upload-url`, {
        method: "POST",
        body: JSON.stringify({ file_name, content_type, file_size }),
      }) as Promise<{ data: UploadUrlResponse }>,
  });
}

export function useConfirmUpload(deliverableId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ object_key }: { object_key: string }) =>
      fetchWithAuth(`/v1/deliverables/${deliverableId}/confirm-upload`, {
        method: "POST",
        body: JSON.stringify({ object_key }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["deliverable", deliverableId] });
    },
  });
}

/**
 * Orchestrates the 3-step presigned URL upload:
 * 1. Get upload URL from API
 * 2. Upload file directly to R2 via PUT
 * 3. Confirm upload with object_key
 */
export async function uploadDeliverableFile(
  deliverableId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ upload_url: string; object_key: string }> {
  // Step 1: Get presigned URL
  const urlResponse = await fetchWithAuth(`/v1/deliverables/${deliverableId}/upload-url`, {
    method: "POST",
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type,
      file_size: file.size,
    }),
  }) as { data: UploadUrlResponse };

  const { upload_url, object_key } = urlResponse.data;

  // Step 2: Upload directly to R2 using XHR for progress tracking
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", upload_url);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(file);
  });

  // Step 3: Confirm upload
  await fetchWithAuth(`/v1/deliverables/${deliverableId}/confirm-upload`, {
    method: "POST",
    body: JSON.stringify({ object_key }),
  });

  return { upload_url, object_key };
}
