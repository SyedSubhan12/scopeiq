"use client";

/**
 * FEAT-NEW-011 — Project Health Ring
 *
 * Animated SVG ring that reveals the overallScore on mount.
 * Color:  Green  (80-100)  |  Amber  (60-79)  |  Red  (<60)
 * Uses anime.js to animate the stroke-dashoffset so the ring
 * "fills in" smoothly when it first renders.
 *
 * Tooltip breakdown shown on hover via a Radix Tooltip.
 */

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@novabots/ui";
import type { ProjectHealth } from "@/hooks/useProjectHealth";

interface ProjectHealthRingProps {
  score: number;
  health?: ProjectHealth;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showTooltip?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#1D9E75";   // teal / green
  if (score >= 60) return "#D97706";   // amber
  return "#DC2626";                     // red
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "At risk";
  return "Critical";
}

function HealthBreakdown({ health }: { health: ProjectHealth }) {
  const rows = [
    {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Brief score",
      value:
        health.briefHealth.avgScore !== null
          ? `${health.briefHealth.avgScore}/100`
          : "—",
      ok: (health.briefHealth.avgScore ?? 0) >= 70,
    },
    {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: "Pending flags",
      value: String(health.scopeHealth.pendingFlags),
      ok: health.scopeHealth.pendingFlags === 0,
    },
    {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Deliverables approved",
      value:
        health.deliverableHealth.total > 0
          ? `${health.deliverableHealth.approved}/${health.deliverableHealth.total}`
          : "—",
      ok:
        health.deliverableHealth.total === 0 ||
        health.deliverableHealth.approved === health.deliverableHealth.total,
    },
    {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: "Changes requested",
      value: String(health.deliverableHealth.changesRequested),
      ok: health.deliverableHealth.changesRequested === 0,
    },
  ];

  return (
    <div className="w-52 rounded-xl border border-[rgb(var(--border-subtle))] bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
        Health breakdown
      </p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                r.ok
                  ? "text-[rgb(var(--text-secondary))]"
                  : "text-[rgb(var(--status-red))]",
              )}
            >
              <span className={r.ok ? "text-[#1D9E75]" : "text-[rgb(var(--status-red))]"}>
                {r.icon}
              </span>
              {r.label}
            </span>
            <span className="text-xs font-medium tabular-nums text-[rgb(var(--text-primary))]">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectHealthRing({
  score,
  health,
  size = 44,
  strokeWidth = 4,
  className,
  showTooltip = true,
}: ProjectHealthRingProps) {
  const pathRef = useRef<SVGCircleElement>(null);
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const targetOffset = circumference * (1 - clampedScore / 100);
  const color = scoreColor(clampedScore);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;

    // Start at full offset (0% fill), animate to target
    el.style.strokeDashoffset = String(circumference);
    let cancelled = false;

    void import("animejs").then((mod) => {
      if (cancelled) return;
      const anime = (mod as { default: (p: unknown) => void }).default;
      anime({
        targets: el,
        strokeDashoffset: [circumference, targetOffset],
        duration: 800,
        easing: "easeOutQuart",
        delay: 100,
      });
    });

    return () => { cancelled = true; };
  }, [circumference, targetOffset]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!showTooltip || !health) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ top: rect.bottom + 8, left: rect.left });
    }
    setHovered(true);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
      style={{ width: size, height: size }}
      aria-label={`Project health: ${scoreLabel(clampedScore)} (${clampedScore})`}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--surface-subtle))"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          ref={pathRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ transition: "none" }}
        />
      </svg>

      {/* Score label in center */}
      <span
        className="absolute text-[10px] font-bold tabular-nums"
        style={{ color }}
      >
        {clampedScore}
      </span>

      {/* Tooltip portal — rendered at fixed position */}
      {hovered && health && tooltipPos && (
        <div
          className="fixed z-[70] animate-[fadeIn_0.15s_ease]"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          <HealthBreakdown health={health} />
        </div>
      )}
    </div>
  );
}
