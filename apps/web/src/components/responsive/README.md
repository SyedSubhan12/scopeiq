# Responsive Design System

A production-grade, mobile-first responsive design system built with modern frontend engineering practices.

## 📱 Philosophy

**Mobile-first, progressively enhanced.** Design for the smallest screen first, then scale up—not the other way around.

## 🎯 Breakpoints

| Token | Size | Target Device |
|-------|------|---------------|
| `sm`  | 640px  | Mobile landscape |
| `md`  | 768px  | Tablet portrait |
| `lg`  | 1024px | Tablet landscape / small desktop |
| `xl`  | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |
| `3xl` | 1920px | Ultra-wide displays |

### Usage in Tailwind

```tsx
// Mobile-first: base styles apply to smallest screens
<div className="
  grid-cols-1        // Mobile: 1 column
  sm:grid-cols-2     // Tablet: 2 columns  
  lg:grid-cols-3     // Desktop: 3 columns
  xl:grid-cols-4     // Large desktop: 4 columns
">
  {items}
</div>
```

## 🎨 Fluid Typography

Typography scales smoothly between mobile and desktop using CSS `clamp()`:

```css
/* Automatic scaling */
h1 { font-size: clamp(2rem, 5vw + 0.5rem, 4rem); }
h2 { font-size: clamp(1.5rem, 3.5vw + 0.5rem, 3rem); }
p  { font-size: clamp(0.875rem, 0.5vw + 0.75rem, 1rem); }
```

**No manual breakpoint overrides needed**—text scales fluidly.

## 📦 Components

### Container

Constrains content width with responsive padding.

```tsx
import { Container, Section } from "@/components/responsive";

// Simple container
<Container size="xl">
  <p>Content centered with max-width 80rem</p>
</Container>

// Section with built-in padding
<Section size="lg">
  <h2>Section with responsive vertical padding</h2>
</Section>
```

**Sizes:** `sm` | `md` | `lg` | `xl` | `2xl` | `full` | `fluid`

### Grid

Mobile-first grid system.

```tsx
import { Grid, GridAutoFill, GridAutoFit } from "@/components/responsive";

// Explicit columns per breakpoint
<Grid cols={1} colsSm={2} colsLg={3} colsXl={4} gap="lg">
  {cards.map(card => <Card key={card.id} {...card} />)}
</Grid>

// Auto-fill: creates as many columns as fit
<GridAutoFill min="280px" gap="lg">
  {cards.map(card => <Card key={card.id} {...card} />)}
</GridAutoFill>
```

### Card

Adaptive card component with responsive padding.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from "@/components/responsive";

<Card variant="elevated" padding="lg" interactive>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>
    <p>Content adapts padding on mobile vs desktop</p>
  </CardBody>
  <CardFooter>
    <button>Action</button>
  </CardFooter>
</Card>
```

### ResponsiveImage

Wraps Next.js Image with responsive utilities.

```tsx
import { ResponsiveImage } from "@/components/responsive";

<ResponsiveImage
  src="/hero.jpg"
  alt="Hero"
  aspectRatio="banner"  // 21:9
  priority
/>

// Art direction: different images per device
<ResponsivePicture
  mobile="/hero-mobile.jpg"
  desktop="/hero-desktop.jpg"
  alt="Hero"
  mobileWidth={640}
  mobileHeight={480}
  desktopWidth={1920}
  desktopHeight={1080}
/>
```

### Navbar

Mobile hamburger menu with slide-out drawer.

```tsx
import { ResponsiveNavbar } from "@/components/responsive";

<ResponsiveNavbar
  brand={{ name: "ScopeIQ", href: "/" }}
  navItems={[
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
  ]}
  auth={{
    loggedIn: false,
    checking: false,
    loginHref: "/login",
    registerHref: "/register",
    dashboardHref: "/dashboard",
  }}
/>
```

### Modal

Responsive dialog that adapts to screen size.

```tsx
import { ResponsiveModal } from "@/components/responsive";

<ResponsiveModal 
  open={isOpen} 
  onOpenChange={setIsOpen}
  size="lg"
  title="Edit Profile"
>
  <form>
    {/* Form content */}
  </form>
</ResponsiveModal>
```

**Sizes:** `sm` | `md` | `lg` | `xl` | `full`

### HeroSection

Pre-built hero section with multiple layout variants.

```tsx
import { HeroSection, HeroButton } from "@/components/responsive";

<HeroSection
  title="Build better products"
  subtitle="The modern way"
  description="A longer description that scales beautifully"
  variant="center"  // "center" | "left" | "split"
  actions={
    <>
      <HeroButton href="/register" variant="primary">
        Get Started
      </HeroButton>
      <HeroButton href="/demo" variant="secondary">
        Watch Demo
      </HeroButton>
    </>
  }
  media={<ResponsiveImage src="/hero.jpg" alt="Hero" />}
/>
```

## 🔧 Hooks

### useMediaQuery

```tsx
import { useMediaQuery } from "@/hooks/responsive";

const isDesktop = useMediaQuery("(min-width: 1024px)");
```

### useBreakpoint

```tsx
import { useBreakpoint } from "@/hooks/responsive";

const breakpoint = useBreakpoint();
// "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
```

### useDeviceType

```tsx
import { useDeviceType } from "@/hooks/responsive";

