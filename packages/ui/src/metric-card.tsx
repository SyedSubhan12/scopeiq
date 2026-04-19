"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "./utils.js";

interface MetricCardProps {
  label: string;
  value: number;
  /** Optional prefix displayed before the value (e.g. "$") */
  prefix?: string;
  /** Optional suffix displayed after the value (e.g. "%", "hrs") */
  suffix?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    /** Custom label instead of auto-generated "X%" */
    label?: string;
  };
  /** Optional description line below the value */
  description?: string;
  className?: string;
  isLoading?: boolean;
}

export function MetricCard({
  label,
  value,
  prefix,
  suffix,
  trend,
  description,
  className,
  isLoading = false,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (isLoading) return;
    setDisplayValue(0);
    const duration = 600;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, isLoading]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[rgb(var(--border-subtle))] bg-white p-4",
          className,
        )}
        aria-busy="true"
        aria-label="Loading metric"
      >
        <div className="skeleton-shimmer h-3 w-24 mb-3" />
        <div className="skeleton-shimmer h-8 w-20 mb-2" />
        <div className="skeleton-shimmer h-3 w-14" />
      </div>
    );
  }

  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    trend?.direction === "up"
      ? "text-[rgb(var(--status-green))]"
      : trend?.direction === "down"
        ? "text-[rgb(var(--status-red))]"
        : "text-[rgb(var(--text-muted))]";

  return (
    <div
      className={cn(
        "rounded-xl border border-[rgb(var(--border-subtle))] bg-white p-4",
        "transition-all duration-200 ease-out hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        {prefix ? (
          <span className="text-sm font-medium text-[rgb(var(--text-muted))]">{prefix}</span>
        ) : null}
        <span className="text-2xl font-bold text-[rgb(var(--text-primary))] tabular-nums">
          {displayValue.toLocaleString()}
        </span>
        {suffix ? (
          <span className="text-sm font-medium text-[rgb(var(--text-muted))]">{suffix}</span>
        ) : null}
        {trend ? (
          <span className={cn("ml-1 flex items-center gap-0.5 text-xs font-medium", trendColor)}>
            <TrendIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {trend.label ?? `${trend.value}%`}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1 text-xs text-[rgb(var(--text-muted))] leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
