"use client";

import { useEffect, useRef } from "react";
import { cn } from "@novabots/ui";

interface ConfidenceBarProps {
  confidence: number;
  size?: "sm" | "md";
  className?: string | undefined;
}

function getConfidenceColor(confidence: number): string {
  if (confidence > 0.8) return "#1D9E75";
  if (confidence >= 0.5) return "rgb(var(--status-amber))";
  return "rgb(var(--status-red))";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence > 0.8) return "High confidence";
  if (confidence >= 0.5) return "Medium confidence";
  return "Low confidence";
}

export function ConfidenceBar({ confidence, size = "md", className }: ConfidenceBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const clampedConfidence = Math.min(1, Math.max(0, confidence));
  const targetWidth = clampedConfidence * 100;
  const color = getConfidenceColor(clampedConfidence);
  const label = getConfidenceLabel(clampedConfidence);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.width = `${targetWidth}%`;
      return;
    }
    el.style.width = "0%";
    import("gsap/dist/gsap").then(({ default: gsap }) => {
      gsap.to(el, {
        width: `${targetWidth}%`,
        duration: 0.45,
        ease: "power2.out",
      });
    });
  }, [targetWidth]);

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "mb-1 flex items-center justify-between",
        size === "sm" ? "text-[10px]" : "text-xs",
      )}>
        <span className="font-medium" style={{ color }}>
          {label}
        </span>
        <span className="font-bold text-[rgb(var(--text-primary))]">
          {Math.round(clampedConfidence * 100)}%
        </span>
      </div>
      <div className={cn(
        "overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]",
        size === "sm" ? "h-1.5" : "h-2",
      )}>
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: "0%" }}
        />
      </div>
    </div>
  );
}
