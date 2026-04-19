"use client";

/**
 * FEAT-NEW-005 — Scope Creep Pattern Alerts
 *
 * Shown above the flag list when the AI detects concerning patterns:
 *  1. A project has 3+ flags in the last 14 days → repeat-pattern alert
 *  2. A project has flags but no SOW uploaded → missing-SOW warning
 *
 * All detection is client-side from the already-loaded flags list — no
 * extra API calls. Each alert slides in with Framer Motion and pulses the
 * warning icon with anime.js.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, FileWarning, X } from "lucide-react";
import { cn } from "@novabots/ui";
import type { ScopeFlag } from "@/hooks/useScopeFlags";

interface AlertItem {
  id: string;
  type: "repeat_pattern" | "missing_sow";
  projectId: string;
  projectName: string;
  flagCount?: number;
  message: string;
}

interface ScopePatternAlertsProps {
  flags: ScopeFlag[];
  projects: Array<{
    id: string;
    name: string;
    hasSOW?: boolean;
    statementOfWork?: unknown;
  }>;
  dismissed: Set<string>;
  onDismiss: (id: string) => void;
}

function computeAlerts(
  flags: ScopeFlag[],
  projects: ScopePatternAlertsProps["projects"],
): AlertItem[] {
  const now = Date.now();
  const cutoff = now - 14 * 24 * 60 * 60 * 1000; // 14 days

  // Group recent flags by project
  const byProject = new Map<string, ScopeFlag[]>();
  for (const f of flags) {
    if (new Date(f.createdAt).getTime() < cutoff) continue;
    const list = byProject.get(f.projectId) ?? [];
    list.push(f);
    byProject.set(f.projectId, list);
  }

  const alerts: AlertItem[] = [];

  for (const [projectId, recentFlags] of byProject) {
    const project = projects.find((p) => p.id === projectId);
    const name = project?.name ?? "Unknown project";

    // Pattern 1: 3+ flags in 14 days
    if (recentFlags.length >= 3) {
      alerts.push({
        id: `repeat-${projectId}`,
        type: "repeat_pattern",
        projectId,
        projectName: name,
        flagCount: recentFlags.length,
        message: `${name} has ${recentFlags.length} scope flags in the last 14 days. This client may be expanding scope repeatedly.`,
      });
    }
  }

  // Pattern 2: projects with flags but no SOW
  const flaggedProjectIds = new Set(flags.map((f) => f.projectId));
  for (const project of projects) {
    if (
      flaggedProjectIds.has(project.id) &&
      !project.hasSOW &&
      !project.statementOfWork
    ) {
      alerts.push({
        id: `nosow-${project.id}`,
        type: "missing_sow",
        projectId: project.id,
        projectName: project.name,
        message: `${project.name} has scope flags but no SOW uploaded. Flags cannot be auto-verified without a statement of work.`,
      });
    }
  }

  return alerts;
}

function AlertBanner({
  alert,
  onDismiss,
}: {
  alert: AlertItem;
  onDismiss: (id: string) => void;
}) {
  const iconRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = iconRef.current;
    if (!el) return;
    let cancelled = false;
    void import("animejs").then((mod) => {
      if (cancelled) return;
      const anime = (mod as { default: (p: unknown) => void }).default;
      anime({
        targets: el,
        scale: [1, 1.15, 1],
        duration: 700,
        loop: 3,
        easing: "easeInOutSine",
      });
    });
    return () => { cancelled = true; };
  }, []);

  const isRepeat = alert.type === "repeat_pattern";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        isRepeat
          ? "border-amber-200 bg-amber-50"
          : "border-orange-200 bg-orange-50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          isRepeat ? "bg-amber-100" : "bg-orange-100",
        )}
      >
        {isRepeat ? (
          <AlertTriangle
            ref={iconRef}
            className="h-4 w-4 text-amber-600"
          />
        ) : (
          <FileWarning
            ref={iconRef}
            className="h-4 w-4 text-orange-600"
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            isRepeat ? "text-amber-800" : "text-orange-800",
          )}
        >
          {isRepeat ? "Repeat scope pattern detected" : "SOW missing"}
        </p>
        <p
          className={cn(
            "mt-0.5 text-xs leading-relaxed",
            isRepeat ? "text-amber-700" : "text-orange-700",
          )}
        >
          {alert.message}
        </p>
        <Link
          href={`/projects/${alert.projectId}/scope-guard`}
          className={cn(
            "mt-1.5 inline-text text-xs font-medium underline underline-offset-2",
            isRepeat ? "text-amber-700" : "text-orange-700",
          )}
        >
          View project →
        </Link>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss alert"
        className={cn(
          "mt-0.5 rounded p-0.5 transition-colors",
          isRepeat
            ? "text-amber-500 hover:text-amber-700"
            : "text-orange-500 hover:text-orange-700",
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ScopePatternAlerts({
  flags,
  projects,
  dismissed,
  onDismiss,
}: ScopePatternAlertsProps) {
  const alerts = computeAlerts(flags, projects).filter(
    (a) => !dismissed.has(a.id),
  );

  if (alerts.length === 0) return null;

  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-2">
        {alerts.map((alert) => (
          <AlertBanner key={alert.id} alert={alert} onDismiss={onDismiss} />
        ))}
      </div>
    </AnimatePresence>
  );
}
