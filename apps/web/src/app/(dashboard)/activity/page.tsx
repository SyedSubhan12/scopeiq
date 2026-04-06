"use client";

import { useState } from "react";
import { History, FolderKanban, FileText, ShieldAlert, FileSignature, MessageSquare, Package, Filter } from "lucide-react";
import { Card, Skeleton, Badge } from "@novabots/ui";
import { formatDistanceToNow } from "date-fns";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getAuditLogQueryOptions, useAuditLog } from "@/hooks/useNotifications";
import { queryClient } from "@/lib/query-client";

const ENTITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  project: { icon: FolderKanban, color: "text-primary bg-primary/10" },
  brief: { icon: FileText, color: "text-blue-600 bg-blue-50" },
  brief_template: { icon: FileText, color: "text-blue-600 bg-blue-50" },
  scope_flag: { icon: ShieldAlert, color: "text-red-500 bg-red-50" },
  change_order: { icon: FileSignature, color: "text-amber-600 bg-amber-50" },
  deliverable: { icon: Package, color: "text-violet-600 bg-violet-50" },
  feedback: { icon: MessageSquare, color: "text-green-600 bg-green-50" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "project", label: "Projects" },
  { value: "brief", label: "Briefs" },
  { value: "scope_flag", label: "Scope" },
  { value: "deliverable", label: "Deliverables" },
  { value: "change_order", label: "Change Orders" },
];

function actionLabel(action: string, entityType: string): string {
  const entity = entityType.replace(/_/g, " ");
  switch (action) {
    case "create": return `created a ${entity}`;
    case "update": return `updated a ${entity}`;
    case "delete": return `deleted a ${entity}`;
    case "approve": return `approved a ${entity}`;
    case "reject": return `rejected a ${entity}`;
    case "resolve": return `resolved a ${entity}`;
    case "score": return `AI scored a ${entity}`;
    default: return `${action} a ${entity}`;
  }
}

export default function ActivityPage() {
  useAssetsReady({
    scopeId: "page:activity",
    tasks: [() => queryClient.ensureQueryData(getAuditLogQueryOptions({ limit: 50 }))],
  });

  const [filter, setFilter] = useState("all");
  const { data, isLoading } = useAuditLog({ limit: 50 });
  const logs: any[] = data?.data ?? [];

  const filtered = filter === "all" ? logs : logs.filter((l) => l.entityType === filter || l.entityType?.startsWith(filter));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
            <History className="h-6 w-6 text-primary" />
            Activity
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">All workspace events in one place</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === value
                  ? "bg-primary text-white"
                  : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <History className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--text-muted))]" />
          <p className="text-sm text-[rgb(var(--text-muted))]">No activity yet</p>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 h-full w-px bg-[rgb(var(--border-subtle))]" />

          <div className="space-y-0">
            {filtered.map((log, idx) => {
              const cfg = ENTITY_ICONS[log.entityType] ?? { icon: Package, color: "text-gray-500 bg-gray-50" };
              const Icon = cfg.icon;

              return (
                <div key={log.id} className="relative flex gap-4 pb-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-xl border border-[rgb(var(--border-default))] bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-[rgb(var(--text-primary))]">
                          <span className="font-semibold">{log.actorId ? "User" : "System"}</span>{" "}
                          {actionLabel(log.action, log.entityType)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[rgb(var(--text-muted))]">
                          {log.entityId}
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                            {Object.entries(log.metadata as Record<string, unknown>)
                              .slice(0, 2)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge status="draft" className="text-[10px]">
                          {log.entityType?.replace(/_/g, " ")}
                        </Badge>
                        <p className="mt-1 text-[10px] text-[rgb(var(--text-muted))] whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
