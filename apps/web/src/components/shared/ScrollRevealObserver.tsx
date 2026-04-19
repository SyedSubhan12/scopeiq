"use client";

import { useEffect } from "react";
import gsap from "gsap/dist/gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP ScrollTrigger-powered reveal observer
 * Automatically reveals any element with `.reveal` class on scroll
 * with smooth fade-in + slide-up animation.
 *
 * Replaces IntersectionObserver for better performance and
 * more control over animation timing.
 */
export function ScrollRevealObserver() {
  useEffect(() => {
    // Animation config matching Tailwind durations
    const ANIMATION_CONFIG = {
      duration: 0.35, // --duration-slow
      offset: 20, // pixels to slide up
    };

    function setupReveals() {
      const reveals = document.querySelectorAll(".reveal:not([data-revealed])");

      reveals.forEach((el) => {
        const element = el as HTMLElement;

        // Mark as revealed to avoid re-animation
        element.setAttribute("data-revealed", "true");

        // Create individual ScrollTrigger for each element
        gsap.from(element, {
          scrollTrigger: {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none none",
            markers: false,
          },
          opacity: 0,
          y: ANIMATION_CONFIG.offset,
          duration: ANIMATION_CONFIG.duration,
          ease: "power2.out",
        });
      });
    }

    // Initial setup
    setupReveals();

    // Re-scan on DOM mutations (after route navigation, dynamic content)
    const mutation = new MutationObserver(() => {
      // Small delay to ensure DOM is fully updated
      requestAnimationFrame(setupReveals);
    });

    mutation.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return () => {
      mutation.disconnect();
      ScrollTrigger.getAll().forEach((trigger: { kill: () => void }) => trigger.kill());
    };
  }, []);

  return null;
}
