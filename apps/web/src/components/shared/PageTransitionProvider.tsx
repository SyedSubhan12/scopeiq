"use client";

import { useEffect } from "react";
import gsap from "gsap/dist/gsap";

/**
 * Page transition provider with smooth fade/slide effects
 * Applied globally to provide polish during navigation
 *
 * Uses GSAP for reliable cross-browser animations
 * Works with Next.js navigation without requiring Barba.js hooks
 */
export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Detect if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    // Animate page in on mount
    const timeline = gsap.timeline();

    const pageElement = document.querySelector("[data-page-transition]");
    if (pageElement) {
      timeline.from(pageElement as HTMLElement, {
        opacity: 0,
        y: 10,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  }, []);

  return (
    <div data-page-transition className="transition-container">
      {children}
    </div>
  );
}
