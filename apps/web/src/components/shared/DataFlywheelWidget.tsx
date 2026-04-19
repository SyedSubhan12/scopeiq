"use client";

/**
 * Sprint 5 — Data Flywheel widget (FEAT-NEW-009).
 *
 * Shows the workspace's current metrics alongside anonymized platform medians
 * so users can see how they stack up. Each row animates its number via anime.js
 * on mount — the count-up draws the eye and reinforces that the platform is
 * "learning" from every workspace's usage.
 *
 * Platform medians are intentionally hardcoded for now (FEAT-NEW-009 phase 1).
 * Phase 2 will replace them with a `/v1/analytics/benchmarks` endpoint once
 * we have enough workspaces to aggregate safely.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, cn } from "@novabots/ui";

interface Benchmark {
  label: string;
  value: number;
  median: number;
  suffix?: string;
  /** true when higher is better */
  higherIsBetter: boolean;
  /** number of decimals to render during the animation */
  decimals?: number;
}

interface DataFlywheelWidgetProps {
  /** The workspace's own metrics. If omitted, the widget shows dashes. */
  metrics?: {
    avgBriefScore?: number;
    avgTtvMinutes?: number;
    flagsPerMonth?: number;
  };
  className?: string;
}

// Anonymized platform medians (April 2026 cohort — refresh monthly).
const PLATFORM_MEDIANS = {
  avgBriefScore: 72,
  avgTtvMinutes: 14,
  flagsPerMonth: 2.3,
} as const;

function formatDelta(value: number, median: number, higherIsBetter: boolean) {
  const diff = value - median;
  const pct = median === 0 ? 0 : Math.round((diff / median) * 100);
  const isPositive = higherIsBetter ? diff >= 0 : diff <= 0;
  return {
    pct: Math.abs(pct),
    isPositive,
    sign: diff >= 0 ? "+" : "-",
  };
}

function BenchmarkRow({ row, index }: { row: Benchmark; index: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const delta = formatDelta(row.value, row.median, row.higherIsBetter);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    void import("animejs").then((mod) => {
      if (cancelled) return;
      const anime = (mod as { default: (params: unknown) => void }).default;
      const state = { v: 0 };
      anime({
        targets: state,
        v: row.value,
        duration: 900,
        delay: index * 100,
        easing: "easeOutQuad",
        update: () => {
          if (el) {
            const decimals = row.decimals ?? 0;
            el.textContent = state.v.toFixed(decimals);
          }
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [row.value, row.decimals, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] py-3 last:border-b-0"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
          {row.label}
        </p>
        <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
          Median: {row.median}
          {row.suffix ?? ""}
        </p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-[rgb(var(--text-primary))]">
          <span ref={ref}>0</span>
          {row.suffix ?? ""}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            delta.isPositive
              ? "bg-[#1D9E75]/10 text-[#1D9E75]"
              : "bg-[rgb(var(--status-red))]/10 text-[rgb(var(--status-red))]",
          )}
        >
          {delta.isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {delta.sign}
          {delta.pct}%
        </span>
      </div>
    </motion.div>
  );
}

export function DataFlywheelWidget({
  metrics,
  className,
}: DataFlywheelWidgetProps) {
  const rows: Benchmark[] = [
    {
      label: "Avg brief score",
      value: metrics?.avgBriefScore ?? 0,
      median: PLATFORM_MEDIANS.avgBriefScore,
      higherIsBetter: true,
    },
    {
      label: "Time to value",
      value: metrics?.avgTtvMinutes ?? 0,
      median: PLATFORM_MEDIANS.avgTtvMinutes,
      suffix: "m",
      higherIsBetter: false,
    },
    {
      label: "Scope flags / month",
      value: metrics?.flagsPerMonth ?? 0,
      median: PLATFORM_MEDIANS.flagsPerMonth,
      decimals: 1,
      higherIsBetter: true,
    },
  ];

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1D9E75]/10">
            <Sparkles className="h-4 w-4 text-[#1D9E75]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              Data Flywheel
            </p>
            <p className="text-xs text-[rgb(var(--text-muted))]">
              How you compare to the platform median
            </p>
          </div>
        </div>

        <div>
          {rows.map((row, i) => (
            <BenchmarkRow key={row.label} row={row} index={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
