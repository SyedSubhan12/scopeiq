"use client";

import { AlertTriangle, ArrowUp, ArrowRight, ArrowDown, Loader2 } from "lucide-react";
import { Card } from "@novabots/ui";

interface RevisionTask {
  action: string;
  impact: "high" | "medium" | "low";
  source_pin: number;
  contradiction: boolean;
  conflict_explanation?: string;
}

interface FeedbackSummaryProps {
  tasks: RevisionTask[];
  overallNotes?: string;
  isLoading?: boolean;
}

const impactConfig = {
  high: {
    Icon: ArrowUp,
    badge: "bg-red-100 text-red-800 border-red-200",
    label: "High Impact",
  },
  medium: {
    Icon: ArrowRight,
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    label: "Medium",
  },
  low: {
    Icon: ArrowDown,
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Low",
  },
};

export function FeedbackSummary({ tasks, overallNotes, isLoading }: FeedbackSummaryProps) {
  if (isLoading) {
    return (
      <Card className="py-8 text-center">
        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-[rgb(var(--text-muted))]">
          AI is summarizing feedback...
        </p>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="py-8 text-center">
        <p className="text-sm text-[rgb(var(--text-muted))]">
          No feedback summary available yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
        AI Revision Summary ({tasks.length} tasks)
      </h3>

      {overallNotes && (
        <Card className="bg-[rgb(var(--surface-subtle))] text-sm text-[rgb(var(--text-secondary))]">
          {overallNotes}
        </Card>
      )}

      <div className="space-y-2">
        {tasks.map((task, i) => {
          const config = impactConfig[task.impact];
          const { Icon } = config;

          return (
            <Card key={i} className="flex items-start gap-3 p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))] text-xs font-bold text-[rgb(var(--text-muted))]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.badge}`}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                  <span className="text-xs text-[rgb(var(--text-muted))]">
                    Pin #{task.source_pin}
                  </span>
                  {task.contradiction && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                      <AlertTriangle className="h-3 w-3" />
                      Contradiction
                    </span>
                  )}
                </div>
                <p className="text-sm text-[rgb(var(--text-primary))]">{task.action}</p>
                {task.contradiction && task.conflict_explanation && (
                  <p className="mt-1 rounded bg-orange-50 p-2 text-xs text-orange-700">
                    {task.conflict_explanation}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
