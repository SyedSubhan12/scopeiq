"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "./utils.js";

interface MetricCardProps {
  label: string;
  value: number;
  trend?: { value: number; direction: "up" | "down" };
  className?: string;
}

export function MetricCard({ label, value, trend, className }: MetricCardProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
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
  }, [value]);

  return (
    <div
      className={cn(
        "rounded-lg border border-[rgb(var(--border-default))] bg-white p-4",
        className,
      )}
    >
      <p className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wider">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[rgb(var(--text-primary))]">
          {displayValue.toLocaleString()}
        </span>
        {trend && (
          <span
            className={cn(
              "flex items-center text-xs font-medium",
              trend.direction === "up" ? "text-status-green" : "text-status-red",
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="mr-0.5 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-0.5 h-3 w-3" />
            )}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
