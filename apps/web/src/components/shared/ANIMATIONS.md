# Enhanced Animation Components & Hooks

This directory includes enhanced animation components using modern libraries: GSAP, Lenis, and Anime.js.

## Components

### ScrollRevealObserver

Automatically reveals elements with `.reveal` class on scroll using GSAP ScrollTrigger.

**Features:**
- Fade-in + slide-up animation
- Respects viewport position (80% threshold)
- Auto-detects new elements on DOM changes
- Replaces IntersectionObserver for better control

**Usage:**
```tsx
// Mount once in root layout
import { ScrollRevealObserver } from '@/components/shared/ScrollRevealObserver';

export default function Layout() {
  return (
    <>
      <ScrollRevealObserver />
      {/* ... */}
    </>
  );
}
```

```tsx
// Add `.reveal` to any element to animate on scroll
<div className="reveal">Content appears with fade-in</div>
```

### NotFoundAnimation

404 page animation with Anime.js entrance effect.

**Features:**
- Scale + opacity entrance
- Elastic easing for playful feel
- Smooth loop animation

**Usage:**
```tsx
import { NotFoundAnimation } from '@/components/shared/NotFoundAnimation';

export function NotFoundPage() {
  return (
    <div className="flex justify-center">
      <NotFoundAnimation />
    </div>
  );
}
```

### HeroFloatingLotties

Enhanced with GSAP parallax for smooth scroll-based depth effect.

**Features:**
- Combines Framer Motion floating + GSAP parallax
- Smooth scroll synchronization
- Maintains existing Lottie animations

**No changes needed** — automatically enhanced with better parallax.

### PageTransitionProvider

Smooth fade-in transition for page loads.

**Features:**
- Automatic page entrance animation
- Respects prefers-reduced-motion
- Global page transition wrapper

**Usage:**
```tsx
// Wrap in root layout
import { PageTransitionProvider } from '@/components/shared/PageTransitionProvider';

export default function Layout({ children }) {
  return (
    <PageTransitionProvider>
      {children}
    </PageTransitionProvider>
  );
}
```

## Hooks

### useLenisScroll()

Initialize Lenis smooth scrolling globally.

**Features:**
- One-time initialization (safe to call multiple times)
- Smooth easing for scroll behavior
- Global reference for scroll manipulation

**Usage:**
```tsx
'use client';

import { useLenisScroll, scrollToElement } from '@/hooks/useLenisScroll';

export function RootLayout({ children }) {
  useLenisScroll(); // Activate smooth scrolling

  return <div>{children}</div>;
}

// Scroll to element with Lenis
<button onClick={() => scrollToElement('#section-2', -80)}>
  Scroll to Section 2
</button>
```

### useAnimeAnimation()

Manage Anime.js animations with automatic cleanup.

**Features:**
- Auto-cleanup on unmount
- Preset animations included
- Full control over animation config

**Usage:**
```tsx
'use client';

import { useAnimeAnimation, AnimePresets } from '@/hooks/useAnimeAnimation';

export function AnimatedCard() {
  const ref = useRef<HTMLDivElement>(null);

  // Using a preset
  useAnimeAnimation(
    AnimePresets.slideUp(ref.current, 300),
    [ref]
  );

  // Or custom config
  useAnimeAnimation({
    targets: ref.current,
    opacity: [0, 1],
    translateX: [-50, 0],
    duration: 500,
    easing: 'easeOutElastic(1, 0.6)',
  }, [ref]);

  return <div ref={ref}>Animated content</div>;
}
```

**Available Presets:**
- `fadeIn` - Opacity animation
- `slideUp` - Slide from bottom
- `slideDown` - Slide from top
- `slideLeft` - Slide from right
- `slideRight` - Slide from left
- `scaleIn` - Scale + fade entrance
- `bounce` - Bouncing loop
- `pulse` - Pulsing opacity + scale

## Utilities

### ANIMATION_CONFIG (lib/gsap-setup.ts)

Timing constants matching Tailwind durations:

```tsx
import { ANIMATION_CONFIG, EASING } from '@/lib/gsap-setup';

gsap.to(element, {
  opacity: 0,
  duration: ANIMATION_CONFIG.slow, // 0.35s
  ease: EASING.smooth, // 'power2.out'
});
```

**Config Values:**
- `fast` - 0.15s (--duration-fast)
- `normal` - 0.25s (--duration-normal)
- `slow` - 0.35s (--duration-slow)
- `slower` - 0.5s (--duration-slower)

**Available Easing:**
- `smooth` - 'power2.out'
- `bouncy` - 'back.out'
- `elastic` - 'elastic.out(1, 0.5)'
- `instant` - 'none'

## Migration Guide

### From IntersectionObserver → ScrollRevealObserver

**Before:**
```tsx
// Manual CSS animations
<div className="reveal">Content</div>

/* CSS */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.35s ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**After:**
```tsx
// Just use the component + CSS class
import { ScrollRevealObserver } from '@/components/shared/ScrollRevealObserver';

<ScrollRevealObserver /> {/* Mount once */}

<div className="reveal">Content</div> {/* Auto-animated */}
```

### Adding Animations to Existing Components

**Option 1: Anime.js for simple elements**
```tsx
import { useAnimeAnimation, AnimePresets } from '@/hooks/useAnimeAnimation';

const ref = useRef(null);
useAnimeAnimation(AnimePresets.fadeIn(ref.current), [ref]);

return <div ref={ref}>Content</div>;
```

**Option 2: GSAP for complex sequences**
```tsx
import gsap from 'gsap/dist/gsap';
import { ANIMATION_CONFIG } from '@/lib/gsap-setup';

useEffect(() => {
  const tl = gsap.timeline();
  tl.from('.title', { opacity: 0, duration: ANIMATION_CONFIG.fast })
    .from('.content', { opacity: 0, y: 20 }, ANIMATION_CONFIG.normal);
}, []);
```

## Performance Tips

1. **Use GPU-accelerated properties:**
   - ✓ `transform` (translate, rotate, scale)
   - ✓ `opacity`
   - ✗ `left`, `top`, `width`, `height`

2. **Cleanup on unmount:**
   ```tsx
   useEffect(() => {
     const anim = anime({ /* ... */ });
     return () => anim.pause();
   }, []);
   ```

3. **Respect prefers-reduced-motion:**
   ```tsx
   import { respectReducedMotion } from '@/lib/gsap-setup';
   const duration = respectReducedMotion(500);
   ```

4. **Use ScrollTrigger for scroll effects:**
   - Better performance than onScroll listeners
   - Auto-optimizes off-screen elements

## Installed Libraries

- **gsap** (3.12.2) - Timeline animations, scroll triggers
- **@studio-freight/lenis** (1.1.13) - Smooth scrolling
- **animejs** (3.2.1) - Lightweight tweens
- **@barba/core** (3.1.1) - Page transitions (installed, ready for use)

## Resources

- [GSAP Docs](https://gsap.com/docs/)
- [Lenis Docs](https://lenis.studiofreight.com/)
- [Anime.js Docs](https://animejs.com/)
- [Barba.js Docs](https://barba.js.org/)
