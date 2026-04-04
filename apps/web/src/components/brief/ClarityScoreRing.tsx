"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface ClarityScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "rgb(var(--status-green, 34 197 94))";
  if (score >= 50) return "rgb(var(--status-amber, 245 158 11))";
  return "rgb(var(--status-red, 239 68 68))";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

export function ClarityScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  className,
}: ClarityScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    const clampedScore = Math.max(0, Math.min(100, score));

    // Animate count-up
    let start: number | null = null;
    const duration = 1500;
    const raf = requestAnimationFrame(function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * clampedScore));
      const offset = circumference - eased * (clampedScore / 100) * circumference;
      setDashOffset(offset);
      if (progress < 1) requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(raf);
  }, [score, circumference]);

  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className={`flex flex-col items-center gap-1 ${className ?? ""}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(var(--border-default, 229 231 235))"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "none" }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ color }}
        >
          <span className="text-2xl font-bold leading-none">{displayScore}</span>
          <span className="text-xs font-medium opacity-75">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">{label} clarity</span>
    </div>
  );
}
