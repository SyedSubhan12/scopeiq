import { cn } from "./utils.js";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[rgb(var(--border-subtle))]",
        className,
      )}
    />
  );
}
