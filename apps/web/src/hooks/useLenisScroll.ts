"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

type LenisWindow = Window & {
  __lenis__?: Lenis;
};

type UseLenisScrollOptions = {
  enabled?: boolean;
  desktopOnly?: boolean;
  syncWithGsap?: boolean;
  duration?: number;
  lerp?: number;
};

/**
 * Hook to initialize Lenis smooth scrolling globally
 * Mount once in root layout for app-wide smooth scroll
 */
export function useLenisScroll({
  enabled = true,
  desktopOnly = false,
  syncWithGsap = false,
  duration = 1.2,
  lerp = 0.1,
}: UseLenisScrollOptions = {}) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (desktopOnly && window.matchMedia("(pointer: coarse)").matches) return;

    const lenisWindow = window as LenisWindow;

    // Only initialize if not already present
    if (lenisWindow.__lenis__) return;

    const lenis = new Lenis({
      duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lerp,
    });

    lenisWindow.__lenis__ = lenis;

    let frameId = 0;
    let active = true;
    let disposeGsapSync: (() => void) | undefined;

    function raf(time: number) {
      if (!active) return;
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    if (syncWithGsap) {
      void Promise.all([import("gsap/dist/gsap"), import("gsap/dist/ScrollTrigger")]).then(
        ([gsapMod, scrollTriggerMod]) => {
          if (!active) return;

          const gsap = (gsapMod as { default: { registerPlugin: (...args: unknown[]) => void } }).default;
          const ScrollTrigger = (scrollTriggerMod as { default: { update: () => void } }).default;
          gsap.registerPlugin(ScrollTrigger);

          lenis.on("scroll", ScrollTrigger.update);
          disposeGsapSync = () => {
            lenis.off("scroll", ScrollTrigger.update);
          };
        },
      );
    }

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      disposeGsapSync?.();
      lenis.destroy();
      delete lenisWindow.__lenis__;
    };
  }, [desktopOnly, duration, enabled, lerp, syncWithGsap]);
}

/**
 * Utility to scroll to element using Lenis
 */
export function scrollToElement(
  selector: string | HTMLElement,
  offset?: number
) {
  const lenis = (window as LenisWindow).__lenis__;
  if (!lenis) return;

  const element =
    typeof selector === "string"
      ? document.querySelector(selector)
      : selector;

  if (element instanceof HTMLElement) {
    lenis.scrollTo(element, { offset: offset ?? -80 });
  }
}
