"use client";

import { useEffect, useRef, useState } from "react";
import { History, FolderKanban, FileText, ShieldAlert, FileSignature, MessageSquare, Package, Filter } from "lucide-react";
import { Card, Skeleton, Badge } from "@novabots/ui";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getAuditLogQueryOptions, useAuditLog } from "@/hooks/useNotifications";
import { queryClient } from "@/lib/query-client";
import { PageEnter } from "@/components/shared/PageEnter";

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
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = filter === "all"
    ? logs
    : logs.filter((l) => l.entityType === filter || l.entityType?.startsWith(filter));

  // GSAP ScrollTrigger stagger on timeline items when data loads
  useEffect(() => {
    if (!containerRef.current || !filtered.length) return;
    void Promise.all([
      import("gsap/dist/gsap"),
      import("gsap/dist/ScrollTrigger"),
    ]).then(([gsapMod, stMod]) => {
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.default;
      gsap.registerPlugin(ScrollTrigger);
      const items = containerRef.current?.querySelectorAll("[data-log-item]");
      if (!items?.length) return;
      gsap.from(items, {
        opacity: 0,
        y: 12,
        duration: 0.3,
        stagger: 0.04,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
          once: true,
        },
        clearProps: "all",
      });
    });
  }, [filtered.length, filter]);

  return (
    <PageEnter>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
              <History className="h-6 w-6 text-primary" />
              Activity
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">All workspace events in one place</p>
          </div>

          {/* Filter pills with sliding active indicator */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-4 w-4 shrink-0 text-[rgb(var(--text-muted))]" />
            {FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`relative overflow-hidden rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === value
                    ? "text-white"
                    : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--border-subtle))]"
                }`}
              >
                {filter === value && (
                  <motion.span
                    layoutId="activity-filter-active"
                    className="absolute inset-0 rounded-full bg-primary"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="relative"
            >
              {/* Timeline connector line */}
              <div className="absolute left-5 top-0 h-full w-px bg-[rgb(var(--border-subtle))]" />

              <div ref={containerRef} className="space-y-0">
                {filtered.map((log) => {
                  const cfg = ENTITY_ICONS[log.entityType] ?? { icon: Package, color: "text-gray-500 bg-gray-50" };
                  const Icon = cfg.icon;

                  return (
                    <div key={log.id} data-log-item className="relative flex gap-4 pb-4">
                      {/* Timeline dot with hover scale */}
                      <motion.div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.color}`}
                        whileHover={{ scale: 1.12 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>

                      {/* Content card */}
                      <motion.div
                        className="flex-1 rounded-xl border border-[rgb(var(--border-default))] bg-white px-4 py-3 shadow-sm"
                        whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}
                        transition={{ duration: 0.15 }}
                      >
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
                            <p className="mt-1 text-[10px] whitespace-nowrap text-[rgb(var(--text-muted))]">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageEnter>
  );
}
