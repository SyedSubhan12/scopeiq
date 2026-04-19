---
name: motion-stack
description: Build premium web motion with GSAP, ScrollTrigger, Lenis, Anime.js, and Barba.js. Use when implementing smooth scrolling, scroll-synced sections, pinned storytelling, hero reveals, timeline-based animation, SVG motion, page transitions, or micro-interactions, and whenever a user explicitly asks for GSAP, Greensock, Lenis, Anime.js, Anime JS, or Barba.js.
---

# Motion Stack

## Overview

Treat motion as layout, timing, and state orchestration instead of decoration. Choose the smallest library set that can deliver the requested effect, and keep accessibility, cleanup, and performance part of the implementation.

## Library Selection

- Use GSAP for timeline orchestration, sequenced reveals, scroll-linked storytelling, SVG/path animation, counters, and any interaction that needs precise control.
- Use Lenis for smooth scrolling and pair it with GSAP ScrollTrigger when scroll position must drive animation.
- Use Anime.js for self-contained component or SVG micro-interactions when GSAP is not otherwise needed.
- Use Barba.js only for page-transition systems in multipage or marketing-site architectures that own navigation flow.
- Avoid stacking GSAP and Anime.js on the same elements unless the responsibility split is obvious.

## Delivery Rules

1. Check framework constraints before choosing the library.
2. Prefer `transform` and `opacity` over layout-triggering properties.
3. Respect `prefers-reduced-motion` with a real fallback, not just shorter timing.
4. Scope animations to a container and destroy all timelines, triggers, listeners, and RAF loops on cleanup.
5. Validate on mobile, low-power devices, and pages with dynamic content height.

## React and Next.js Notes

- In React, initialize motion inside `useEffect` or `useLayoutEffect` from a client component.
- With GSAP in React, prefer `gsap.context()` so selector-based animations clean up predictably.
- In Next.js App Router, default to GSAP or Anime.js for in-page motion.
- Treat Barba.js as opt-in and call out the navigation tradeoff clearly: it is usually a poor fit for Next.js App Router because Barba wants to control page transitions at the document-navigation layer.

## ScopeIQ Defaults

- Match the existing stack unless the user explicitly asks for this motion stack.
- Prefer GSAP plus Lenis for premium landing pages or scroll-led storytelling.
- Prefer Anime.js for isolated visual accents when bringing in GSAP would be unnecessary overhead.
- Do not introduce Barba.js into existing App Router flows unless the user explicitly wants an architectural change.

## References

- Read [references/library-selection.md](references/library-selection.md) first for choosing the stack.
- Read [references/gsap.md](references/gsap.md) for timeline, ScrollTrigger, and React cleanup patterns.
- Read [references/lenis.md](references/lenis.md) for smooth-scroll setup and GSAP integration.
- Read [references/animejs.md](references/animejs.md) for micro-interaction and SVG patterns.
- Read [references/barbajs.md](references/barbajs.md) before proposing or implementing page transitions.
