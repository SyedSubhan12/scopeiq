"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/animations/utils/gsap.config";

type StageOptions = {
  selector?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  scrub?: boolean;
  start?: string;
};

/**
 * Orchestrates a staggered entrance timeline for every element matching
 * `selector` inside the ref'd root. On mount it plays once, then each
 * element gets its own ScrollTrigger reveal below the fold.
 */
export function useGsapStage<T extends HTMLElement>(
  options: StageOptions = {},
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const {
      selector = "[data-stage]",
      stagger = 0.08,
      y = 24,
      duration = 0.9,
      start = "top 85%",
    } = options;

    const items = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(items, { opacity: 0, y, filter: "blur(6px)" });

      // initial above-the-fold reveal
      const aboveFold = items.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.95;
      });
      if (aboveFold.length) {
        gsap.to(aboveFold, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration,
          stagger,
          ease: "power3.out",
          delay: 0.05,
        });
      }

      // below-the-fold scroll reveals
      items
        .filter((el) => !aboveFold.includes(el))
        .forEach((el, i) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration,
            ease: "power3.out",
            delay: (i % 4) * stagger,
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: "play none none reverse",
            },
          });
        });
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger && root.contains(st.trigger as Node)) st.kill();
      });
    };
  }, [options]);

  return ref;
}

/**
 * Count-up number animation driven by GSAP. Returns a ref to attach to the
 * text node whose innerText should animate from 0 → `to` when visible.
 */
export function useGsapCountUp(to: number, decimals = 0) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: to,
      duration: 1.8,
      ease: "power3.out",
      paused: true,
      onUpdate: () => {
        el.textContent = obj.v.toFixed(decimals);
      },
    });

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => tween.play(),
    });

    return () => {
      tween.kill();
      st.kill();
    };
  }, [to, decimals]);

  return ref;
}
