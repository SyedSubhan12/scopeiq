"use client";

import { PageLoadingAnimation } from "@/components/shared/PageLoadingAnimation";

/**
 * GlobalLoader - Shows Sandy Loading animation until boot sequence completes.
 * Only uses Sandy Lottie - no CSS fallback.
 */
export function GlobalLoader({
  compact = false,
}: {
  compact?: boolean | undefined;
}) {
  return (
    <div
      className={
        compact
          ? "flex w-full flex-col items-center justify-center gap-4 px-6 py-6"
          : "flex min-h-[50vh] w-full flex-col items-center justify-center gap-5 px-6 py-16"
      }
    >
      <div className="relative flex w-full items-center justify-center">
        <PageLoadingAnimation compact={compact} showLabel={false} />
      </div>

      <p className="mt-4 text-sm font-medium tracking-wide text-[rgb(var(--text-secondary))]">
        {compact ? "Initialising workspace…" : "Preparing your experience…"}
      </p>
    </div >
  );
}
