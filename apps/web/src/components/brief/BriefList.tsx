"use client";

import { useState } from "react";
import { FileText, Search } from "lucide-react";
import { Card, Badge, Skeleton } from "@novabots/ui";
import { ClarityScoreRing } from "./ClarityScoreRing";
import type { Brief } from "@/hooks/useBriefs";

interface BriefListProps {
  briefs: Brief[];
  isLoading?: boolean;
  onSelect: (brief: Brief) => void;
  selectedId?: string;
}

const statusConfig: Record<Brief["status"], { label: string; badgeStatus: string }> = {
  pending_score: { label: "Pending score", badgeStatus: "draft" },
  scoring: { label: "Scoring", badgeStatus: "active" },
  scored: { label: "Ready", badgeStatus: "active" },
  clarification_needed: { label: "Clarification needed", badgeStatus: "pending" },
  approved: { label: "Approved", badgeStatus: "approved" },
  rejected: { label: "Held", badgeStatus: "flagged" },
};

type StatusFilter = Brief["status"] | "all";
type SortBy = "date" | "score";

export function BriefList({ briefs, isLoading, onSelect, selectedId }: BriefListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const filtered = briefs
    .filter((b) => statusFilter === "all" || b.status === statusFilter)
    .filter(
      (b) =>
        !search ||
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        (b.title ?? "").toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "score") return (b.scopeScore ?? 0) - (a.scopeScore ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search briefs..."
            className="w-full rounded-lg border border-[rgb(var(--border-default))] py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All statuses</option>
          <option value="pending_score">Pending score</option>
          <option value="scoring">Scoring</option>
          <option value="scored">Ready</option>
          <option value="clarification_needed">Clarification needed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Held</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="date">Newest first</option>
          <option value="score">Highest score</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="py-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-[rgb(var(--text-muted))]" />
          <p className="text-sm text-[rgb(var(--text-muted))]">No briefs found.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((brief) => {
            const config = statusConfig[brief.status];
            return (
              <Card
                key={brief.id}
                hoverable
                className={`flex cursor-pointer items-center gap-4 transition-all ${
                  selectedId === brief.id
                    ? "border-primary ring-1 ring-primary"
                    : ""
                }`}
                onClick={() => onSelect(brief)}
              >
                <ClarityScoreRing score={brief.scopeScore ?? 0} size={48} strokeWidth={5} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-[rgb(var(--text-primary))]">
                      {brief.title || `Brief #${brief.id.slice(0, 8)}`}
                    </p>
                    <Badge status={config.badgeStatus as "approved" | "draft" | "active" | "flagged" | "pending"}>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
                    <span>{new Date(brief.createdAt).toLocaleDateString()}</span>
                    {brief.flags.length > 0 && (
                      <span>{brief.flags.length} flag{brief.flags.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
