# Lottie — Quick Reference

## Export hygiene (After Effects)

- Flatten precomps where possible; remove unused layers and effects Lottie cannot render.
- Test in LottieFiles preview or dotlottie tooling before shipping.
- Name layers clearly so engineers can toggle visibility or swap variants in JSON if needed.

## React integration sketch

- Dynamic import the player component so server bundles stay lean:

```tsx
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("./BrandMarkLottie"), { ssr: false });
```

- Inside `BrandMarkLottie`, mount the player and pass `className` for width/height constraints (e.g. `w-full max-w-md`).

## Reduced motion

- Read `window.matchMedia("(prefers-reduced-motion: reduce)")` or use CSS media in a wrapper.
- When reduced: show first frame as static image, or hide decorative Lottie entirely.

## Debugging

- If animation is blank: check unsupported effects, masks, or expressions.
- If janky: reduce layer count, lower resolution, use DotLottie, or move to CSS/Motion for that part.
