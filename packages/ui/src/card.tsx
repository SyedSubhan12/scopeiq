"use client";

import * as React from "react";
import { cn } from "./utils.js";

type CardElevation = "none" | "sm" | "md" | "lg";

const elevationStyles: Record<CardElevation, string> = {
  none: "",
  sm: "shadow-[var(--shadow-sm)]",
  md: "shadow-[var(--shadow-md)]",
  lg: "shadow-[var(--shadow-lg)]",
};

const elevationHoverStyles: Record<CardElevation, string> = {
  none: "",
  sm: "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
  md: "hover:shadow-[var(--shadow-lg)] hover:-translate-y-1",
  lg: "hover:shadow-[var(--shadow-xl)] hover:-translate-y-1",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  /** Shadow elevation level */
  elevation?: CardElevation;
  /** When true, adds a 3px left border in primary color */
  accent?: boolean;
  /** When true, renders a skeleton loading state */
  isLoading?: boolean;
}

export function Card({
  className,
  hoverable,
  elevation = "none",
  accent = false,
  isLoading = false,
  children,
  ...props
}: CardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-lg border border-[rgb(var(--border-subtle))] bg-white p-4",
          className,
        )}
        aria-busy="true"
        aria-label="Loading"
        {...props}
      >
        <div className="space-y-3">
          <div className="skeleton-shimmer h-4 w-2/3" />
          <div className="skeleton-shimmer h-3 w-full" />
          <div className="skeleton-shimmer h-3 w-4/5" />
          <div className="skeleton-shimmer h-3 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-[rgb(var(--border-subtle))] bg-white",
        "transition-all duration-[200ms] ease-out",
        hoverable && "cursor-pointer",
        elevation !== "none" && elevationStyles[elevation],
        elevation !== "none" && elevationHoverStyles[elevation],
        hoverable && elevation === "none" && "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        accent && "border-l-[3px] border-l-[rgb(var(--primary))]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-[rgb(var(--border-subtle))] px-5 py-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold text-[rgb(var(--text-primary))]",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-4 text-sm text-[rgb(var(--text-secondary))]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-4 text-sm text-[rgb(var(--text-secondary))]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center border-t border-[rgb(var(--border-subtle))] px-5 py-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
