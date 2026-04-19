"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  format?: "int" | "percent" | "decimal" | "range";
  rangeEnd?: number;
  className?: string;
  triggerOnce?: boolean;
};

/**
 * Counts up to `value` when it scrolls into view. Uses IntersectionObserver so
 * it works without GSAP ScrollTrigger — simpler and reduced-motion friendly.
 */
export function CounterNumber({
  value,
  suffix = "",
  prefix = "",
  duration = 1800,
  format = "int",
  rangeEnd,
  className = "",
  triggerOnce = true,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string>(format === "range" && rangeEnd ? `${value}–${rangeEnd}` : prefix + "0" + suffix);
  const playedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      setDisplay(formatVal(value, format, prefix, suffix, rangeEnd));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !playedRef.current) {
            playedRef.current = true;
            animate();
            if (triggerOnce) io.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => io.disconnect();

    function animate() {
      const start = performance.now();
      const from = 0;
      const to = value;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        const current = from + (to - from) * eased;
        setDisplay(formatVal(current, format, prefix, suffix, rangeEnd, t));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [value, duration, format, prefix, suffix, rangeEnd, triggerOnce]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

function formatVal(
  n: number,
  format: Props["format"],
  prefix: string,
  suffix: string,
  rangeEnd?: number,
  t?: number
) {
  if (format === "range" && rangeEnd) {
    const progress = t ?? 1;
    const a = Math.round(n);
    const b = Math.round(rangeEnd * progress);
    return `${prefix}${a}–${b}${suffix}`;
  }
  if (format === "percent") return `${prefix}${Math.round(n)}${suffix || "%"}`;
  if (format === "decimal") return `${prefix}${n.toFixed(1)}${suffix}`;
  return `${prefix}${Math.round(n)}${suffix}`;
}
