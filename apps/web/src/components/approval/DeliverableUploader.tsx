"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Dialog, useToast } from "@novabots/ui";
import { uploadDeliverableFile } from "@/hooks/useDeliverables";

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
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/zip",
  "video/mp4",
  "video/quicktime",
];

export function DeliverableUploader({
  deliverableId,
  projectId,
  open,
  onClose,
  onComplete,
}: DeliverableUploaderProps) {
  const { toast } = useToast();
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
    if (!ACCEPTED_TYPES.includes(f.type) && f.type !== "") return "Unsupported file type";
    return null;
  };

  const handleFileSelect = (f: File) => {
    const error = validateFile(f);
    if (error) {
      toast("error", error);
      return;
    }
    setFile(f);
    setStatus("idle");
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [],
  );

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);

    try {
      await uploadDeliverableFile(deliverableId, file, (p) => setProgress(p));
      setStatus("success");
      toast("success", "File uploaded successfully");
      setTimeout(() => {
        reset();
        onComplete();
        onClose();
      }, 1000);
    } catch {
      setStatus("error");
      toast("error", "Upload failed. Please try again.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Upload Deliverable">
      <div className="space-y-4">
        {/* Drop zone */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-[rgb(var(--border-default))] hover:border-primary/40"
            }`}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ACCEPTED_TYPES.join(",");
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) handleFileSelect(f);
              };
              input.click();
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                Drop your file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                Images, PDFs, videos up to 500MB
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-[rgb(var(--border-default))] p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[rgb(var(--text-primary))]">
                  {file.name}
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  {formatSize(file.size)} &middot; {file.type || "Unknown type"}
                </p>
              </div>
              {status === "idle" && (
                <button onClick={reset} className="text-[rgb(var(--text-muted))] hover:text-status-red">
                  <X className="h-4 w-4" />
                </button>
              )}
              {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
            </div>

            {/* Progress bar */}
            {status === "uploading" && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-[rgb(var(--text-muted))]">
                  {progress}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={handleClose} disabled={status === "uploading"}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void handleUpload()}
            disabled={!file || status === "uploading" || status === "success"}
          >
            {status === "uploading" ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
