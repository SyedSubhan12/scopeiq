import type { ElementType } from "react";
import { cn } from "@novabots/ui";

interface EmptyStateProps {
  /** Main heading shown when no data exists */
  title: string;
  /** Supporting description below the title */
  description?: string;
  /** Lucide icon component to display */
  icon?: ElementType;
  /** Optional action button rendered below the description */
  actionButton?: React.ReactNode;
  /** Optional custom illustration slot (e.g., Lottie animation) */
  illustrationSlot?: React.ReactNode;
  /** Additional className for the root container */
  className?: string;
}

/**
 * Reusable empty state component for zero-data screens.
 * Centers content vertically and horizontally with muted styling.
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  actionButton,
  illustrationSlot,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {illustrationSlot ? (
        <div className="mb-6">{illustrationSlot}</div>
      ) : Icon ? (
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))]">
          <Icon className="h-8 w-8 text-[rgb(var(--text-muted))]" />
        </div>
      ) : null}

      <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
        {title}
      </h3>

      {description && (
        <p className="mt-1 max-w-sm text-sm text-[rgb(var(--text-muted))]">
          {description}
        </p>
      )}

      {actionButton && <div className="mt-5">{actionButton}</div>}
    </div>
  );
}
