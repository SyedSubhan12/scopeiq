import gsap from "gsap/dist/gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

// Register plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Animation timing config matching Tailwind CSS custom properties
 * Ensures consistency across animations
 *
 * Maps to: --duration-fast, --duration-normal, --duration-slow, --duration-slower
 */
export const ANIMATION_CONFIG = {
  fast: 0.15, // --duration-fast (150ms)
  normal: 0.25, // --duration-normal (250ms)
  slow: 0.35, // --duration-slow (350ms)
  slower: 0.5, // --duration-slower (500ms)
} as const;

/**
 * Common easing functions for consistent animation feel
 */
export const EASING = {
  smooth: "power2.out",
  bouncy: "back.out",
  elastic: "elastic.out(1, 0.5)",
  instant: "none",
} as const;

/**
 * Utility to respect prefers-reduced-motion
 */
export function respectReducedMotion(duration: number): number {
  if (typeof window === "undefined") return duration;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  return prefersReducedMotion ? 0 : duration;
}

/**
 * Cleanup all active GSAP animations and ScrollTriggers
 * Use in useEffect cleanup functions
 */
export function cleanupGSAP() {
  ScrollTrigger.getAll().forEach((trigger: { kill: () => void }) => trigger.kill());
  gsap.killTweensOf("*");
}

export default gsap;
