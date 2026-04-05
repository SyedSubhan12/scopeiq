"use client";

import { Loader2 } from "lucide-react";
import { APP_LOTTIE } from "@/components/shared/lottie/app-lottie-paths";
import { LottieFromPublic } from "@/components/shared/lottie/LottieFromPublic";

export function PageLoadingAnimation() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 px-6 py-16">
      <LottieFromPublic
        src={APP_LOTTIE.loading}
        containerClassName="w-full max-w-[280px] sm:max-w-[320px]"
        className="h-auto w-full max-h-[240px] object-contain"
        loop
        speed={1}
        decorative
        reducedMotionFallback={
          <Loader2
            className="h-10 w-10 animate-spin text-[rgb(var(--primary))]"
            aria-hidden
          />
        }
      />
      <p className="text-sm text-[rgb(var(--text-secondary))]">Loading…</p>
    </div>
  );
}
