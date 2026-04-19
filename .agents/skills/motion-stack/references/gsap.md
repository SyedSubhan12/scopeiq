# GSAP

## Best Fit

Use GSAP when timing precision matters more than declarative convenience. It is the default choice for premium hero motion, pinned scroll scenes, reveal choreography, and shared timelines across multiple components.

## React Pattern

```tsx
'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function HeroMotion() {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-title]', {
        y: 32,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })

      gsap.from('[data-hero-card]', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        delay: 0.12,
        stagger: 0.08,
        ease: 'power3.out',
      })
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return <div ref={rootRef}>{/* content */}</div>
}
```

## ScrollTrigger Notes

- Register the plugin once before use.
- Call `ScrollTrigger.refresh()` after layout changes that affect heights.
- Kill triggers on cleanup if they are created outside `gsap.context()`.
- Prefer scrubbed transforms and opacity, not `top`, `left`, or expensive filters.

## Authoring Rules

- Build one master timeline per section when animations are related.
- Use labels instead of hardcoded delays when sequencing many steps.
- Keep selector scopes local to the component root.
- Avoid animating the same property from multiple timelines unless the handoff is explicit.
