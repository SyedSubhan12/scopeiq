"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, Skeleton } from "@novabots/ui";
import { ScorePill } from "@/components/briefs/shared/score-pill";
import { StatusBadge } from "@/components/briefs/shared/status-badge";
import { type BriefRecord } from "@/lib/briefs";

interface SubmissionTableProps {
  briefs: BriefRecord[];
  isLoading?: boolean;
}

export function SubmissionTable({ briefs, isLoading }: SubmissionTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | BriefRecord["status"]>("all");

  const filtered = useMemo(() => {
    return briefs.filter((brief) => {
      const matchesStatus = status === "all" || brief.status === status;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        brief.id.toLowerCase().includes(query) ||
        (brief.title ?? "").toLowerCase().includes(query) ||
        brief.projectId.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [briefs, search, status]);

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by brief, project, or title..."
              className="h-11 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | BriefRecord["status"])}
            className="h-11 rounded-2xl border border-[rgb(var(--border-default))] px-4 text-sm outline-none transition-colors focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
          >
            <option value="all">All statuses</option>
            <option value="pending_score">Pending score</option>
            <option value="scoring">Scoring</option>
            <option value="scored">Ready</option>
            <option value="clarification_needed">Clarification needed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Held</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-3xl p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[rgb(var(--border-subtle))]">
            <thead className="bg-[rgb(var(--surface-subtle))]">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                <th className="px-5 py-4">Brief</th>
                <th className="px-5 py-4">Project</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Score</th>
                <th className="px-5 py-4">Flags</th>
                <th className="px-5 py-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border-subtle))] bg-white">
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 6 }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-5 py-4">
                          <Skeleton className="h-5 w-full rounded-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((brief) => (
                    <tr key={brief.id} className="transition-colors hover:bg-[rgb(var(--surface-subtle))]">
                      <td className="px-5 py-4">
                        <Link href={`/briefs/submissions/${brief.id}`} className="block">
                          <p className="font-medium text-[rgb(var(--text-primary))]">
                            {brief.title || `Brief ${brief.id.slice(0, 8)}`}
                          </p>
                          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                            {brief.id.slice(0, 8)}
                          </p>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-[rgb(var(--text-secondary))]">
                        {brief.projectId.slice(0, 8)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={brief.status} />
                      </td>
                      <td className="px-5 py-4">
                        <ScorePill score={brief.scopeScore} />
                      </td>
                      <td className="px-5 py-4 text-sm text-[rgb(var(--text-secondary))]">
                        {brief.flags.length}
                      </td>
                      <td className="px-5 py-4 text-sm text-[rgb(var(--text-secondary))]">
                        {new Date(brief.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[rgb(var(--text-muted))]">
            No submissions match the current filters.
          </div>
        ) : null}
      </Card>
    </div>
  );
}

