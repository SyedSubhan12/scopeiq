/**
 * Responsive Design Tokens
 * Mobile-first breakpoint system aligned with Tailwind CSS defaults
 * plus custom extensions for ultra-wide and special cases.
 */

export const breakpoints = {
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet portrait
  lg: 1024,   // Tablet landscape / small desktop
  xl: 1280,   // Desktop
  "2xl": 1536, // Large desktop
  "3xl": 1920, // Ultra-wide displays
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Spacing scale in rem (mobile-first)
 * Base: 16px root font size
 */
export const spacing = {
  xs: "0.25rem",    // 4px
  sm: "0.5rem",     // 8px
  md: "1rem",       // 16px
  lg: "1.5rem",     // 24px
  xl: "2rem",       // 32px
  "2xl": "2.5rem",  // 40px
  "3xl": "3rem",    // 48px
  "4xl": "4rem",    // 64px
} as const;

/**
 * Container max-widths per breakpoint
 * Prevents content from stretching too wide on large screens
 */
export const containerMaxWidths = {
  sm: "100%",
  md: "720px",
  lg: "960px",
  xl: "1200px",
  "2xl": "1400px",
  "3xl": "1600px",
} as const;

/**
 * Typography scale (mobile-first)
 * Uses rem for accessibility and user zoom support
 */
export const typographyScale = {
  xs: {
    mobile: "0.75rem",     // 12px
    desktop: "0.75rem",    // 12px
  },
  sm: {
    mobile: "0.875rem",    // 14px
    desktop: "0.875rem",   // 14px
  },
  base: {
    mobile: "1rem",        // 16px
    desktop: "1rem",       // 16px
  },
  lg: {
    mobile: "1.125rem",    // 18px
    desktop: "1.125rem",   // 18px
  },
  xl: {
    mobile: "1.25rem",     // 20px
    desktop: "1.25rem",    // 20px
  },
  "2xl": {
    mobile: "1.5rem",      // 24px
    desktop: "1.5rem",     // 24px
  },
  "3xl": {
    mobile: "1.875rem",    // 30px
    desktop: "1.875rem",   // 30px
  },
  "4xl": {
    mobile: "2.25rem",     // 36px
    desktop: "2.25rem",    // 36px
  },
  "5xl": {
    mobile: "3rem",        // 48px
    desktop: "3rem",       // 48px
  },
} as const;

/**
 * Grid column configurations
 * Mobile-first: starts at 1 column, scales up
 */
export const gridColumns = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
} as const;

/**
 * Gap scale for grids and flex layouts
 */
export const gapScale = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
} as const;

/**
 * Responsive padding for sections
 * Tighter on mobile, more breathing room on desktop
 */
export const sectionPadding = {
  mobile: "py-12 px-4",
  tablet: "sm:py-16 sm:px-6",
  desktop: "lg:py-20 lg:px-8",
} as const;

// Combined section padding class
export const sectionPaddingFull = `${sectionPadding.mobile} ${sectionPadding.tablet} ${sectionPadding.desktop}`;
