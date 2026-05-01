"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";
import { Skeleton, Badge } from "@novabots/ui";
import { Bell, Mail } from "lucide-react";

interface ReminderLogEntry {
  id: string;
  step: "gentle_nudge" | "deadline_warning" | "silence_approval" | string;
  sentAt: string;
  recipientEmail: string;
  status: "sent" | "failed" | "skipped";
}

const STEP_LABELS: Record<string, string> = {
  gentle_nudge: "Gentle Nudge",
  deadline_warning: "Deadline Warning",
  silence_approval: "Silence Approval",
};

const STATUS_BADGE: Record<
  string,
  { label: string; status: "active" | "flagged" | "draft" }
> = {
  sent: { label: "Sent", status: "active" },
  failed: { label: "Failed", status: "flagged" },
  skipped: { label: "Skipped", status: "draft" },
};

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function truncateEmail(email: string, maxLen = 28): string {
  if (email.length <= maxLen) return email;
  const [local, domain] = email.split("@");
  if (!domain) return email.slice(0, maxLen) + "…";
  if (local && local.length > 10) {
    return local.slice(0, 10) + "…@" + domain;
  }
  return email.slice(0, maxLen) + "…";
}

interface ReminderLogTimelineProps {
  projectId: string;
}

export function ReminderLogTimeline({ projectId }: ReminderLogTimelineProps) {
  const { data, isLoading } = useQuery<{ data: ReminderLogEntry[] }>({
    queryKey: ["reminder-logs", projectId],
    queryFn: () =>
      fetchWithAuth(`/v1/projects/${projectId}/reminder-logs`) as Promise<{
        data: ReminderLogEntry[];
      }>,
    enabled: !!projectId,
    // Fail silently — the component already handles the error case with `data` being undefined
    retry: false,
  });

  const logs = data?.data ?? [];

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
          Reminder Log
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="py-6 text-center text-sm text-[rgb(var(--text-muted))]">
          No reminders sent yet.
        </p>
      ) : (
        <div className="relative space-y-0">
          {logs.map((log, index) => {
            const stepLabel =
              STEP_LABELS[log.step] ??
              log.step
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
            const badge = STATUS_BADGE[log.status] ?? {
              label: log.status,
              status: "draft" as const,
            };

            return (
              <div
                key={log.id}
                className="relative flex gap-4 pl-6 pb-5 last:pb-0"
              >
                {/* Timeline line */}
                {index < logs.length - 1 && (
                  <div className="absolute left-[9px] top-6 bottom-0 w-[2px] bg-[rgb(var(--border-subtle))]" />
                )}
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[rgb(var(--border-default))] bg-white z-10">
                  <Bell className="h-2.5 w-2.5 text-[rgb(var(--text-muted))]" />
                </div>

                {/* Content */}
                <div className="flex-1 rounded-xl border border-[rgb(var(--border-default))] bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {stepLabel}
                    </p>
                    <Badge status={badge.status}>{badge.label}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
                    <span>{formatDateTime(log.sentAt)}</span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {truncateEmail(log.recipientEmail)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
