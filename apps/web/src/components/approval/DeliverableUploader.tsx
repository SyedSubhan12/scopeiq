"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle, ImageIcon, Video, FileArchive } from "lucide-react";
import { Button, Dialog, useToast } from "@novabots/ui";
import { uploadDeliverableFile } from "@/hooks/useDeliverables";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@novabots/ui";

interface DeliverableUploaderProps {
  deliverableId: string;
  projectId: string;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const ACCEPTED_TYPES = [
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml",
  "application/pdf",
  "video/mp4", "video/quicktime", "video/webm",
  "application/zip", "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const ACCEPT_STRING = ACCEPTED_TYPES.join(",");

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />;
  if (file.type.startsWith("video/")) return <Video className="h-8 w-8 text-indigo-500" />;
  if (file.type === "application/pdf") return <FileText className="h-8 w-8 text-red-500" />;
  if (file.type === "application/zip" || file.type === "application/x-zip-compressed")
    return <FileArchive className="h-8 w-8 text-amber-500" />;
  return <FileText className="h-8 w-8 text-[rgb(var(--text-muted))]" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeliverableUploader({
  deliverableId,
  projectId,
  open,
  onClose,
  onComplete,
}: DeliverableUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setStatus("idle");
  }, []);

  const handleClose = () => {
    if (status !== "uploading") {
      reset();
      onClose();
    }
  };

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE) return "File exceeds 500MB limit";
    return null;
  };

  const handleFileSelect = (f: File) => {
    const error = validateFile(f);
    if (error) { toast("error", error); return; }
    setFile(f);
    setStatus("idle");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const handleBrowse = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPT_STRING;
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) handleFileSelect(f);
    };
    input.click();
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);

    try {
      await uploadDeliverableFile(deliverableId, file, (p) => setProgress(p));
      setStatus("success");
      // Invalidate queries so the deliverable list + viewer refresh
      void queryClient.invalidateQueries({ queryKey: ["deliverables", projectId] });
      void queryClient.invalidateQueries({ queryKey: ["deliverable", deliverableId] });
      toast("success", "File uploaded successfully");
      setTimeout(() => {
        reset();
        onComplete();
        onClose();
      }, 800);
    } catch (err) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Upload failed";
      toast("error", message);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Upload New Version">
      <div className="space-y-4">
        {/* Drop zone */}
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={handleBrowse}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-[rgb(var(--border-default))] hover:border-primary/50 hover:bg-[rgb(var(--surface-subtle))]",
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                Drop your file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                Images, PDFs, videos, documents, ZIP — up to 500MB
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[rgb(var(--border-default))] p-4">
            <div className="flex items-center gap-3">
              {getFileIcon(file)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                  {file.name}
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  {formatSize(file.size)}
                  {file.type && ` · ${file.type}`}
                </p>
              </div>
              {status === "idle" && (
                <button onClick={reset} className="rounded p-1 text-[rgb(var(--text-muted))] hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              )}
              {status === "success" && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />}
              {status === "error" && <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />}
            </div>

            {status === "uploading" && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-[rgb(var(--text-muted))]">{progress}%</p>
              </div>
            )}

            {status === "error" && (
              <p className="mt-2 text-xs text-red-500">
                Upload failed. Check your connection and try again.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={handleClose} disabled={status === "uploading"}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void handleUpload()}
            disabled={!file || status === "uploading" || status === "success"}
          >
            {status === "uploading" ? `Uploading ${progress}%…` : "Upload File"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
