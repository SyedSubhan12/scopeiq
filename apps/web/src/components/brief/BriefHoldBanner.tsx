"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface BriefHoldBannerProps {
  score: number;
  threshold?: number | undefined;
  onOverride?: (() => void) | undefined;
}

export function BriefHoldBanner({ score, threshold = 60, onOverride }: BriefHoldBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !bannerRef.current) return;

    import("gsap/dist/gsap").then(({ default: gsap }) => {
      gsap.from(bannerRef.current, {
        y: -12,
        opacity: 0,
        duration: 0.35,
        ease: "power2.out",
      });
    });
  }, []);

  if (score >= threshold) return null;

  return (
    <div
      ref={bannerRef}
      className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-800">
          Brief auto-held — clarity score below {threshold}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-amber-700">
          This brief scored {score}/100 and was automatically placed on hold. Review the flagged
          fields and request clarification, or override if you are confident scope is clear enough
          to proceed.
        </p>
      </div>
      {onOverride ? (
        <button
          type="button"
          onClick={onOverride}
          className="shrink-0 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50"
        >
          Override
        </button>
      ) : null}
    </div>
  );
}
