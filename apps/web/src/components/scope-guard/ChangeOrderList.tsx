"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSignature, Clock, CheckCircle2, XCircle, Send, DollarSign,
  Filter, Plus, ChevronRight, AlertCircle
} from "lucide-react";
import { Card, Badge, Button, Skeleton } from "@novabots/ui";
import { useChangeOrders } from "@/hooks/useChangeOrders";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@novabots/ui";
import { EmptyState } from "@/components/shared/EmptyState";

interface ChangeOrderListProps {
  projectId?: string;
  onCreate?: () => void;
  onEdit?: (co: any) => void;
}

type StatusFilter = "all" | "draft" | "sent" | "accepted" | "declined" | "expired";

const STATUS_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  badgeStatus: string;
  label: string;
}> = {
  draft: { icon: FileSignature, color: "text-[rgb(var(--text-muted))]", badgeStatus: "draft", label: "Draft" },
  sent: { icon: Send, color: "text-blue-500", badgeStatus: "active", label: "Sent" },
  accepted: { icon: CheckCircle2, color: "text-emerald-500", badgeStatus: "active", label: "Accepted" },
  declined: { icon: XCircle, color: "text-red-500", badgeStatus: "flagged", label: "Declined" },
  expired: { icon: AlertCircle, color: "text-[rgb(var(--text-muted))]", badgeStatus: "draft", label: "Expired" },
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
];

function getCOStatusConfig(status: string): typeof STATUS_CONFIG.draft {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
}

export function ChangeOrderList({ projectId, onCreate, onEdit }: ChangeOrderListProps) {
  const { data, isLoading } = useChangeOrders(projectId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const cos: any[] = data?.data ?? [];

  const filtered = useMemo(() => {
    if (statusFilter === "all") return cos;
    return cos.filter((c: any) => c.status === statusFilter);
  }, [cos, statusFilter]);

  const acceptedValue = cos
    .filter((c: any) => c.status === "accepted")
    .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {(cos.length > 0 || acceptedValue > 0) && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-3">
          <div className="text-sm">
            <span className="text-[rgb(var(--text-muted))]">Total: </span>
            <span className="font-semibold text-[rgb(var(--text-primary))]">{cos.length}</span>
          </div>
          {acceptedValue > 0 && (
            <div className="text-sm">
              <span className="text-[rgb(var(--text-muted))]">Accepted value: </span>
              <span className="font-semibold text-emerald-600">${acceptedValue.toLocaleString()}</span>
            </div>
          )}
          <div className="ml-auto">
            {onCreate && (
              <Button size="sm" onClick={onCreate}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Change Order
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        {STATUS_OPTIONS.map((opt) => {
          const count = opt.value === "all"
            ? cos.length
            : cos.filter((c: any) => c.status === opt.value).length;
          if (count === 0 && opt.value !== "all") return null;
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                statusFilter === opt.value
                  ? "bg-primary text-white"
                  : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]",
              )}
            >
              {opt.label}
              {count > 0 && (
                <span className="ml-1 text-[10px] opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title={
            statusFilter === "all"
              ? "No change orders yet"
              : `No ${statusFilter} change orders`
          }
          description={
            statusFilter === "all"
              ? "Change orders are created from scope flags or manually."
              : "No change orders match the current filter."
          }
          actionButton={
            statusFilter === "all" && onCreate ? (
              <Button size="sm" onClick={onCreate}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Change Order
              </Button>
            ) : undefined
          }
        />
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {filtered.map((co: any) => {
              const cfg = getCOStatusConfig(co.status)!;
              const StatusIcon = cfg.icon;
              const badgeStatus = cfg.badgeStatus as any;
              const statusLabel = cfg.label;
              const iconColor = cfg.color;

              return (
                <motion.div
                  key={co.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    className={cn(
                      "group cursor-pointer p-4 transition-all hover:shadow-sm",
                      onEdit && "hover:border-primary/40",
                    )}
                    onClick={() => onEdit?.(co)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3 flex-1">
                        <div className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          co.status === "accepted" ? "bg-emerald-50" :
                          co.status === "declined" ? "bg-red-50" :
                          co.status === "sent" ? "bg-blue-50" :
                          "bg-[rgb(var(--surface-subtle))]",
                        )}>
                          <StatusIcon className={cn("h-4 w-4", iconColor)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                              {co.title}
                            </p>
                            <Badge status={badgeStatus} className="shrink-0 text-[10px]">
                              {statusLabel}
                            </Badge>
                          </div>
                          {co.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-[rgb(var(--text-secondary))]">
                              {co.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
                            <span>#{co.id.slice(0, 8)}</span>
                            <span>·</span>
                            <span>{format(new Date(co.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        {co.amount != null && co.amount > 0 && (
                          <div className="text-right">
                            <p className="text-sm font-bold text-[rgb(var(--text-primary))]">
                              ${Number(co.amount).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {co.status === "draft" && onEdit && (
                          <ChevronRight className="h-4 w-4 text-[rgb(var(--text-muted))] opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
