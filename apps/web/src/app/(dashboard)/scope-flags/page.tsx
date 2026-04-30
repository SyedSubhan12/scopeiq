"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ScopePatternAlerts } from "@/components/scope-guard/ScopePatternAlerts";
import { PageEnter } from "@/components/shared/PageEnter";
import { StatusPill } from "@/components/ui/StatusPill";
import { useRowReveal } from "@/hooks/useRowReveal";
import {
  ShieldAlert,
  Filter,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Card, Badge, Skeleton, Button, useToast, cn } from "@novabots/ui";
import { AnimatePresence, motion } from "framer-motion";
import { fetchWithAuth } from "@/lib/api";
import { formatDistanceToNow, differenceInHours, isToday, isYesterday, isThisWeek } from "date-fns";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getProjectsQueryOptions, useProjects } from "@/hooks/useProjects";
import { queryClient } from "@/lib/query-client";
import { getScopeFlagsQueryOptions, useScopeFlags } from "@/hooks/useScopeFlags";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScopeFlag {
  id: string;
  status: string;
  severity: string;
  flagType?: string;
  reason?: string;
  title?: string;
  snippet?: string;
  projectId?: string;
  project?: { name: string } | null;
  client?: { name: string } | null;
  confidence?: number;
  createdAt: string;
  updatedAt?: string;
  suggestedResponse?: string;
  sowContext?: string;
}

// ---------------------------------------------------------------------------
// Priority scoring
// ---------------------------------------------------------------------------

function recencyBonus(createdAt: string): number {
  const hours = differenceInHours(new Date(), new Date(createdAt));
  if (hours < 24) return 3;
  if (hours < 48) return 1;
  return 0;
}

function severityWeight(severity: string): number {
  if (severity === "high" || severity === "critical") return 3;
  if (severity === "medium") return 2;
  return 1;
}

function priorityScore(flag: ScopeFlag): number {
  const sw = severityWeight(flag.severity);
  const conf = flag.confidence ?? 0.5;
  const rb = recencyBonus(flag.createdAt);
  return sw * 3 + conf * 20 + rb;
}

// ---------------------------------------------------------------------------
// Date grouping
// ---------------------------------------------------------------------------

type DateGroup = "Today" | "Yesterday" | "Earlier this week" | "Older";

function dateGroup(createdAt: string): DateGroup {
  const d = new Date(createdAt);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "Earlier this week";
  return "Older";
}

const GROUP_ORDER: DateGroup[] = ["Today", "Yesterday", "Earlier this week", "Older"];

// ---------------------------------------------------------------------------
// Filter constants
// ---------------------------------------------------------------------------

const STATUS_FILTERS = [
  "all",
  "pending",
  "confirmed",
  "dismissed",
  "snoozed",
  "change_order_sent",
  "resolved",
];
const SEVERITY_FILTERS = ["all", "high", "medium", "low"];

// ---------------------------------------------------------------------------
// Severity dot
// ---------------------------------------------------------------------------

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};

function SeverityDot({ severity }: { severity: string }) {
  return (
    <span
      className={cn(
        "mt-0.5 h-2 w-2 shrink-0 rounded-full",
        SEVERITY_DOT[severity] ?? "bg-slate-400",
      )}
      title={severity}
    />
  );
}

// ---------------------------------------------------------------------------
// Confidence badge
// ---------------------------------------------------------------------------

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? "bg-emerald-50 text-emerald-600"
      : pct >= 60
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-500";
  return (
    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold", color)}>
      {pct}% confidence
    </span>
  );
}

// ---------------------------------------------------------------------------
// Flag card
// ---------------------------------------------------------------------------

