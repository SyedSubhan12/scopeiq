# Library Selection

## Use GSAP When

- Sequencing multiple sections or elements with timelines
- Building scroll-linked scenes with `ScrollTrigger`
- Pinning sections or creating scrubbed storytelling
- Animating SVG paths, counters, or complex transforms
- Coordinating one animation system across a full page

## Use Lenis When

- The design explicitly asks for smooth scrolling
- Scroll feel must be more controlled than native browser scrolling
- GSAP ScrollTrigger or custom parallax needs stable scroll interpolation

## Use Anime.js When

- The effect is local to one component or illustration
- The task is mostly opacity, transform, stroke, or number animation
- The page does not need the broader GSAP ecosystem

## Use Barba.js When

- The app behaves like a multipage site and navigation can be fully intercepted
- Page transition continuity matters more than framework-native routing
- You control the markup lifecycle around page containers and hooks

## Avoid or Challenge

- Adding Lenis just for one simple reveal
- Adding Barba.js inside an existing Next.js App Router app without a deliberate routing redesign
- Running Anime.js and GSAP against the same property on the same element
- Using scroll-heavy scenes without reduced-motion behavior