const device = useDeviceType();
// "mobile" | "tablet" | "laptop" | "desktop" | "ultrawide"
```

### Convenience Hooks

```tsx
import { 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop,
  useViewportSize,
  useOrientation,
  useTouchDevice,
  useRetinaDisplay,
} from "@/hooks/responsive";

const isMobile = useIsMobile();
const { width, height } = useViewportSize();
const orientation = useOrientation(); // "portrait" | "landscape"
```

## 📐 Spacing Scale

Responsive padding that scales by breakpoint:

```tsx
// Mobile: tight padding
<div className="py-12 px-4">

// Tablet: more breathing room  
<div className="sm:py-16 sm:px-6">

// Desktop: maximum spacing
<div className="lg:py-20 lg:px-8">
```

Or use the pre-combined class:

```tsx
import { sectionPaddingFull } from "@/lib/responsive/tokens";

<section className={sectionPaddingFull}>
```

## 🎯 Best Practices

### 1. Mobile-First Always

```tsx
// ✅ GOOD: Mobile-first
<div className="flex flex-col md:flex-row">

// ❌ BAD: Desktop-first
<div className="flex flex-row md:flex-col">
```

### 2. Avoid Fixed Widths

```tsx
// ✅ GOOD: Use max-width
<div className="w-full max-w-4xl">

// ❌ BAD: Fixed width
<div className="w-[1200px]">
```

### 3. Use `min()` and `max()` for Fluid Sizing

```tsx
// ✅ Responsive width that never exceeds viewport
<div className="w-[min(100%,800px)]">

// ✅ Image that scales but never overflows
<img className="max-w-full h-auto">
```

### 4. Prevent Horizontal Scroll

```tsx
// In globals.css
html {
  overflow-x: hidden;
}

// Avoid fixed positioning that breaks on mobile
// Use sticky instead where possible
```

### 5. Lazy Load Heavy Components

```tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./HeavyChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-64" />,
});

// Only render on larger screens
const { useIsDesktop } = "@/hooks/responsive";

function Dashboard() {
  const isDesktop = useIsDesktop();
  
  return (
    <div>
      {isDesktop && <HeavyChart />}
      {!isDesktop && <MobileFriendlySummary />}
    </div>
  );
}
```

### 6. Touch-Friendly Targets

```tsx
// Minimum 44x44px touch target (Apple HIG)
<button className="min-h-[44px] min-w-[44px]">

// Add padding for touch devices
<input className="p-3 sm:p-2" />
```

### 7. Respect Reduced Motion

```tsx
import { useReducedMotion } from "framer-motion";

const reduceMotion = useReducedMotion();

<motion.div
  initial={reduceMotion ? undefined : { opacity: 0 }}
  animate={reduceMotion ? undefined : { opacity: 1 }}
>
```

## 🧪 Testing Strategy

### Chrome DevTools

1. Open DevTools → Toggle device toolbar
2. Test at:
   - **320px** (iPhone SE)
   - **375px** (iPhone 12)
   - **768px** (iPad)
   - **1024px** (iPad Pro)
   - **1440px** (Desktop)
   - **1920px** (Large desktop)

### Real Devices

Test on actual devices for:
- Touch interactions
- Performance on mobile CPUs
- Orientation changes
- Network throttling

### Edge Cases

- **Very small screens** (320px): Ensure no overflow
- **Ultra-wide monitors** (2560px+): Content shouldn't stretch infinitely
- **Zoom 200%**: Text should remain readable
- **Landscape mobile**: Horizontal space is wider

## ♿ Accessibility

- All interactive elements have `focus-visible` states
- Keyboard navigation works at all breakpoints
- `aria-label` and `aria-expanded` on toggle buttons
- Semantic HTML (`nav`, `section`, `main`, `aside`)
- Reduced motion preferences respected

## 📁 File Structure

```
apps/web/
├── src/
│   ├── components/
│   │   └── responsive/
│   │       ├── Container.tsx
│   │       ├── Grid.tsx
│   │       ├── Card.tsx
│   │       ├── Image.tsx
│   │       ├── Navbar.tsx
│   │       ├── Modal.tsx
│   │       ├── HeroSection.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   └── responsive.ts
│   ├── lib/
│   │   └── responsive/
│   │       └── tokens.ts
│   └── app/
│       └── globals.css

packages/ui/
└── tailwind.config.ts
```

## 🚀 Quick Start

```tsx
// 1. Import components
import { Container, Grid, Card, ResponsiveImage } from "@/components/responsive";
import { useIsMobile } from "@/hooks/responsive";

// 2. Build responsive layout
export default function Page() {
  const isMobile = useIsMobile();
  
  return (
    <Container size="xl">
      <Grid cols={1} colsSm={2} colsLg={3} gap="lg">
        {items.map(item => (
          <Card key={item.id} variant="elevated">
            <ResponsiveImage 
              src={item.image} 
              alt={item.title}
              aspectRatio="landscape"
            />
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Card>
        ))}
      </Grid>
    </Container>
  );
}
```

## 🎨 Design Tokens

Access design tokens for programmatic use:

```tsx
import { 
  breakpoints, 
  spacing, 
  containerMaxWidths,
  gapScale,
} from "@/lib/responsive/tokens";

console.log(breakpoints.lg); // 1024
console.log(spacing.md);     // "1rem"
```

---

**Built with:** Next.js 14, Tailwind CSS, Framer Motion, Radix UI
**Inspired by:** Apple, Airbnb, Stripe design systems
