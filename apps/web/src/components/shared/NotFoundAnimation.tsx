"use client";

import { AlertCircle } from "lucide-react";
import { APP_LOTTIE } from "@/components/shared/lottie/app-lottie-paths";
import { LottieFromPublic } from "@/components/shared/lottie/LottieFromPublic";

export function NotFoundAnimation() {
  return (
    <LottieFromPublic
      src={APP_LOTTIE.notFound}
      containerClassName="w-full max-w-[min(100%,400px)]"
      className="h-auto w-full max-h-[280px] object-contain"
      loop
      speed={1}
      aria-label="Not found illustration"
      decorative
      reducedMotionFallback={
        <AlertCircle
          className="h-16 w-16 text-[rgb(var(--text-muted))]"
          aria-hidden
        />
      }
    />
  );
}
