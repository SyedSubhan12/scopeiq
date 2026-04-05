---
name: premium-web-animations
description: Architects and implements high-end marketing and product UIs with purposeful motion, Lottie assets, and modern component patterns. Use when building landing pages, hero sections, micro-interactions, onboarding visuals, empty states, or when the user mentions Lottie, After Effects exports, motion design, 21st.dev, or “stunning” animated websites.
---

# Premium Web Animations & Visual Design

## Mindset

- Treat motion as **information**: every animation answers “what changed?” or “where should I look?”
- Prefer **one strong focal moment** over many competing effects.
- Match **ScopeIQ stack** unless the user specifies otherwise: Next.js App Router, Tailwind, Radix, Framer Motion, existing design tokens.

## Visual Design Bar

- **Hierarchy**: one primary headline, one primary CTA, supporting copy and secondary actions visually quieter.
- **Spacing**: generous whitespace; align to an 8px (or token) grid; avoid arbitrary `px` sprawl—use scale utilities.
- **Typography**: limit font roles (display / body / mono if needed); tune line-height and max-width for readability.
- **Color**: restrained palette; use contrast for CTAs; reserve saturated motion for key beats only.
- **Polish**: consistent radii, shadows, borders; hover/focus states for every interactive element; respect `prefers-reduced-motion`.

## Animation Rules

| Concern | Guideline |
|--------|-----------|
| Duration | UI feedback ~150–300ms; emphasis / hero ~400–900ms; avoid multi-second loops on critical paths unless decorative |
| Easing | Custom cubic-bezier or Framer Motion presets; avoid linear for UI position/scale |
| Choreography | Stagger lists modestly (30–80ms); don’t cascade entire pages |
| Performance | Animate `transform` and `opacity`; avoid layout-thrashing properties in loops |
| Accessibility | Provide non-animated equivalent when motion is decorative; honor reduced motion |

## Lottie

**When it shines:** branded loaders, success/empty states, hero accents, onboarding illustrations, subtle looped ambience.

**When to skip:** heavy scroll-synced effects (prefer CSS/Canvas/WebGL), tiny icons (use SVG), or very large JSON on above-the-fold without lazy load.

**Implementation (Next.js):**

- Prefer official or well-maintained players: e.g. `@lottiefiles/dotlottie-react` (DotLottie) or `lottie-react` with **dynamic import** / `ssr: false` for client-only bundles.
- **Lazy load** below-the-fold Lottie; use `loading="lazy"` or intersection observer patterns where applicable.
- **Size**: simplify AE compositions; trim layers; prefer DotLottie for smaller payloads when available.
- **Loop**: set sensible `loop` / segment ranges; pause off-screen animations to save CPU/GPU.

**Workflow:** Design in After Effects → Bodymovin/LottieFiles export → version asset in repo → wrap in a small React component with props for `loop`, `speed`, `className`, and reduced-motion fallback (static poster frame or simple CSS).

## Framer Motion (pair with Lottie)

- Use Motion for layout, page transitions, and gesture-driven UI; use Lottie for **illustrative** motion that would be painful in code.
- Avoid stacking heavy Lottie + complex layout animations on the same element without profiling.

## 21st.dev

- Use [21st.dev](https://21st.dev) as **reference** for layout, component composition, and interaction ideas—not as a dependency unless the user explicitly adds it.
- **Port patterns** into this codebase: Tailwind classes, Radix primitives, existing hooks and tokens; do not copy incompatible stacks blindly.

## Delivery Checklist

- [ ] Visual hierarchy and one clear primary action
- [ ] Focus-visible styles and keyboard paths intact
- [ ] `prefers-reduced-motion` respected (disable or replace Lottie loop)
- [ ] Lottie lazy-loaded or deferred where appropriate
- [ ] No client secrets; animation assets served like other static/media assets
- [ ] Lighthouse sanity: avoid blocking main thread with huge JSON parsers on first paint

## Additional Resources

- For Lottie export and QA tips, see [lottie-reference.md](lottie-reference.md)
