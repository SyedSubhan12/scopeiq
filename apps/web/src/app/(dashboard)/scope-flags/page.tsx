"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ScopePatternAlerts } from "@/components/scope-guard/ScopePatternAlerts";
import { PageEnter } from "@/components/shared/PageEnter";
import { ShieldAlert, Filter, FolderKanban, ChevronDown } from "lucide-react";
import { Card, Badge, Skeleton, Button, useToast } from "@novabots/ui";
import { AnimatePresence, motion } from "framer-motion";
import { fetchWithAuth } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@novabots/ui";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getProjectsQueryOptions, useProjects } from "@/hooks/useProjects";
import { queryClient } from "@/lib/query-client";
import { getScopeFlagsQueryOptions, useScopeFlags } from "@/hooks/useScopeFlags";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_FILTERS = ["all", "pending", "confirmed", "dismissed", "snoozed", "change_order_sent", "resolved"];
const SEVERITY_FILTERS = ["all", "high", "medium", "low"];

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

  const flags: any[] = data?.data ?? [];
  const projects: any[] = projectsData?.data ?? [];

  const filtered = useMemo(() => {
    return flags.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (projectFilter !== "all" && f.projectId !== projectFilter) return false;
      return true;
    });
  }, [flags, statusFilter, severityFilter, projectFilter]);

  const pendingCount = flags.filter(
    (f) => f.status === "pending" || f.status === "pending_review",
  ).length;

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
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              Scope Flags
              {pendingCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
              AI-detected scope creep signals across all projects
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
              const count = s === "all"
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
                      className="absolute inset-0 rounded-full bg-primary"
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
                className="appearance-none rounded-xl border border-[rgb(var(--border-default))] bg-white py-1.5 pl-3 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Projects</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            </div>
          )}
        </div>

        {/* Flag list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="py-16 text-center">
            <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--text-muted))]" />
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {statusFilter === "all" ? "No scope flags yet" : `No ${statusFilter.replace(/_/g, " ")} flags`}
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              Flags are created automatically when AI detects scope creep in client messages.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((flag: any) => (
                <motion.div
                  key={flag.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  <FlagCard
                    flag={flag}
                    onAction={(id, status) => handleAction(id, status)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageEnter>
  );
}

function FlagCard({ flag, onAction }: { flag: any; onAction: (id: string, status: string) => void }) {
  const isPending = flag.status === "pending" || flag.status === "pending_review";

  return (
    <Card className={`border-l-4 p-4 transition-all ${isPending ? "border-l-red-400" : "border-l-emerald-400 opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_COLORS[flag.severity] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {flag.severity}
            </span>
            <Badge status={isPending ? "flagged" : "active"} className="text-[10px]">
              {flag.status?.replace(/_/g, " ")}
            </Badge>
            {flag.flagType && (
              <span className="text-[10px] text-[rgb(var(--text-muted))] uppercase tracking-wide">
                {flag.flagType.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--text-primary))]">
            {flag.reason || flag.title}
          </p>
          {flag.snippet && (
            <p className="mt-1.5 rounded-lg bg-[rgb(var(--surface-subtle))] px-3 py-2 text-xs text-[rgb(var(--text-secondary))] italic">
              &quot;{flag.snippet}&quot;
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
            <span className="flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              <Link href={`/projects/${flag.projectId}/scope-guard`} className="hover:text-primary hover:underline">
                View project
              </Link>
            </span>
            <span className="flex items-center gap-1">
              {formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {isPending && (
          <div className="flex shrink-0 flex-col gap-1.5">
            <Button
              size="sm"
              onClick={() => onAction(flag.id, "resolved")}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs"
            >
              Resolve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction(flag.id, "dismissed")}
              className="text-xs text-[rgb(var(--text-muted))] hover:text-red-500"
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
