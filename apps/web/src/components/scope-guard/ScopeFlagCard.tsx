"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, AlertCircle, Info, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, FileText, Zap, ExternalLink
} from "lucide-react";
import { Card, Badge, Button, Dialog, Textarea, useToast } from "@novabots/ui";
import { useUpdateScopeFlag } from "@/hooks/useScopeFlags";
import { useCreateChangeOrder } from "@/hooks/change-orders";
import { cn } from "@novabots/ui";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ScopeFlagCardProps {
  flag: any;
  projectId: string;
  onDetail?: () => void;
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

const STATUS_CONFIG: Record<string, { label: string; badgeStatus: string }> = {
  pending: { label: "Pending", badgeStatus: "flagged" },
  confirmed: { label: "Confirmed", badgeStatus: "active" },
  dismissed: { label: "Dismissed", badgeStatus: "draft" },
  snoozed: { label: "Snoozed", badgeStatus: "pending" },
  change_order_sent: { label: "Change Order Sent", badgeStatus: "active" },
  resolved: { label: "Resolved", badgeStatus: "active" },
};

type FlagAction = "confirm" | "in-scope" | "snooze" | null;

function getSeverityConfig(severity: string): typeof SEVERITY_CONFIG.high {
  return SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.medium;
}

function getStatusConfig(status: string): typeof STATUS_CONFIG.pending {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
}

export function ScopeFlagCard({ flag, projectId, onDetail }: ScopeFlagCardProps) {
  const { toast } = useToast();
  const updateFlag = useUpdateScopeFlag(flag.id);
  const createCO = useCreateChangeOrder();

  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<FlagAction>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const cfg = getSeverityConfig(flag.severity)!;
  const statusCfg = getStatusConfig(flag.status)!;
  const Icon = cfg.Icon;
  const isPending = flag.status === "pending";
  const confidence = flag.metadata?.confidence
    ? Math.round(flag.metadata.confidence * 100)
    : flag.evidence?.confidence
      ? Math.round(flag.evidence.confidence * 100)
      : null;

  const handleConfirm = async () => {
    setAction("confirm");
    setIsActing(true);
    try {
      await updateFlag.mutateAsync({ status: "confirmed" });
      toast("success", "Flag confirmed — change order will be generated");
    } catch {
      toast("error", "Failed to confirm flag");
    } finally {
      setIsActing(false);
    }
  };

  const handleInScope = async () => {
    setAction("in-scope");
    setIsActing(true);
    try {
      await updateFlag.mutateAsync({ status: "dismissed", reason: "Reviewed and determined to be in scope" });
      toast("success", "Flag marked as in-scope");
    } catch {
      toast("error", "Failed to update flag");
    } finally {
      setIsActing(false);
    }
  };

  const handleSnooze = async () => {
    setAction("snooze");
    setIsActing(true);
    try {
      await updateFlag.mutateAsync({ status: "snoozed" });
      toast("success", "Flag snoozed — will reappear in 24 hours");
    } catch {
      toast("error", "Failed to snooze flag");
    } finally {
      setIsActing(false);
    }
  };

  const handleDismissWithReason = async () => {
    if (!dismissReason.trim()) return;
    setIsActing(true);
    try {
      await updateFlag.mutateAsync({ status: "dismissed", reason: dismissReason.trim() });
      toast("success", "Flag dismissed with reason");
      setShowDismissDialog(false);
      setDismissReason("");
    } catch {
      toast("error", "Failed to dismiss flag");
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
      toast("success", "Change order created and sent");
    } catch {
      toast("error", "Failed to create change order");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          className={cn(
            "border-l-4 p-4 transition-all",
            cfg.borderClass,
            !isPending && "opacity-70",
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", cfg.iconClass)} />

            <div className="min-w-0 flex-1">
              {/* Badges row */}
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", cfg.badge)}>
                  {cfg.label}
                </span>
                <Badge status={statusCfg.badgeStatus as any} className="text-[10px]">
                  {statusCfg.label}
                </Badge>
                {confidence != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                    <Zap className="h-2.5 w-2.5" />
                    {confidence}%
                  </span>
                )}
              </div>

              {/* Message */}
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {flag.title || flag.description || "Scope deviation detected"}
              </p>

              {flag.description && flag.title && (
                <p className="mt-1 text-xs text-[rgb(var(--text-secondary))] line-clamp-2">
                  {flag.description}
                </p>
              )}

              {/* SOW clause reference */}
              {flag.sowClauseId && (
                <div className="mt-2 flex items-center gap-1.5 rounded-md bg-[rgb(var(--surface-subtle))] px-2.5 py-1.5">
                  <FileText className="h-3 w-3 text-[rgb(var(--text-muted))]" />
                  <span className="text-xs text-[rgb(var(--text-secondary))]">
                    References SOW clause
                  </span>
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 flex items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true })}
                </span>
              </div>

              {/* Expandable details */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 border-t border-[rgb(var(--border-subtle))] pt-3">
                      {flag.aiReasoning && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Reasoning</p>
                          <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                            {flag.aiReasoning}
                          </p>
                        </div>
                      )}
                      {flag.evidence && Object.keys(flag.evidence).length > 0 && (
                        <pre className="overflow-x-auto rounded-lg bg-[rgb(var(--surface-subtle))] p-3 text-[10px] text-[rgb(var(--text-secondary))]">
                          {JSON.stringify(flag.evidence, null, 2)}
                        </pre>
                      )}
                      <Link
                        href={`/projects/${projectId}/scope-guard`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View in Scope Guard
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons for pending flags */}
              {isPending && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleGenerateChangeOrder()}
                    disabled={isActing}
                    className="bg-red-600 text-xs hover:bg-red-700"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Confirm & Generate Change Order
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleInScope()}
                    disabled={isActing}
                    className="text-xs"
                  >
                    Mark In-Scope
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDismissDialog(true)}
                    disabled={isActing}
                    className="text-xs text-[rgb(var(--text-muted))]"
                  >
                    Dismiss with Reason
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
              )}
            </div>

            {/* Expand / detail toggle */}
            <div className="flex shrink-0 flex-col items-center gap-1">
              <button
                onClick={() => setExpanded(!expanded)}
                className="rounded p-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {onDetail && (
                <button
                  onClick={onDetail}
                  className="rounded p-1 text-[rgb(var(--text-muted))] hover:text-primary"
                  title="View full details"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Dismiss with Reason Dialog */}
      <Dialog open={showDismissDialog} onClose={() => setShowDismissDialog(false)} title="Dismiss Flag — Provide Reason">
        <div className="space-y-4">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Explain why this flag is being dismissed. This will be recorded in the audit log.
          </p>
          <Textarea
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="e.g. This request was covered under clause 3.2 of the SOW..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowDismissDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleDismissWithReason()}
              disabled={!dismissReason.trim() || isActing}
            >
              {isActing ? "Dismissing..." : "Dismiss"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
