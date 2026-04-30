import { useEffect, useRef } from "react";

/**
 * Uses anime.js to stagger-reveal rows on mount.
 * Usage: const containerRef = useRowReveal();
 * Apply containerRef to the container element, add class 'reveal-row' to each row.
 */
export function useRowReveal(selector = ".reveal-row") {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Dynamically import anime.js to avoid SSR crashes
    void import("animejs").then(({ default: anime }) => {
      if (!containerRef.current) return;
      const rows = containerRef.current.querySelectorAll(selector);
      if (rows.length === 0) return;

      anime({
        targets: rows,
        opacity: [0, 1],
        translateY: [8, 0],
        delay: anime.stagger(40),
        duration: 200,
        easing: "easeOutQuart",
      });
    });
  }, [selector]);

  return containerRef;
}
