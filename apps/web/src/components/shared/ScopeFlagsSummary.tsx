"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, FileText, ArrowRight } from "lucide-react";
import { Card, Badge, Button } from "@novabots/ui";
import { formatDistanceToNow } from "date-fns";
import type { UrgentFlag as DashboardUrgentFlag } from "@/hooks/useDashboard";

const severityColors: Record<string, { bg: string; text: string; badgeStatus: "flagged" | "pending" | "draft" }> = {
  high: {
    bg: "border-l-status-red",
    text: "text-status-red",
    badgeStatus: "flagged",
  },
  medium: {
    bg: "border-l-status-yellow",
    text: "text-status-yellow",
    badgeStatus: "pending",
  },
  low: {
    bg: "border-l-status-blue",
    text: "text-status-blue",
    badgeStatus: "draft",
  },
};

interface ScopeFlagsSummaryProps {
  flags: DashboardUrgentFlag[];
}

export function ScopeFlagsSummary({ flags }: ScopeFlagsSummaryProps) {
  const displayFlags = flags.slice(0, 3);

  if (displayFlags.length === 0) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgb(var(--border-subtle))]">
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-2 uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            Scope Flags
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-status-green/10">
            <ShieldAlert className="h-6 w-6 text-status-green" />
          </div>
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">All clear!</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            No pending scope flags requiring attention.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgb(var(--border-subtle))] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-2 uppercase tracking-wider">
          <ShieldAlert className="h-4 w-4 text-status-red" />
          Urgent Scope Flags
        </h3>
        <Link href="/scope-flags" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="divide-y divide-[rgb(var(--border-subtle))]">
        {displayFlags.map((flag, index) => {
          const colors: (typeof severityColors)[string] = severityColors[flag.severity] ?? severityColors.medium;
          return (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className={`border-l-4 ${colors.bg} px-5 py-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge status={colors.badgeStatus} className="text-xs">
                      {flag.severity}
                    </Badge>
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                      {formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                    {flag.title}
                  </p>
                  {flag.description && (
                    <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 line-clamp-1">
                      {flag.description}
                    </p>
                  )}
                  {flag.projectName && (
                    <p className="text-xs text-[rgb(var(--text-muted))] mt-1">
                      Project: {flag.projectName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Link href={`/projects/${flag.projectId}`}>
                  <Button size="sm" variant="secondary" className="h-7 text-xs px-2">
                    <FileText className="mr-1 h-3 w-3" />
                    View Flag
                  </Button>
                </Link>
                <Link href={`/change-orders/new?flagId=${flag.id}`}>
                  <Button size="sm" className="h-7 text-xs px-2 bg-primary hover:bg-primary/90">
                    <ArrowRight className="mr-1 h-3 w-3" />
                    Send CO
                  </Button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
