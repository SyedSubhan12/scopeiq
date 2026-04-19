"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap/dist/gsap";

interface ClarityScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

const SCORE_CONFIG = [
  { min: 80, label: "Excellent", color: "#1D9E75", gradientSuffix: "green" },
  { min: 65, label: "Good",      color: "#0EA5E9", gradientSuffix: "blue"  },
  { min: 50, label: "Fair",      color: "#F59E0B", gradientSuffix: "amber" },
  { min: 0,  label: "Poor",      color: "#EF4444", gradientSuffix: "red"   },
] as const;

function getConfig(score: number) {
  return SCORE_CONFIG.find((c) => score >= c.min) ?? SCORE_CONFIG[3];
}

// Stable per-instance gradient ID generated once at mount time
let _gradientCounter = 0;

export function ClarityScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  className,
  label,
  showLabel = true,
}: ClarityScoreRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [gradientId] = useState(() => `clarity-grad-${++_gradientCounter}`);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const motionScore = useMotionValue(0);
  const springScore = useSpring(motionScore, { stiffness: 100, damping: 60 });

  const config = getConfig(score);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReduced && containerRef.current) {
      gsap.from(containerRef.current, {
        scale: 0.7,
        opacity: 0,
        duration: 0.55,
        ease: "back.out(1.7)",
        delay: 0.1,
      });
    }

    if (prefersReduced) {
      setDisplayScore(score);
      motionScore.set(score);
    } else {
      motionScore.set(score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  useEffect(() => {
    const unsubscribe = springScore.on("change", (v) => {
      setDisplayScore(Math.round(Math.max(0, Math.min(100, v))));
    });
    return unsubscribe;
  }, [springScore]);

  const dashOffset = circumference - (displayScore / 100) * circumference;

  return (
    <div ref={containerRef} className={`flex flex-col items-center gap-1.5 ${className ?? ""}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={config.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={config.color} stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Track */}
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
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ color: config.color }}
        >
          <span className="text-2xl font-bold leading-none">{displayScore}</span>
          <span className="text-[10px] font-medium opacity-60">/100</span>
        </div>
      </div>
      {showLabel && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xs font-semibold"
          style={{ color: config.color }}
        >
          {label ?? `${config.label} clarity`}
        </motion.span>
      )}
    </div>
  );
}
