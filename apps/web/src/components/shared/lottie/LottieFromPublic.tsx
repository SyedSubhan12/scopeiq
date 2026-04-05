"use client";

import { cn } from "@novabots/ui";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LottieFromPublicProps = {
  src: string;
  className?: string;
  containerClassName?: string;
  loop?: boolean;
  speed?: number;
  "aria-label": string;
  /** Shown when `prefers-reduced-motion: reduce`, fetch fails, or JSON is invalid. */
  reducedMotionFallback: React.ReactNode;
  /** When true, hides the animation from assistive tech (use if copy elsewhere describes the state). */
  decorative?: boolean;
};

export function LottieFromPublic({
  src,
  className,
  containerClassName,
  loop = true,
  speed = 1,
  "aria-label": ariaLabel,
  reducedMotionFallback,
  decorative = false,
}: LottieFromPublicProps) {
  const [animationData, setAnimationData] = useState<unknown>(null);
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    void fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<unknown>;
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [src, reduceMotion]);

  if (reduceMotion || failed) {
    return <>{reducedMotionFallback}</>;
  }

  if (!animationData) {
    return (
      <div
        className={cn("flex items-center justify-center", containerClassName)}
        aria-busy="true"
        aria-label={ariaLabel}
      >
        <Loader2
          className="h-8 w-8 animate-spin text-[rgb(var(--text-muted))]"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center", containerClassName)}
      role={decorative ? "presentation" : undefined}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : ariaLabel}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        className={className}
        onDOMLoaded={() => {
          lottieRef.current?.setSpeed(speed);
        }}
      />
    </div>
  );
}
