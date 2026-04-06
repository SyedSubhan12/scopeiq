"use client";

import { useState } from "react";
import { Send, X, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { Card, Button, useToast } from "@novabots/ui";
import { fetchWithAuth } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@novabots/ui";

interface MessageIngestInputProps {
  projectId: string;
  className?: string;
}

type CheckStatus = "idle" | "checking" | "in_scope" | "flagged" | "error";

export function MessageIngestInput({ projectId, className }: MessageIngestInputProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [source, setSource] = useState<"manual_input" | "email" | "portal">("manual_input");
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [resultMessage, setResultMessage] = useState("");

  const handleCheck = async () => {
    if (!text.trim()) return;

    setStatus("checking");
    setResultMessage("");

    try {
      const result = await fetchWithAuth(`/v1/projects/${projectId}/messages/ingest`, {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          authorName: authorName.trim() || undefined,
          source,
        }),
      }) as { data?: { inScope: boolean; message?: string; flagId?: string } };

      const inScope = result?.data?.inScope ?? true;
      const msg = result?.data?.message ?? (inScope ? "Message is within scope" : "Potential scope deviation detected");

      if (inScope) {
        setStatus("in_scope");
      } else {
        setStatus("flagged");
      }
      setResultMessage(msg);

      setText("");
      setAuthorName("");

      // Refresh scope flags after a short delay to allow async processing
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["scope-flags", projectId] });
      }, 3000);
    } catch {
      setStatus("error");
      setResultMessage("Failed to analyze message. Please try again.");
      toast("error", "Failed to queue message for analysis");
    }
  };

  const reset = () => {
    setStatus("idle");
    setResultMessage("");
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80"
      >
        <MessageSquare className="h-4 w-4" />
        Check a client message against scope
      </button>
    );
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
          Manual Scope Check
        </p>
        <button
          onClick={reset}
          className="rounded p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-default))] hover:text-[rgb(var(--text-primary))]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {/* Message text */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a client message to check against the SOW..."
          rows={3}
          className="w-full resize-none rounded-xl border border-[rgb(var(--border-default))] p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={status === "checking"}
        />

        {/* Optional fields */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Author name (optional)"
              className="w-full rounded-xl border border-[rgb(var(--border-default))] px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={status === "checking"}
            />
          </div>
          <div className="relative">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="appearance-none rounded-xl border border-[rgb(var(--border-default))] bg-white px-3 py-2 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={status === "checking"}
            >
              <option value="manual_input">Manual Input</option>
              <option value="email">Email</option>
              <option value="portal">Portal</option>
            </select>
          </div>
        </div>

        {/* Result */}
        {status !== "idle" && status !== "checking" && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm",
              status === "in_scope"
                ? "bg-green-50 text-green-700"
                : status === "flagged"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700",
            )}
          >
            {status === "in_scope" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            ) : status === "flagged" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            )}
            <span>{resultMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => void handleCheck()}
            disabled={status === "checking" || !text.trim()}
          >
            {status === "checking" ? (
              <>
                <Send className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Check Scope
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={reset}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
