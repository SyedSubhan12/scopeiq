"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Loader2 } from "lucide-react";
import { cn } from "@novabots/ui";

interface FlagDetectionBannerProps {
  scanning: boolean;
  flagCount?: number | undefined;
  latencyMs?: number | undefined;
  className?: string | undefined;
}

export function FlagDetectionBanner({
  scanning,
  flagCount,
  latencyMs,
  className,
}: FlagDetectionBannerProps) {
  const latencyRef = useRef<HTMLSpanElement>(null);
  const hasResult = !scanning && flagCount !== undefined && latencyMs !== undefined;

  useEffect(() => {
    const el = latencyRef.current;
    if (!el || !hasResult || latencyMs === undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = `${latencyMs}`;
      return;
    }
    let startTimestamp: number | null = null;
    const duration = 600;
    const target = latencyMs;
    function step(timestamp: number) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (el) el.textContent = String(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [hasResult, latencyMs]);

  return (
    <AnimatePresence mode="wait">
      {scanning ? (
        <motion.div
          key="scanning"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-2.5",
            className,
          )}
        >
          <Loader2 className="h-4 w-4 animate-spin text-[#1D9E75]" />
          <span className="text-sm text-[rgb(var(--text-secondary))]">
            Scanning for scope changes
          </span>
          <ScanningDots />
        </motion.div>
      ) : hasResult ? (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-4 py-2.5",
            (flagCount ?? 0) > 0
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50",
            className,
          )}
        >
          <ShieldAlert className={cn(
            "h-4 w-4",
            (flagCount ?? 0) > 0 ? "text-red-500" : "text-[#1D9E75]",
          )} />
          <span className={cn(
            "text-sm font-medium",
            (flagCount ?? 0) > 0 ? "text-red-700" : "text-emerald-700",
          )}>
            {(flagCount ?? 0) > 0
              ? `${flagCount} flag${(flagCount ?? 0) !== 1 ? "s" : ""} detected in `
              : "No flags detected in "}
            <span ref={latencyRef}>0</span>
            ms
          </span>
          {(flagCount ?? 0) === 0 && (
            <span className="text-xs text-emerald-600">— within SLA</span>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ScanningDots() {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-[#1D9E75]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}
