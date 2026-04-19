"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export interface AnimeAnimationConfig {
  targets: Parameters<typeof anime>[0];
  duration?: number;
  easing?: string;
  delay?: number;
  direction?: "normal" | "reverse" | "alternate";
  loop?: boolean | number;
  autoplay?: boolean;
}

/**
 * Hook to manage Anime.js animations with automatic cleanup
 */
export function useAnimeAnimation(
  config: AnimeAnimationConfig,
  dependencies: unknown[] = []
) {
  const animationRef = useRef<{ pause: () => void } | null>(null);

  useEffect(() => {
    // Kill previous animation
    if (animationRef.current) {
      animationRef.current.pause();
    }

    // Create new animation
    animationRef.current = anime({
      ...config,
      autoplay: config.autoplay ?? true,
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
        animationRef.current = null;
      }
    };
  }, dependencies);

  return animationRef.current;
}

/**
 * Preset animations for common use cases
 */
export const AnimePresets = {
  fadeIn: (target: Parameters<typeof anime>[0], duration = 300) => ({
    targets: target,
    opacity: [0, 1],
    duration,
    easing: "easeOutQuad",
  }),

  slideUp: (target: Parameters<typeof anime>[0], duration = 300) => ({
    targets: target,
    opacity: [0, 1],
    translateY: [20, 0],
    duration,
    easing: "easeOutQuad",
  }),

  slideDown: (target: Parameters<typeof anime>[0], duration = 300) => ({
    targets: target,
    opacity: [0, 1],
    translateY: [-20, 0],
    duration,
    easing: "easeOutQuad",
  }),

  slideLeft: (target: Parameters<typeof anime>[0], duration = 300) => ({
    targets: target,
    opacity: [0, 1],
    translateX: [20, 0],
    duration,
    easing: "easeOutQuad",
  }),

  slideRight: (target: Parameters<typeof anime>[0], duration = 300) => ({
    targets: target,
    opacity: [0, 1],
    translateX: [-20, 0],
    duration,
    easing: "easeOutQuad",
  }),

  scaleIn: (target: Parameters<typeof anime>[0], duration = 300) => ({
    targets: target,
    opacity: [0, 1],
    scale: [0.9, 1],
    duration,
    easing: "easeOutElastic(1, 0.6)",
  }),

  bounce: (target: Parameters<typeof anime>[0], duration = 600) => ({
    targets: target,
    translateY: [0, -10, 0],
    duration,
    easing: "easeInOutQuad",
    loop: true,
  }),

  pulse: (target: Parameters<typeof anime>[0], duration = 600) => ({
    targets: target,
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    duration,
    easing: "easeInOutQuad",
    loop: true,
  }),
};
