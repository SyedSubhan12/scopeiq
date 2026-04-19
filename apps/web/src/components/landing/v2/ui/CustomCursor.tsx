"use client";

import { useEffect, useRef } from "react";

/**
 * SVG ring cursor — desktop only, follows mouse with slight lag,
 * scales up on hover over [data-cursor="hover"] elements.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ring = ringRef.current;
    if (!ring) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let scale = 1;
    let currentScale = 1;
    let dirty = true;

    function tick() {
      const dx = mx - rx;
      const dy = my - ry;
      const ds = scale - currentScale;
      if (dirty || Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || Math.abs(ds) > 0.01) {
        rx += dx * 0.18;
        ry += dy * 0.18;
        currentScale += ds * 0.2;
        ring!.style.transform = `translate3d(${rx - 14}px, ${ry - 14}px, 0) scale(${currentScale})`;
        dirty = false;
      }
      raf = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      dirty = true;
      const t = e.target as HTMLElement | null;
      const over = t?.closest('a, button, [role="button"], [data-cursor="hover"]');
      if (over) {
        scale = 2.1;
        ring!.style.borderColor = "rgba(29, 158, 117, 1)";
        ring!.style.background = "rgba(29, 158, 117, 0.12)";
      } else {
        scale = 1;
        ring!.style.borderColor = "rgba(29, 158, 117, 0.7)";
        ring!.style.background = "transparent";
      }
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      className="pointer-events-none fixed left-0 top-0 z-[130] hidden h-7 w-7 rounded-full border-2 transition-[background-color,border-color] duration-200 md:block"
      style={{ borderColor: "rgba(29, 158, 117, 0.7)", mixBlendMode: "difference" }}
      aria-hidden
    />
  );
}
