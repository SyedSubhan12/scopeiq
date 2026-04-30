"use client";

import { cn } from "@novabots/ui";

type StatusPillSize = "sm" | "md";

interface StatusPillProps {
  status: string;
  size?: StatusPillSize;
  className?: string;
}

interface StatusConfig {
  dot: string;
  label: string;
  bg: string;
  text: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  draft: {
    dot: "#94a3b8",
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-500",
  },
  in_brief: {
    dot: "#f59e0b",
    label: "In Brief",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  in_review: {
    dot: "#f59e0b",
    label: "In Review",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  pending_review: {
    dot: "#f59e0b",
    label: "Pending Review",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  approved: {
    dot: "#10b981",
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  active: {
    dot: "#10b981",
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  flagged: {
    dot: "#ef4444",
    label: "Flagged",
    bg: "bg-red-50",
    text: "text-red-500",
  },
  scope_flagged: {
    dot: "#ef4444",
    label: "Scope Flagged",
    bg: "bg-red-50",
    text: "text-red-500",
  },
  pending: {
    dot: "#ef4444",
    label: "Pending",
    bg: "bg-red-50",
    text: "text-red-500",
  },
  completed: {
    dot: "#6366f1",
    label: "Completed",
    bg: "bg-indigo-50",
    text: "text-indigo-500",
  },
  resolved: {
    dot: "#6366f1",
    label: "Resolved",
    bg: "bg-indigo-50",
    text: "text-indigo-500",
  },
  dismissed: {
    dot: "#94a3b8",
    label: "Dismissed",
    bg: "bg-slate-100",
    text: "text-slate-400",
  },
  paused: {
    dot: "#94a3b8",
    label: "Paused",
    bg: "bg-slate-100",
    text: "text-slate-500",
  },
};

function getFallbackConfig(status: string): StatusConfig {
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    dot: "#94a3b8",
    label,
    bg: "bg-slate-100",
    text: "text-slate-500",
  };
}

export function StatusPill({ status, size = "md", className }: StatusPillProps) {
  const config = STATUS_MAP[status.toLowerCase()] ?? getFallbackConfig(status);

  const sizeClasses =
    size === "sm"
      ? "gap-1 px-1.5 py-0.5 text-[10px]"
      : "gap-1.5 px-2 py-0.5 text-xs";

  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium leading-none",
        config.bg,
        config.text,
        sizeClasses,
        className,
      )}
    >
      <span
        className={cn("shrink-0 rounded-full", dotSize)}
        style={{ backgroundColor: config.dot }}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
