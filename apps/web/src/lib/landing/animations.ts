export const EASES = {
  smooth: "power2.out",
  snappy: "expo.out",
  bounce: "back.out(1.4)",
  spring: "elastic.out(1, 0.5)",
  none: "none",
} as const;

export const DURATIONS = {
  fast: 0.25,
  normal: 0.5,
  slow: 0.8,
  crawl: 1.2,
} as const;

export const STAGGER = {
  tight: 0.06,
  normal: 0.12,
  loose: 0.2,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isTouch(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function splitWords(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent ?? "";
  el.textContent = "";
  const words = text.trim().split(/\s+/);
  return words.map((word, i) => {
    const wrapper = document.createElement("span");
    wrapper.className = "lv2-word inline-block overflow-hidden align-bottom";
    const inner = document.createElement("span");
    inner.className = "lv2-word-inner inline-block will-change-transform";
    inner.textContent = word;
    wrapper.appendChild(inner);
    el.appendChild(wrapper);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    return inner;
  });
}
