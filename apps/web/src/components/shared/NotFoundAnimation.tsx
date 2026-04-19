"use client";

import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import anime from "animejs";
import { APP_LOTTIE } from "@/components/shared/lottie/app-lottie-paths";
import { LottieFromPublic } from "@/components/shared/lottie/LottieFromPublic";

/**
 * 404 animation with Anime.js entrance effect
 * Adds scale + opacity entrance on mount with smooth easing
 */
export function NotFoundAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Entrance animation: scale up + fade in
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      scale: [0.85, 1],
      duration: 500,
      easing: "easeOutElastic(1, 0.6)",
      delay: 100,
    });
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-[min(100%,400px)]">
      <LottieFromPublic
        src={APP_LOTTIE.notFound}
        containerClassName="w-full"
        className="h-auto w-full max-h-[280px] object-contain"
        loop
        speed={1}
        decorative
        reducedMotionFallback={
          <AlertCircle
            className="h-16 w-16 text-[rgb(var(--text-muted))]"
            aria-hidden
          />
        }
      />
    </div>
  );
}
