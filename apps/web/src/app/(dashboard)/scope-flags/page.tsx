"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle2, XCircle, Clock, Filter, FolderKanban } from "lucide-react";
import { Card, Badge, Button, Skeleton, useToast } from "@novabots/ui";
import { useScopeFlags } from "@/hooks/useScopeFlags";
import { fetchWithAuth } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_FILTERS = ["all", "pending", "resolved", "dismissed"];

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
            {flag.reason}
          </p>
          {flag.snippet && (
            <p className="mt-1.5 rounded-lg bg-[rgb(var(--surface-subtle))] px-3 py-2 text-xs text-[rgb(var(--text-secondary))] italic">
              "{flag.snippet}"
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
              <Clock className="h-3 w-3" />
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
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Resolve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction(flag.id, "dismissed")}
              className="text-xs text-[rgb(var(--text-muted))] hover:text-red-500"
            >
              <XCircle className="mr-1 h-3.5 w-3.5" />
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function ScopeFlagsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading, refetch } = useScopeFlags();
  const { toast } = useToast();

  const flags: any[] = data?.data ?? [];
  const filtered = statusFilter === "all"
    ? flags
    : flags.filter((f) => f.status === statusFilter || (statusFilter === "pending" && f.status === "pending_review"));

  const pendingCount = flags.filter((f) => f.status === "pending" || f.status === "pending_review").length;

  async function handleAction(id: string, status: string) {
    try {
      await fetchWithAuth(`/v1/scope-flags/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      void refetch();
      toast("success", status === "resolved" ? "Flag resolved" : "Flag dismissed");
    } catch {
      toast("error", "Failed to update flag");
    }
  }

  return (
    <div className="space-y-6">
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
      <div className="flex items-center gap-1.5">
        <Filter className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--text-muted))]" />
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {statusFilter === "all" ? "No scope flags yet" : `No ${statusFilter} flags`}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            Flags are created automatically when AI detects scope creep in client messages.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((flag: any) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              onAction={(id, status) => handleAction(id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
