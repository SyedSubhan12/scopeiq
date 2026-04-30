"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@novabots/ui";

export interface ScopeMeterDeliverable {
  status: "draft" | "delivered" | "in_review" | "changes_requested" | "approved";
  revisionRound: number;
  maxRevisions: number;
}

export interface ScopeMeterProps {
  deliverables: ScopeMeterDeliverable[];
  className?: string;
}

interface ScopeBreakdown {
  /** 0-60: deliverable approval contribution */
  deliverableScore: number;
  /** 0-40: revision round contribution */
  revisionScore: number;
  /** 0-100: composite */
  total: number;
  approvedCount: number;
  totalCount: number;
  maxRevisionUsed: number;
  maxRevisionLimit: number;
}

function computeBreakdown(deliverables: ScopeMeterDeliverable[]): ScopeBreakdown {
  const totalCount = deliverables.length;

  if (totalCount === 0) {
    return {
      deliverableScore: 0,
      revisionScore: 0,
      total: 0,
      approvedCount: 0,
      totalCount: 0,
      maxRevisionUsed: 0,
      maxRevisionLimit: 0,
    };
  }

  const approvedCount = deliverables.filter((d) => d.status === "approved").length;
  const deliverableScore = (approvedCount / totalCount) * 60;

  // Find the worst revision ratio across all deliverables
  let maxRevisionRatio = 0;
  let maxRevisionUsed = 0;
  let maxRevisionLimit = 0;

  for (const d of deliverables) {
    if (d.maxRevisions > 0) {
      const ratio = d.revisionRound / d.maxRevisions;
      if (ratio > maxRevisionRatio) {
        maxRevisionRatio = ratio;
        maxRevisionUsed = d.revisionRound;
        maxRevisionLimit = d.maxRevisions;
      }
    }
  }

  const revisionScore = Math.min(1, maxRevisionRatio) * 40;
  const total = Math.min(100, deliverableScore + revisionScore);

  return {
    deliverableScore,
    revisionScore,
    total,
    approvedCount,
    totalCount,
    maxRevisionUsed,
    maxRevisionLimit,
  };
}

function getRingColor(pct: number): string {
  if (pct >= 100) return "rgb(var(--status-red))";
  if (pct >= 80) return "rgb(var(--status-red))";
  if (pct >= 60) return "rgb(var(--status-amber))";
  return "rgb(var(--status-green))";
}

function getStatusLabel(pct: number): string {
  if (pct >= 100) return "Scope maxed";
  if (pct >= 80) return "Critical";
  if (pct >= 60) return "Approaching limit";
  return "On track";
}

/**
 * Composite Scope Meter (FR-SG-006)
 *
 * Formula:
 *   total = (approved/total * 60) + (max_revision_used/max_revision_limit * 40)
 *
 * Color states:
 *   0-60%   → green
 *   60-80%  → amber
 *   80-100% → red
 *   100%    → red + pulsing ring
 *
 * Hover tooltip shows the percentage breakdown.
 */
export function ScopeMeter({ deliverables, className }: ScopeMeterProps) {
  const breakdown = computeBreakdown(deliverables);
  const { total } = breakdown;

  const [animated, setAnimated] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(Math.min(100, Math.max(0, total)));
    }, 100);
    return () => clearTimeout(timer);
  }, [total]);

  // SVG ring geometry (full circle)
  const size = 96;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animated / 100) * circumference;

  const ringColor = getRingColor(animated);
  const statusLabel = getStatusLabel(animated);
  const isMaxed = animated >= 100;

  return (
    <div
      ref={containerRef}
      className={cn("relative flex flex-col items-center", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="meter"
      aria-valuenow={Math.round(total)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Scope meter: ${Math.round(total)}% — ${statusLabel}`}
    >
      {/* Circular progress ring */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(var(--border-subtle))"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.0, 0, 0.2, 1), stroke 300ms ease" }}
          />
        </svg>

        {/* Pulsing ring at 100% */}
        {isMaxed && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 0 0 ${ringColor}`,
              animation: "scope-pulse 1.8s ease-out infinite",
            }}
            aria-hidden="true"
          />
        )}

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-lg font-bold leading-none"
            style={{ color: ringColor }}
          >
            {Math.round(animated)}%
          </span>
        </div>
      </div>

      {/* Status label */}
      <p
        className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: ringColor }}
      >
        {statusLabel}
      </p>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-raised))] p-3 shadow-lg"
          role="tooltip"
        >
          <p className="mb-2 text-xs font-semibold text-[rgb(var(--text-primary))]">
            Scope breakdown
          </p>
          <div className="space-y-1.5 text-xs text-[rgb(var(--text-secondary))]">
            <div className="flex justify-between">
              <span>Deliverables (60%)</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">
                {breakdown.approvedCount}/{breakdown.totalCount} approved
                &nbsp;({Math.round(breakdown.deliverableScore)}/60)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Revisions (40%)</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">
                {breakdown.maxRevisionUsed}/{breakdown.maxRevisionLimit || "—"} rounds
                &nbsp;({Math.round(breakdown.revisionScore)}/40)
              </span>
            </div>
            <div className="mt-1.5 flex justify-between border-t border-[rgb(var(--border-default))] pt-1.5">
              <span className="font-semibold text-[rgb(var(--text-primary))]">Total</span>
              <span className="font-bold" style={{ color: ringColor }}>
                {Math.round(total)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe for pulse animation — injected once as a style tag */}
      <style>{`
        @keyframes scope-pulse {
          0%   { box-shadow: 0 0 0 0 ${ringColor}80; }
          70%  { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </div>
  );
}
