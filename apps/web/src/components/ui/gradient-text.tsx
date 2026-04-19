"use client";

/**
 * GradientText — animated shimmer gradient that sweeps across text.
 * Uses CSS @keyframes for zero JS cost after mount.
 */

import { cn } from "@novabots/ui";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  /** CSS gradient — defaults to ScopeIQ brand green sweep */
  gradient?: string;
  animate?: boolean;
}

export function GradientText({
  children,
  className,
  gradient = "linear-gradient(90deg, #0F6E56 0%, #1db890 40%, #0F6E56 80%, #0a5c47 100%)",
  animate = true,
}: GradientTextProps) {
  return (
    <span
      className={cn("inline-block bg-clip-text text-transparent", className)}
      style={{
        backgroundImage: gradient,
        backgroundSize: animate ? "200% auto" : "100% auto",
        animation: animate ? "gradient-sweep 3.5s linear infinite" : undefined,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {children}
    </span>
  );
}
