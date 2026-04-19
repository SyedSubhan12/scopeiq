"use client";

/**
 * ScrollRevealSection — GSAP ScrollTrigger wrapper.
 *
 * Wraps any dashboard section so it fades + slides in when it enters the
 * viewport. Uses the gsap/dist/gsap dynamic import so it only loads on
 * client side and never blocks SSR.
 *
 * Usage:
 *   <ScrollRevealSection>
 *     <SomeWidget />
 *   </ScrollRevealSection>
 */

import { useEffect, useRef } from "react";

interface ScrollRevealSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in seconds before the reveal starts. Default 0. */
  delay?: number;
  /** Y offset to animate from. Default 24. */
  y?: number;
}

export function ScrollRevealSection({
  children,
  className,
  delay = 0,
  y = 24,
}: ScrollRevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let st: { kill: () => void } | null = null;
    let tween: { kill: () => void } | null = null;
    let cancelled = false;

    void Promise.all([
      import("gsap/dist/gsap"),
      import("gsap/dist/ScrollTrigger"),
    ]).then(([gsapMod, stMod]) => {
      if (cancelled) return;

      const gsap = (gsapMod as { default: { from: (...a: unknown[]) => { kill: () => void }; registerPlugin: (...a: unknown[]) => void } }).default;
      const ScrollTrigger = (stMod as { default: { create: (...a: unknown[]) => { kill: () => void } } }).default;

      gsap.registerPlugin(ScrollTrigger);

      // Set initial state
      el.style.opacity = "0";
      el.style.transform = `translateY(${y}px)`;

      st = ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          tween = gsap.from(el, {
            opacity: 0,
            y,
            duration: 0.5,
            delay,
            ease: "power2.out",
            clearProps: "all",
          }) as { kill: () => void };
        },
      });
    });

    return () => {
      cancelled = true;
      st?.kill();
      tween?.kill();
    };
  }, [delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
