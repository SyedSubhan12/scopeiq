import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export interface Deliverable {
  id: string;
  projectId: string;
  workspaceId: string;
  name: string;
  description: string | null;
  type: "file" | "figma" | "loom" | "youtube" | "link";
  status: "draft" | "delivered" | "in_review" | "changes_requested" | "approved";
  fileUrl: string | null;
  fileKey: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  originalName: string | null;
  externalUrl: string | null;
  metadata: Record<string, unknown> | null;
  revisionRound: number;
  maxRevisions: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  upload_url: string;
  object_key: string;
}

export function useDeliverables(projectId: string) {
  return useQuery<{ data: Deliverable[] }>({
    queryKey: ["deliverables", projectId],
    queryFn: () => fetchWithAuth(`/v1/projects/${projectId}/deliverables`) as Promise<{ data: Deliverable[] }>,
    enabled: !!projectId,
  });
}

export function useDeliverable(id: string) {
  return useQuery<{ data: Deliverable }>({
    queryKey: ["deliverable", id],
    queryFn: () => fetchWithAuth(`/v1/deliverables/${id}`) as Promise<{ data: Deliverable }>,
    enabled: !!id,
  });
}

export function useCreateDeliverable(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      type?: Deliverable["type"];
      externalUrl?: string;
      metadata?: Record<string, unknown>;
      maxRevisions?: number;
      dueDate?: string;
    }) =>
      fetchWithAuth(`/v1/projects/${projectId}/deliverables`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
      metadata?: Record<string, unknown>;
      maxRevisions?: number;
      dueDate?: string;
    }) =>
      fetchWithAuth(`/v1/deliverables/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["deliverable", id] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useGetUploadUrl() {
  return useMutation({
    mutationFn: ({
      deliverableId,
      fileName,
      contentType,
      fileSize,
    }: {
      deliverableId: string;
      fileName: string;
      contentType: string;
      fileSize: number;
    }) =>
      fetchWithAuth(`/v1/deliverables/${deliverableId}/upload-url`, {
        method: "POST",
        body: JSON.stringify({ fileName, contentType, fileSize }),
      }) as Promise<{ data: UploadUrlResponse }>,
  });
}

export function useConfirmUpload(deliverableId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ objectKey, originalName }: { objectKey: string; originalName?: string }) =>
      fetchWithAuth(`/v1/deliverables/${deliverableId}/confirm-upload`, {
        method: "POST",
        body: JSON.stringify({ objectKey, originalName }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["deliverable", deliverableId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Orchestrates the 3-step presigned URL upload:
 * 1. Get upload URL from API
 * 2. Upload file directly to R2 via PUT
 * 3. Confirm upload with objectKey
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
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
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
    body: JSON.stringify({ objectKey: object_key, originalName: file.name }),
  });

  return { upload_url, object_key };
}
