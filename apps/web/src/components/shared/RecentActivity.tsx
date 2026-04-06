"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  MessageSquare,
  FileUp,
  CheckSquare,
  AlertTriangle,
  CreditCard,
  UserPlus,
  Activity,
  FolderOpen,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Card, Avatar } from "@novabots/ui";
import type { ActivityEntry } from "@/hooks/useDashboard";

const actionIcons: Record<string, typeof Activity> = {
  create: Activity,
  update: Clock,
  delete: AlertTriangle,
  approve: CheckSquare,
  reject: AlertTriangle,
  flag: ShieldAlert,
  send: FileUp,
  dismiss: CheckSquare,
};

const entityIcons: Record<string, typeof FolderOpen> = {
  project: FolderOpen,
  deliverable: FileText,
  scope_flag: ShieldAlert,
  change_order: CreditCard,
  brief: MessageSquare,
  client: UserPlus,
};

function getActionIcon(action: string): typeof Activity {
  return actionIcons[action] ?? Activity;
}

function getEntityIcon(entityType: string): typeof FolderOpen {
  return entityIcons[entityType] ?? FolderOpen;
}

function formatLogMessage(entry: ActivityEntry): string {
  const actor = entry.actorName || "System";
  const entity = entry.entityType.toLowerCase().replace(/_/g, " ");

  switch (entry.action) {
    case "create":
      return `${actor} created a new ${entity}`;
    case "update":
      return `${actor} updated ${entity}`;
    case "delete":
      return `${actor} archived ${entity}`;
    case "approve":
      return `${actor} approved the ${entity}`;
    case "reject":
      return `${actor} requested changes on ${entity}`;
    case "flag":
      return `${actor} flagged a scope deviation`;
    case "dismiss":
      return `${actor} dismissed scope flag`;
    case "send":
      return `${actor} sent ${entity} to client`;
    default:
      return `${actor} performed ${entry.action} on ${entity}`;
  }
}

function getEntityLink(entry: ActivityEntry): string {
  const id = entry.entityId;
  switch (entry.entityType) {
    case "project":
      return `/projects/${id}`;
    case "deliverable":
      return `/projects/${id}/deliverables`;
    case "scope_flag":
      return `/scope-flags`;
    case "change_order":
      return `/change-orders`;
    case "brief":
      return `/briefs`;
    default:
      return "/activity";
  }
}

interface RecentActivityProps {
  activities: ActivityEntry[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const displayActivities = activities.slice(0, 8);

  if (displayActivities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Activity className="h-4 w-4" />
          Recent Activity
        </h3>
        <div className="py-8 text-center text-sm text-[rgb(var(--text-muted))]">
          No recent activity in this workspace.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgb(var(--border-subtle))]">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-2 uppercase tracking-wider">
          <Activity className="h-4 w-4" />
          Recent Activity
        </h3>
      </div>
      <div className="divide-y divide-[rgb(var(--border-subtle))]">
        {displayActivities.map((entry, index) => {
          const ActionIcon = getActionIcon(entry.action);
          const EntityIcon = getEntityIcon(entry.entityType);
          const link = getEntityLink(entry);

          return (
            <Link
              key={entry.id}
              href={link}
              className="flex items-start gap-3 px-5 py-3 hover:bg-[rgb(var(--surface-subtle))] transition-colors"
            >
              <div className="relative mt-0.5 flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))] border border-[rgb(var(--border-subtle))]">
                  <ActionIcon className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[rgb(var(--text-primary))] line-clamp-2">
                  {formatLogMessage(entry)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-xs text-[rgb(var(--text-muted))]">
                    <EntityIcon className="h-3 w-3" />
                    {entry.entityType.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-[rgb(var(--text-muted))]">
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="px-5 py-3 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]">
        <Link href="/activity" className="text-xs font-medium text-primary hover:underline">
          View all activity
        </Link>
      </div>
    </Card>
  );
}
