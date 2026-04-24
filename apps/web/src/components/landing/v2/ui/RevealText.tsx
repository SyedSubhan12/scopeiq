"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
};

/**
 * Word-by-word reveal. No GSAP dependency — CSS keyframes w/ per-word delay.
 * Plays when element enters viewport.
 */
export function RevealText({
  children,
  className = "",
  delay = 0,
  stagger = 0.07,
  as: Tag = "h1",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const words = children.trim().split(/\s+/);
    el.innerHTML = words
      .map(
        (w, i) =>
          `<span class="lv2-word" style="display:inline-block;overflow:hidden;vertical-align:bottom"><span class="lv2-word-inner" style="display:inline-block;transform:translateY(${reduced ? 0 : 110}%);opacity:${reduced ? 1 : 0};transition:transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay + i * stagger}s, opacity 0.5s ease ${delay + i * stagger}s">${escape(w)}</span></span>`
      )
      .join(" ");

    if (reduced) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const inners = el.querySelectorAll<HTMLSpanElement>(".lv2-word-inner");
            inners.forEach((node) => {
              node.style.transform = "translateY(0)";
              node.style.opacity = "1";
            });
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [children, delay, stagger]);

  const Component = Tag as React.ElementType;
  return <Component ref={ref as React.RefObject<HTMLElement>} className={className}>{children}</Component>;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}
