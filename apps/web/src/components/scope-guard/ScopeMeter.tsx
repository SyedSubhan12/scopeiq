"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@novabots/ui";

interface ScopeMeterProps {
  /** Percentage of scope consumed (0-100) */
  percentage: number;
  /** Optional label */
  label?: string;
  /** Size of the gauge in pixels */
  size?: number;
  className?: string;
}

function getScopeColor(pct: number): string {
  if (pct < 50) return "#10b981"; // green
  if (pct < 80) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function getScopeLabel(pct: number): string {
  if (pct < 30) return "Under Budget";
  if (pct < 50) return "On Track";
  if (pct < 70) return "Approaching Limit";
  if (pct < 80) return "Near Cap";
  return "Over Scope";
}

/**
 * Semi-circular gauge showing scope utilization.
 * Arc animates from green to red based on percentage.
 */
export function ScopeMeter({ percentage, label, size = 200, className }: ScopeMeterProps) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPct(Math.min(100, Math.max(0, percentage)));
    }, 200);
    return () => clearTimeout(timer);
  }, [percentage]);

  const color = getScopeColor(animatedPct);
  const scopeLabel = label ?? getScopeLabel(animatedPct);

  // SVG geometry
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2 - 10;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference - (animatedPct / 100) * circumference;

  // Background arc (full semi-circle)
  const bgArcLength = circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgb(var(--border-subtle))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Foreground arc (animated) */}
        <motion.path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={bgArcLength}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Percentage text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="select-none"
          style={{
            fontSize: size * 0.18,
            fontWeight: 700,
            fill: "rgb(var(--text-primary))",
          }}
        >
          {Math.round(animatedPct)}%
        </text>
      </svg>

      {/* Label */}
      <p
        className="mt-1 text-sm font-semibold"
        style={{ color }}
      >
        {scopeLabel}
      </p>
    </div>
  );
}

/**
 * Linear bar version of the scope meter (for compact layouts).
 */
export function ScopeMeterBar({ percentage, className }: { percentage: number; className?: string }) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPct(Math.min(100, Math.max(0, percentage)));
    }, 200);
    return () => clearTimeout(timer);
  }, [percentage]);

  const color = getScopeColor(animatedPct);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium" style={{ color }}>
          {getScopeLabel(animatedPct)}
        </span>
        <span className="font-bold text-[rgb(var(--text-primary))]">
          {Math.round(animatedPct)}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${animatedPct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
