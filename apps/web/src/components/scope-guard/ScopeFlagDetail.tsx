"use client";

import { useState } from "react";
import {
  AlertTriangle, AlertCircle, Info, CheckCircle2, XCircle, Clock,
  FileText, Zap, MessageSquare, History, Send
} from "lucide-react";
import { Card, Badge, Button, Dialog, Textarea, useToast } from "@novabots/ui";
import { useUpdateScopeFlag } from "@/hooks/useScopeFlags";
import { useCreateChangeOrder } from "@/hooks/useChangeOrders";
import { cn } from "@novabots/ui";
import { formatDistanceToNow, format } from "date-fns";

interface ScopeFlagDetailProps {
  flag: any;
  open: boolean;
  onClose: () => void;
  projectId: string;
}

const SEVERITY_CONFIG: Record<string, {
  Icon: React.ElementType;
  badge: string;
  iconClass: string;
  label: string;
  borderClass: string;
}> = {
  high: {
    Icon: AlertCircle,
    badge: "bg-red-100 text-red-700 border-red-200",
    iconClass: "text-red-500",
    label: "High",
    borderClass: "border-l-red-500",
  },
  medium: {
    Icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    iconClass: "text-amber-500",
    label: "Medium",
    borderClass: "border-l-amber-500",
  },
  low: {
    Icon: Info,
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    iconClass: "text-blue-500",
    label: "Low",
    borderClass: "border-l-blue-500",
  },
};

function getSeverityDetailConfig(severity: string): typeof SEVERITY_CONFIG.high {
  return SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.medium;
}

export function ScopeFlagDetail({ flag, open, onClose, projectId }: ScopeFlagDetailProps) {
  const { toast } = useToast();
  const updateFlag = useUpdateScopeFlag(flag.id);
  const createCO = useCreateChangeOrder();

  const [aiResponse, setAiResponse] = useState(flag.aiReasoning ?? "");
  const [isActing, setIsActing] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const cfg = getSeverityDetailConfig(flag.severity)!;
  const Icon = cfg.Icon;
  const confidence = flag.metadata?.confidence
    ? Math.round(flag.metadata.confidence * 100)
    : flag.evidence?.confidence
      ? Math.round(flag.evidence.confidence * 100)
      : null;

  const handleConfirm = async () => {
    setIsActing(true);
    try {
      await updateFlag.mutateAsync({ status: "confirmed" });
      toast("success", "Flag confirmed");
      onClose();
    } catch {
      toast("error", "Failed to confirm flag");
    } finally {
      setIsActing(false);
    }
  };

  const handleDismiss = async () => {
    setIsActing(true);
    try {
      await updateFlag.mutateAsync({ status: "dismissed", reason: "Reviewed and determined to be in scope" });
      toast("success", "Flag marked as in-scope");
      onClose();
    } catch {
      toast("error", "Failed to update flag");
    } finally {
      setIsActing(false);
    }
  };

  const handleSnooze = async () => {
    setIsActing(true);
    try {
      await updateFlag.mutateAsync({ status: "snoozed" });
      toast("success", "Flag snoozed for 24 hours");
      onClose();
    } catch {
      toast("error", "Failed to snooze flag");
    } finally {
      setIsActing(false);
    }
  };

  const handleGenerateChangeOrder = async () => {
    setIsActing(true);
    try {
      await createCO.mutateAsync({
        projectId,
        scopeFlagId: flag.id,
        title: flag.title || "Scope Change Request",
        description: flag.description ?? undefined,
      });
      await updateFlag.mutateAsync({ status: "change_order_sent" });
      toast("success", "Change order created from flag");
      onClose();
    } catch {
      toast("error", "Failed to create change order");
    } finally {
      setIsActing(false);
    }
  };

  const isPending = flag.status === "pending";

  return (
    <Dialog open={open} onClose={onClose} title="Scope Flag Details">
      <div className="space-y-5">
        {/* Flag header */}
        <div className="flex items-start gap-3">
          <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", cfg.iconClass)} />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", cfg.badge)}>
                {cfg.label} Severity
              </span>
              <Badge status={flag.status === "pending" ? "flagged" : "active"} className="text-[10px]">
                {flag.status?.replace(/_/g, " ")}
              </Badge>
              {confidence != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                  <Zap className="h-2.5 w-2.5" />
                  {confidence}% confidence
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-[rgb(var(--text-primary))]">
              {flag.title || "Scope Deviation Detected"}
            </h3>
            {flag.description && (
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{flag.description}</p>
            )}
          </div>
        </div>

        {/* SOW Clause reference */}
        {flag.sowClauseId && (
          <Card className="flex items-start gap-3 border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--text-muted))]" />
            <div>
              <p className="text-xs font-semibold text-[rgb(var(--text-primary))]">Referenced SOW Clause</p>
              <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                Clause ID: {flag.sowClauseId.slice(0, 8)}...
              </p>
              {flag.evidence?.clauseText && (
                <p className="mt-1 text-xs italic text-[rgb(var(--text-muted))]">
                  "{flag.evidence.clauseText}"
                </p>
              )}
            </div>
          </Card>
        )}

        {/* AI Reasoning - editable */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
              AI Suggested Response
            </p>
          </div>
          <Textarea
            value={aiResponse}
            onChange={(e) => setAiResponse(e.target.value)}
            placeholder="AI reasoning will appear here..."
            rows={4}
            className="text-sm"
          />
          <p className="mt-1 text-[10px] text-[rgb(var(--text-muted))]">
            Edit this response before sending to the client.
          </p>
        </div>

        {/* Timeline */}
        <div>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex items-center gap-2 text-xs font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
          >
            <History className="h-3.5 w-3.5" />
            {showTimeline ? "Hide" : "Show"} History
          </button>
          {showTimeline && (
            <div className="mt-2 space-y-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[rgb(var(--text-primary))]">Flag created</p>
                  <p className="text-[10px] text-[rgb(var(--text-muted))]">
                    {format(new Date(flag.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              {flag.resolvedAt && (
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[rgb(var(--text-primary))]">
                      {flag.status === "dismissed" ? "Dismissed" : "Resolved"}
                    </p>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">
                      {format(new Date(flag.resolvedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {flag.reason && (
                      <p className="mt-0.5 text-[10px] text-[rgb(var(--text-muted))]">
                        Reason: {flag.reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {flag.snoozedUntil && (
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <Clock className="h-3 w-3 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[rgb(var(--text-primary))]">Snoozed until</p>
                    <p className="text-[10px] text-[rgb(var(--text-muted))]">
                      {formatDistanceToNow(new Date(flag.snoozedUntil), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isPending && (
          <div className="space-y-2 border-t border-[rgb(var(--border-subtle))] pt-4">
            <p className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
              Actions
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                onClick={() => void handleGenerateChangeOrder()}
                disabled={isActing}
                className="flex-1 bg-red-600 text-xs hover:bg-red-700"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Confirm & Generate Change Order
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleDismiss()}
                disabled={isActing}
                className="flex-1 text-xs"
              >
                Mark In-Scope
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void handleSnooze()}
                disabled={isActing}
                className="text-xs text-[rgb(var(--text-muted))]"
              >
                <Clock className="mr-1 h-3 w-3" />
                Snooze 24h
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
