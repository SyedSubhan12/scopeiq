# Lottie Quick Reference

## Export Hygiene

- Flatten precomps where possible.
- Remove unused layers and unsupported effects.
- Test exported files before shipping.

## Next.js Integration

Use dynamic import for client-only players when needed:

```tsx
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("./BrandMarkLottie"), { ssr: false });
```

## Reduced Motion

- Detect reduced motion preferences.
- Swap decorative loops for static imagery or no-op presentation.

## Debugging

- Blank animation often means unsupported effects or masks.
- Jank usually means too many layers or too much runtime work.