function FlagCard({
  flag,
  onAction,
}: {
  flag: ScopeFlag;
  onAction: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending =
    flag.status === "pending" || flag.status === "pending_review";
  const message = flag.reason ?? flag.title ?? "Scope signal detected";
  const excerpt = message.length > 120 ? message.slice(0, 120) + "…" : message;
  const projectName = flag.project?.name ?? "Unknown project";
  const clientName = flag.client?.name;
  const timeAgo = formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true });
  const confidence = flag.confidence ?? 0.7;

  return (
    <div
      className={cn(
        "reveal-row overflow-hidden rounded-xl border transition-all",
        isPending
          ? "border-l-4 border-[rgb(var(--border-subtle))] border-l-[var(--status-flagged)]"
          : "border-[rgb(var(--border-subtle))] opacity-75",
      )}
      style={{ boxShadow: expanded ? "var(--shadow-card-hover)" : "var(--shadow-card)" }}
    >
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgb(var(--surface-subtle))]"
      >
        <SeverityDot severity={flag.severity} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{excerpt}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
            <span className="flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              {projectName}
            </span>
            {clientName && (
              <>
                <span className="opacity-40">·</span>
                <span>{clientName}</span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span className="font-mono">{timeAgo}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ConfidenceBadge value={confidence} />
          <StatusPill status={flag.status} size="sm" />
          {isPending && (
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                className="h-7 rounded-md bg-emerald-600 px-2.5 text-xs hover:bg-emerald-700"
                onClick={() => onAction(flag.id, "resolved")}
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-md px-2.5 text-xs text-[rgb(var(--text-muted))] hover:text-red-500"
                onClick={() => onAction(flag.id, "dismissed")}
              >
                Dismiss
              </Button>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-[rgb(var(--border-subtle))] px-4 py-4">
              {/* Full message */}
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                  Full Message
                </p>
                <p className="text-sm text-[rgb(var(--text-secondary))]">{message}</p>
              </div>

              {/* SOW context */}
              {flag.sowContext && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    SOW Context
                  </p>
                  <p className="rounded-lg bg-[rgb(var(--surface-subtle))] px-3 py-2 text-xs italic text-[rgb(var(--text-secondary))]">
                    &quot;{flag.sowContext}&quot;
                  </p>
                </div>
              )}

              {/* Snippet */}
              {flag.snippet && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    Detected Snippet
                  </p>
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs italic text-amber-700">
                    &quot;{flag.snippet}&quot;
                  </p>
                </div>
              )}

              {/* Suggested response */}
              {flag.suggestedResponse && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    Suggested Response
                  </p>
                  <p className="rounded-lg border border-[rgb(var(--border-subtle))] px-3 py-2 text-xs text-[rgb(var(--text-secondary))]">
                    {flag.suggestedResponse}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <Link
                  href={`/projects/${flag.projectId ?? ""}/scope-guard`}
                  className="flex items-center gap-1 text-xs text-[rgb(var(--primary))] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  View in project
                </Link>
                {flag.flagType && (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-[rgb(var(--text-muted))]">
                    {flag.flagType.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ScopeFlagsPage() {
  useAssetsReady({
    scopeId: "page:scope-flags",
    tasks: [
      () => queryClient.ensureQueryData(getScopeFlagsQueryOptions()),
      () => queryClient.ensureQueryData(getProjectsQueryOptions()),
    ],
  });

  const { data, isLoading, refetch } = useScopeFlags();
  const { data: projectsData } = useProjects();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const flags: ScopeFlag[] = data?.data ?? [];
  const projects: { id: string; name: string }[] = projectsData?.data ?? [];

  const filtered = useMemo(() => {
    return flags.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (projectFilter !== "all" && f.projectId !== projectFilter) return false;
      return true;
    });
  }, [flags, statusFilter, severityFilter, projectFilter]);

  // Priority-sort
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => priorityScore(b) - priorityScore(a)),
    [filtered],
  );

  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<DateGroup, ScopeFlag[]>();
    for (const g of GROUP_ORDER) groups.set(g, []);
    for (const flag of sorted) {
      const g = dateGroup(flag.createdAt);
      groups.get(g)!.push(flag);
    }
    return groups;
  }, [sorted]);

  const pendingCount = flags.filter(
    (f) => f.status === "pending" || f.status === "pending_review",
  ).length;

  const containerRef = useRowReveal(".reveal-row");

  async function handleAction(id: string, status: string) {
    try {
      await fetchWithAuth(`/v1/scope-flags/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      void refetch();
      toast("success", status === "dismissed" ? "Flag dismissed" : `Flag ${status}`);
    } catch {
      toast("error", "Failed to update flag");
    }
  }

  return (
    <PageEnter>
      <div className="space-y-6">
        {/* Pattern alerts — FEAT-NEW-005 */}
        <ScopePatternAlerts
          flags={flags}
          projects={projects}
          dismissed={dismissedAlerts}
          onDismiss={(id) => setDismissedAlerts((prev) => new Set([...prev, id]))}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-[rgb(var(--text-primary))]">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Scope Flags
              {pendingCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-[rgb(var(--text-muted))]">
              AI-detected scope creep signals — sorted by priority score
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-[rgb(var(--text-muted))]" />
            <span className="text-xs font-medium text-[rgb(var(--text-muted))]">Status:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => {
              const count =
                s === "all"
                  ? flags.length
                  : flags.filter((f) => f.status === s).length;
              if (count === 0 && s !== "all") return null;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "relative overflow-hidden rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                    statusFilter === s
                      ? "text-white"
                      : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]",
                  )}
                >
                  {statusFilter === s && (
                    <motion.span
                      layoutId="status-filter-active"
                      className="absolute inset-0 rounded-full bg-[rgb(var(--primary))]"
                      style={{ zIndex: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {s.replace(/_/g, " ")}
                    {count > 0 && (
                      <span className="ml-1 text-[10px] opacity-70">({count})</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-[rgb(var(--text-muted))]">Severity:</span>
            <div className="flex gap-1.5">
              {SEVERITY_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverityFilter(s)}
                  className={cn(
                    "relative overflow-hidden rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors",
                    severityFilter === s
                      ? "text-white"
                      : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border-subtle))]",
                  )}
                >
                  {severityFilter === s && (
                    <motion.span
                      layoutId="severity-filter-active"
                      className="absolute inset-0 rounded-full bg-[rgb(var(--text-primary))]"
                      style={{ zIndex: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project filter */}
          {projects.length > 0 && (
            <div className="relative ml-auto">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="appearance-none rounded-xl border border-[rgb(var(--border-default))] bg-white py-1.5 pl-3 pr-8 text-xs text-[rgb(var(--text-primary))] outline-none focus:border-[rgb(var(--primary))] focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            </div>
          )}
        </div>

        {/* Flag list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <Card className="py-16 text-center">
            <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--text-muted))]" />
            <p className="font-display text-sm font-semibold text-[rgb(var(--text-primary))]">
              {statusFilter === "all"
                ? "No scope flags yet"
                : `No ${statusFilter.replace(/_/g, " ")} flags`}
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              Flags are created automatically when AI detects scope creep in client messages.
            </p>
          </Card>
        ) : (
          <div
            className="space-y-3"
            ref={containerRef as React.RefObject<HTMLDivElement>}
          >
            {GROUP_ORDER.map((group) => {
              const groupFlags = grouped.get(group) ?? [];
              if (groupFlags.length === 0) return null;
              return (
                <div key={group}>
                  {/* Date group header */}
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                      {group}
                    </span>
                    <div className="flex-1 border-t border-[rgb(var(--border-subtle))]" />
                    <span className="font-mono text-[10px] text-[rgb(var(--text-muted))]">
                      {groupFlags.length}
                    </span>
                  </div>

                  {/* Flags in group */}
                  <AnimatePresence initial={false}>
                    {groupFlags.map((flag) => (
                      <motion.div
                        key={flag.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="mb-2"
                      >
                        <FlagCard flag={flag} onAction={handleAction} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageEnter>
  );
}
