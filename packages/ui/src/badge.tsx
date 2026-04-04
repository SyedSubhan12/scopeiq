import * as React from "react";
import { cn } from "./utils.js";

const statusStyles = {
  approved: "bg-green-100 text-green-800 border-green-200",
  in_review: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  flagged: "bg-red-100 text-red-800 border-red-200",
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  active: "bg-primary-light text-primary-dark border-primary/20",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-gray-50 text-gray-500 border-gray-200",
} as const;

interface BadgeProps {
  status: keyof typeof statusStyles;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ status, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {children}
    </span>
  );
}
