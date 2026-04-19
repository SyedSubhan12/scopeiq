# Anime.js

## Best Fit

Use Anime.js for compact, isolated motion work: icon animations, button states, SVG drawing, hover responses, counters, and decorative accents. Reach for it when GSAP would be unnecessary for the scope.

## Example Pattern

```tsx
'use client'

import { useEffect, useRef } from 'react'
import anime from 'animejs'

export function PulseBadge() {
  const badgeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!badgeRef.current) return

    const animation = anime({
      targets: badgeRef.current,
      translateY: [10, 0],
      opacity: [0, 1],
      scale: [0.92, 1],
      duration: 500,
      easing: 'easeOutExpo',
    })

    return () => animation.pause()
  }, [])

  return <div ref={badgeRef}>New</div>
}
```

## Rules

- Keep Anime.js local to one component or illustration.
- Prefer explicit refs over broad selectors in React.
- Pause or remove animations on cleanup.
- Do not mix Anime.js with GSAP on the same target unless one library fully owns different properties.
