# Lenis

## Best Fit

Use Lenis when the scroll feel itself is part of the experience. It works well on editorial, landing, and storytelling pages, especially when GSAP ScrollTrigger needs smooth, interpolated motion.

## Basic React Pattern

```tsx
'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    })

    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }

    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return null
}
```

## GSAP Integration

```ts
const lenis = new Lenis()

lenis.on('scroll', ScrollTrigger.update)

const update = (time: number) => {
  lenis.raf(time * 1000)
}

gsap.ticker.add(update)
gsap.ticker.lagSmoothing(0)

return () => {
  gsap.ticker.remove(update)
  lenis.destroy()
}
```

## Rules

- Keep only one active Lenis instance for a page shell unless there is a strong reason otherwise.
- Test anchor links, modals, and focus management because custom scroll can break them.
- Provide a reduced-motion or native-scroll fallback when the user does not want motion-heavy behavior.
