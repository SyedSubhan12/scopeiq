"use client";

import { APP_LOTTIE } from "@/components/shared/lottie/app-lottie-paths";
import { LottieFromPublic } from "@/components/shared/lottie/LottieFromPublic";
import { Loader2 } from "lucide-react";
import { useReducedMotion } from "framer-motion";

/**
 * PageLoadingAnimation - Always shows Sandy Loading animation.
 * No CSS fallback - just the Sandy Lottie.
 */
export function PageLoadingAnimation({
  compact = false,
  showLabel = true,
}: {
  compact?: boolean | undefined;
  showLabel?: boolean | undefined;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        className={
          compact
            ? "flex w-full flex-col items-center justify-center gap-4 px-6 py-6"
            : "flex min-h-[50vh] w-full flex-col items-center justify-center gap-5 px-6 py-16"
        }
      >
        <Loader2
          className="h-10 w-10 animate-spin text-[rgb(var(--primary))]"
          aria-hidden
        />
        {showLabel ? (
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {compact ? "Loading workspace…" : "Loading…"}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "flex w-full flex-col items-center justify-center gap-4 px-6 py-6"
          : "flex min-h-[50vh] w-full flex-col items-center justify-center gap-5 px-6 py-16"
      }
    >
      <LottieFromPublic
        src={APP_LOTTIE.loading}
        containerClassName={compact ? "w-full max-w-[220px]" : "w-full max-w-[280px] sm:max-w-[320px]"}
        className={compact ? "h-auto w-full max-h-[180px] object-contain" : "h-auto w-full max-h-[240px] object-contain"}
        placeholderClassName={compact ? "aspect-square max-h-[180px]" : "aspect-square max-h-[240px]"}
        loop
        speed={1}
        decorative
        reducedMotionFallback={<Loader2 className="h-10 w-10 animate-spin text-[rgb(var(--primary))]" aria-hidden />}
      />
      {showLabel ? (
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {compact ? "Loading workspace…" : "Loading…"}
        </p>
      ) : null}
    </div>
  );
}
