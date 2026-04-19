"use client";

import { motion } from "framer-motion";

interface RouteLoadingProps {
  label?: string;
}

export function RouteLoading({ label = "Loading…" }: RouteLoadingProps) {
  return (
    <div
      className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3"
      role="status"
      aria-busy
      aria-live="polite"
    >
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-2 w-2 rounded-full bg-[#1D9E75]"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p className="text-xs text-[rgb(var(--text-muted))]">{label}</p>
    </div>
  );
}
