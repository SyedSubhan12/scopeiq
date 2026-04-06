---
name: premium-web-animations
description: Build high-end marketing and product UI with purposeful motion, Lottie assets, and polished visual hierarchy. Use when implementing landing pages, hero sections, onboarding visuals, empty states, motion-heavy product UI, Framer Motion choreography, or Lottie and After Effects exports.
---

# Premium Web Animations

## Overview

Treat motion as information. Use one clear focal moment, keep the visual hierarchy obvious, and preserve performance and accessibility.

## Design Bar

- Keep one primary CTA and one clear headline.
- Use restrained color and spacing; let motion emphasize only important moments.
- Tune typography, spacing, radii, borders, and shadows deliberately.
- Respect `prefers-reduced-motion`.

## Animation Rules

- Use `transform` and `opacity` for most motion.
- Keep feedback around 150-300ms and emphasis around 400-900ms.
- Use modest stagger, not full-page cascades.
- Avoid heavy looping motion on critical paths.

## Lottie Guidance

- Use Lottie for branded loaders, hero accents, onboarding visuals, and empty states.
- Skip it for tiny icons or heavy scroll-synced scenes.
- Prefer dynamic import or client-only loading in Next.js.
- Pause or defer off-screen animation when possible.
- Provide a reduced-motion fallback such as a static frame.

## ScopeIQ Defaults

Match the existing stack unless the task requires otherwise:

- Next.js App Router
- Tailwind and existing tokens
- Radix primitives
- Framer Motion for layout and gesture motion

## Additional Resource

Read [references/lottie-reference.md](references/lottie-reference.md) for export and integration details.

