# Barba.js

## Best Fit

Use Barba.js for curated page transitions on sites where navigation is intentionally intercepted and page containers follow a consistent contract. It is strongest on marketing or editorial sites that behave like a classic multipage app.

## Challenge Before Use

- Is this project already using Next.js App Router or another SPA router?
- Does the team want Barba.js to own navigation lifecycle and transition hooks?
- Can every transitioned page provide predictable container markup and hooks?

If the answer is no, do not default to Barba.js.

## Implementation Guidance

- Define a single transition architecture before coding individual scenes.
- Keep enter and leave states symmetrical.
- Re-initialize page-specific scripts after each transition.
- Destroy observers, timelines, and listeners from the previous container before activating the next one.

## Next.js Warning

Barba.js usually conflicts with App Router expectations because both systems want to control navigation, page lifecycle, and DOM replacement. In Next.js, prefer in-page transitions with GSAP or Framer Motion unless the user explicitly wants to restructure routing around Barba.js.
