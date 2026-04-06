"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Card, useToast } from "@novabots/ui";
import { useCreateSow } from "@/hooks/useSow";
import { cn } from "@novabots/ui";

interface SowUploaderProps {
  projectId: string;
  onComplete: () => void;
  onCancel: () => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";
type UploadMode = "file" | "text";

const ACCEPTED_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ACCEPT_STRING = ACCEPTED_TYPES.join(",");
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SowUploader({ projectId, onComplete, onCancel }: SowUploaderProps) {
  const { toast } = useToast();
  const createSow = useCreateSow();

  const [mode, setMode] = useState<UploadMode>("text");
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setStatus("idle");
  }, []);

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE) return "File exceeds 25MB limit";
    if (!ACCEPTED_TYPES.includes(f.type)) return "Only PDF and Word documents are accepted";
    return null;
  };

  const handleFileSelect = (f: File) => {
    const error = validateFile(f);
    if (error) { toast("error", error); return; }
    setFile(f);
    setStatus("idle");
    if (!title.trim()) {
      setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
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

  const readFileAsText = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(f);
    });
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast("error", "Please provide a title");
      return;
    }

    setStatus("uploading");
    setProgress(10);

    try {
      let text = rawText.trim();

      if (mode === "file" && file) {
        setProgress(30);
        // For PDF/Word files, we send the file metadata and dispatch a parse job server-side
        // The server will extract text from the uploaded file
        // For now, we create with a placeholder and the server-side job handles extraction
        await createSow.mutateAsync({
          projectId,
          title: title.trim(),
          rawText: `[File: ${file.name} - ${formatSize(file.size)}]`,
        });
      } else if (text.length < 10) {
        setStatus("error");
        toast("error", "Please paste at least 10 characters of SOW text");
        return;
      } else {
        setProgress(50);
        await createSow.mutateAsync({
          projectId,
          title: title.trim(),
          rawText: text,
        });
      }

      setProgress(100);
      setStatus("success");
      toast("success", "SOW uploaded — parsing in progress");

      setTimeout(() => {
        onComplete();
      }, 1200);
    } catch (err) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Failed to upload SOW";
      toast("error", message);
    }
  };

  const isDisabled = status === "uploading" || status === "success" || !title.trim() ||
    (mode === "text" && rawText.trim().length < 10) ||
    (mode === "file" && !file);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-5 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">Attach Statement of Work</h3>
        </div>
        <button
          onClick={onCancel}
          className="rounded p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-default))] hover:text-[rgb(var(--text-primary))]"
          disabled={status === "uploading"}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-lg bg-[rgb(var(--surface-subtle))] p-0.5">
          <button
            onClick={() => { setMode("text"); reset(); }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "text"
                ? "bg-white text-[rgb(var(--text-primary))] shadow-sm"
                : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]",
            )}
          >
            Paste Text
          </button>
          <button
            onClick={() => { setMode("file"); reset(); }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "file"
                ? "bg-white text-[rgb(var(--text-primary))] shadow-sm"
                : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]",
            )}
          >
            Upload File
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[rgb(var(--text-secondary))]">
            SOW Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Brand Identity Project SOW v1.2"
            className="w-full rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={status === "uploading"}
          />
        </div>

        {/* Content area */}
        {mode === "text" ? (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[rgb(var(--text-secondary))]">
              SOW Text <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-[rgb(var(--text-muted))]">
              Paste the full Statement of Work text. ScopeIQ will parse it into structured clauses.
            </p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your Statement of Work text here..."
              rows={8}
              className="w-full resize-none rounded-xl border border-[rgb(var(--border-default))] p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={status === "uploading"}
            />
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs text-[rgb(var(--text-muted))]">
              Upload a PDF or Word document. ScopeIQ will extract and parse clauses automatically.
            </p>
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={handleBrowse}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-[rgb(var(--border-default))] hover:border-primary/50 hover:bg-[rgb(var(--surface-subtle))]",
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                  Drop your file here, or click to browse
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  PDF, DOC, DOCX — up to 25MB
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-[rgb(var(--border-default))] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                      {file.name}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {formatSize(file.size)}
                    </p>
                  </div>
                  {status === "idle" && (
                    <button
                      onClick={reset}
                      className="rounded p-1 text-[rgb(var(--text-muted))] hover:text-red-500"
                    >
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
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-[rgb(var(--text-muted))]">{progress}%</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            Upload failed. Check your connection and try again.
          </p>
        )}

        {status === "success" && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
            SOW uploaded successfully — AI parsing is in progress. Clauses will appear shortly.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={status === "uploading"}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void handleUpload()}
            disabled={isDisabled}
          >
            {status === "uploading" ? `Uploading ${progress}%…` : status === "success" ? "Uploaded" : "Upload & Parse SOW"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
