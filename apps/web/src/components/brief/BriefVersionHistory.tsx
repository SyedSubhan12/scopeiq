"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { History, ChevronRight, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@novabots/ui";
import { BriefVersionRecord, getReviewStatusMeta } from "@/lib/briefs";
import { Badge } from "@novabots/ui";

interface BriefVersionHistoryProps {
  versions: BriefVersionRecord[];
  onSelectVersion?: (version: BriefVersionRecord) => void;
}

export function BriefVersionHistory({ versions, onSelectVersion }: BriefVersionHistoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(versions[0]?.id ?? null);

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-[rgb(var(--text-muted))]">
        <History className="mb-3 h-10 w-10 opacity-20" />
        <p>No version history available for this brief.</p>
      </div>
    );
  }

  const handleSelect = (version: BriefVersionRecord) => {
    setSelectedId(version.id);
    onSelectVersion?.(version);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center gap-2 px-1">
        <History className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
          Version History
        </h3>
      </div>

      <div className="divide-y divide-[rgb(var(--border-subtle))] overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-white shadow-sm">
        {versions.map((version, index) => {
          const isCurrent = index === 0;
          const isSelected = selectedId === version.id;
          const statusMeta = getReviewStatusMeta(version.status);
          
          return (
            <button
              key={version.id}
              onClick={() => handleSelect(version)}
              className={cn(
                "group flex w-full items-center gap-4 px-5 py-4 text-left transition-all hover:bg-[rgb(var(--surface-subtle))]",
                isSelected && "bg-[rgb(var(--surface-subtle))] ring-1 ring-inset ring-[rgb(var(--primary-teal)/0.1)]"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                  isSelected 
                    ? "border-[rgb(var(--primary-teal)/0.3)] bg-[rgb(var(--primary-teal-light))] text-[rgb(var(--primary-teal))]" 
                    : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-muted))]"
                )}>
                  <span className="text-sm font-bold">V{version.versionNumber}</span>
                </div>
                {isCurrent && (
                  <span className="absolute -right-1 -top-1 block h-3 w-3 rounded-full border-2 border-white bg-[rgb(var(--status-green))]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-[rgb(var(--text-primary))]">
                    {version.title || `Revision ${version.versionNumber}`}
                  </span>
                  <Badge 
                    status={statusMeta.badgeStatus} 
                    className="shrink-0"
                  >
                    {statusMeta.label}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
                  <span>{format(new Date(version.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                  {version.submittedBy && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-current opacity-30" />
                      <span>By {version.submittedBy}</span>
                    </>
                  )}
                </div>
              </div>

              <ChevronRight className={cn(
                "h-5 w-5 transition-transform duration-200",
                isSelected ? "translate-x-0 text-[rgb(var(--primary-teal))]" : "translate-x-[-4px] text-[rgb(var(--text-muted))] opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
              )} />
            </button>
          );
        })}
      </div>

      {/* Diff View Placeholder — would be populated when a version is selected */}
      <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] p-6 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-[rgb(var(--text-muted))] opacity-40" />
        <h4 className="text-sm font-medium text-[rgb(var(--text-primary))]">Version Comparison</h4>
        <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
          Select a version to see its field-level data. Comparison view (green adds, red deletes) coming in Sprint 4.
        </p>
      </div>
    </div>
  );
}
