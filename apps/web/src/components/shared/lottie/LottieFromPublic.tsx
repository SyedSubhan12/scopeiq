"use client";

import { cn } from "@novabots/ui";
import {
  getCachedLottieAnimationData,
  preloadLottieAnimationData,
} from "@/lib/lottie-preload";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LottiePlayer = dynamic(
  () => import("./LottiePlayer").then((mod) => mod.LottiePlayer),
  { ssr: false },
);

type LottieFromPublicProps = {
  src: string;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  loop?: boolean;
  speed?: number;
  /** Required unless `decorative` is true (then it is ignored). */
  "aria-label"?: string;
  /** Shown when `prefers-reduced-motion: reduce`, fetch fails, or JSON is invalid. */
  reducedMotionFallback: React.ReactNode;
  /** When true, hides the animation from assistive tech (use if copy elsewhere describes the state). */
  decorative?: boolean;
};

export function LottieFromPublic({
  src,
  className,
  containerClassName,
  placeholderClassName,
  loop = true,
  speed = 1,
  "aria-label": ariaLabelProp,
  reducedMotionFallback,
  decorative = false,
}: LottieFromPublicProps) {
  const ariaLabel = ariaLabelProp ?? (decorative ? undefined : "Animation");
  const [animationData, setAnimationData] = useState<unknown>(null);
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setIsLoading(false);
      return;
    }

    const cached = getCachedLottieAnimationData(src);
    if (cached) {
      setAnimationData(cached);
      setFailed(false);
      setIsLoading(false);
      return;
    }

    setAnimationData(null);
    setFailed(false);
    setIsLoading(true);
    let cancelled = false;
    void preloadLottieAnimationData(src)
      .then((data) => {
        if (!cancelled) {
          setAnimationData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [src, reduceMotion]);

  // Reduced motion or failed load
  if (reduceMotion || failed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {reducedMotionFallback}
      </motion.div>
    );
  }

  // Still loading - show skeleton
  if (isLoading || !animationData) {
    return (
      <motion.div
        className={cn("flex items-center justify-center", containerClassName)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        aria-busy={decorative ? undefined : true}
        aria-label={decorative ? undefined : ariaLabel}
      >
        <div className="relative flex w-full items-center justify-center">
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-[28px] bg-[rgb(var(--surface-elevated))]/40",
              placeholderClassName ?? "aspect-square max-w-[220px]",
            )}
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/5 via-white/10 to-white/5" />
          </div>
          <Loader2
            className="absolute h-8 w-8 animate-spin text-[rgb(var(--text-muted))]"
            aria-hidden
          />
        </div>
      </motion.div>
    );
  }

  // Animation loaded
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={cn("flex items-center justify-center", containerClassName)}
        role={decorative ? "presentation" : undefined}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : ariaLabel}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <LottiePlayer
          animationData={animationData}
          loop={loop}
          className={className}
          speed={speed}
        />
      </motion.div>
    </AnimatePresence>
  );
}
