import { cn } from "./utils.js";

interface SkeletonProps {
  className?: string;
  /** Skeleton variant type */
  variant?: "default" | "circular" | "text";
  /** Width for text variant */
  width?: string | number;
}

export function Skeleton({ className, variant = "default", width }: SkeletonProps) {
  if (variant === "circular") {
    return (
      <div
        className={cn(
          "animate-pulse rounded-full bg-[rgb(var(--border-subtle))]",
          className
        )}
      />
    );
  }

  if (variant === "text") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-md bg-[rgb(var(--border-subtle))]",
          "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
          className
        )}
        style={width ? { width } : undefined}
      />
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[rgb(var(--border-subtle))]",
        className
      )}
    />
  );
}
