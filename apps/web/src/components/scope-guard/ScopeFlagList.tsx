"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Filter, ShieldAlert } from "lucide-react";
import { Card, Skeleton } from "@novabots/ui";
import { useScopeFlags } from "@/hooks/useScopeFlags";
import { ScopeFlagCard } from "./ScopeFlagCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@novabots/ui";

interface ScopeFlagListProps {
  projectId?: string;
}

type StatusFilter = "all" | "pending" | "confirmed" | "dismissed" | "snoozed";
type SeverityFilter = "all" | "high" | "medium" | "low";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "dismissed", label: "Dismissed" },
  { value: "snoozed", label: "Snoozed" },
];

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "All Severities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function ScopeFlagList({ projectId }: ScopeFlagListProps) {
  const { data, isLoading } = useScopeFlags(projectId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const flags: any[] = data?.data ?? [];

  const filtered = useMemo(() => {
    return flags.filter((flag: any) => {
      if (statusFilter !== "all" && flag.status !== statusFilter) return false;
      if (severityFilter !== "all" && flag.severity !== severityFilter) return false;
      return true;
    });
  }, [flags, statusFilter, severityFilter]);

  const pendingCount = flags.filter(
    (f: any) => f.status === "pending" || f.status === "pending_review",
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          <span className="text-xs font-medium text-[rgb(var(--text-muted))]">Status:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => {
            const count = opt.value === "all"
              ? flags.length
              : flags.filter((f: any) => f.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
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

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs font-medium text-[rgb(var(--text-muted))]">Severity:</span>
          <div className="flex gap-1.5">
            {SEVERITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSeverityFilter(opt.value)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  severityFilter === opt.value
                    ? "bg-[rgb(var(--text-primary))] text-white"
                    : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-subtle))]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flag list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title={
            statusFilter === "pending"
              ? "No pending flags"
              : `No ${statusFilter} flags`
          }
          description={
            statusFilter === "pending"
              ? "All scope items have been processed. Great job!"
              : "No flags match the current filters."
          }
        />
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-3">
            {filtered.map((flag: any) => (
              <ScopeFlagCard
                key={flag.id}
                flag={flag}
                projectId={flag.projectId ?? projectId}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
