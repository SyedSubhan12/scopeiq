"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@novabots/ui";
import type { DeadlineEntry as DashboardDeadlineEntry } from "@/hooks/useDashboard";

function getDeadlineColor(daysRemaining: number): {
  bg: string;
  text: string;
  icon: typeof Calendar;
  label: string;
} {
  if (daysRemaining <= 1) {
    return {
      bg: "bg-status-red/10",
      text: "text-status-red",
      icon: AlertTriangle,
      label: "Due today or overdue",
    };
  }
  if (daysRemaining <= 3) {
    return {
      bg: "bg-status-yellow/10",
      text: "text-status-yellow",
      icon: AlertCircle,
      label: "Urgent",
    };
  }
  return {
    bg: "bg-status-blue/10",
    text: "text-status-blue",
    icon: Clock,
    label: "Upcoming",
  };
}

function formatDaysRemaining(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

interface UpcomingDeadlinesProps {
  deadlines: DashboardDeadlineEntry[];
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const displayDeadlines = deadlines.slice(0, 5);

  if (displayDeadlines.length === 0) {
    return (
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgb(var(--border-subtle))]">
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-2 uppercase tracking-wider">
            <Calendar className="h-4 w-4" />
            Upcoming Deadlines
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-status-green/10">
            <CheckCircle2 className="h-6 w-6 text-status-green" />
          </div>
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">No upcoming deadlines</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
            No project deadlines in the next 7 days.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgb(var(--border-subtle))] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-2 uppercase tracking-wider">
          <Calendar className="h-4 w-4" />
          Upcoming Deadlines
        </h3>
        <Link href="/projects" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="divide-y divide-[rgb(var(--border-subtle))]">
        {displayDeadlines.map((deadline, index) => {
          const colors = getDeadlineColor(deadline.daysRemaining);
          const Icon = colors.icon;
          return (
            <motion.div
              key={deadline.projectId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
            >
              <Link
                href={`/projects/${deadline.projectId}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-[rgb(var(--surface-subtle))] transition-colors"
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                    {deadline.projectName}
                  </p>
                  {deadline.clientName && (
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {deadline.clientName}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${colors.text}`}>
                    {formatDaysRemaining(deadline.daysRemaining)}
                  </p>
                  {deadline.endDate && (
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {new Date(deadline.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
