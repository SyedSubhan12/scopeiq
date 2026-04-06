import { useState, useEffect, useMemo } from "react";

/**
 * useMediaQuery Hook
 * Returns true if the current viewport matches the media query
 * 
 * Usage:
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/**
 * useBreakpoint Hook
 * Returns the current active breakpoint
 * 
 * Usage:
 * const breakpoint = useBreakpoint();
 * if (breakpoint === "lg") { /* desktop * / }
 */
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export function useBreakpoint(): Breakpoint {
  const breakpoints = useMemo(
    () => [
      { name: "xs" as const, query: "(max-width: 639px)" },
      { name: "sm" as const, query: "(min-width: 640px) and (max-width: 767px)" },
      { name: "md" as const, query: "(min-width: 768px) and (max-width: 1023px)" },
      { name: "lg" as const, query: "(min-width: 1024px) and (max-width: 1279px)" },
      { name: "xl" as const, query: "(min-width: 1280px) and (max-width: 1535px)" },
      { name: "2xl" as const, query: "(min-width: 1536px)" },
    ],
    []
  );

  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>("xs");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueries = breakpoints.map(({ name, query }) => ({
      name,
      media: window.matchMedia(query),
    }));

    const updateBreakpoint = () => {
      for (const { name, media } of mediaQueries) {
        if (media.matches) {
          setCurrentBreakpoint(name);
          return;
        }
      }
    };

    // Set initial value
    updateBreakpoint();

    // Listen for changes
    const listeners = mediaQueries.map(({ media }) => {
      const listener = () => updateBreakpoint();
      media.addEventListener("change", listener);
      return { media, listener };
    });

    return () => {
      listeners.forEach(({ media, listener }) => {
        media.removeEventListener("change", listener);
      });
    };
  }, [breakpoints]);

  return currentBreakpoint;
}

/**
 * useDeviceType Hook
 * Returns a human-readable device type
 * 
 * Usage:
 * const device = useDeviceType();
 * // "mobile" | "tablet" | "laptop" | "desktop" | "ultrawide"
 */
export type DeviceType = "mobile" | "tablet" | "laptop" | "desktop" | "ultrawide";

export function useDeviceType(): DeviceType {
  const breakpoint = useBreakpoint();

  return useMemo(() => {
    switch (breakpoint) {
      case "xs":
      case "sm":
        return "mobile";
      case "md":
        return "tablet";
      case "lg":
        return "laptop";
      case "xl":
        return "desktop";
      case "2xl":
        return "ultrawide";
      default:
        return "mobile";
    }
  }, [breakpoint]);
}

/**
 * useIsMobile Hook
 * Convenience hook for mobile detection
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "xs" || breakpoint === "sm";
}

/**
 * useIsTablet Hook
 * Convenience hook for tablet detection
 */
export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "md";
}

/**
 * useIsDesktop Hook
 * Convenience hook for desktop detection
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl";
}

/**
 * useViewportSize Hook
 * Returns current viewport dimensions
 * 
 * Usage:
 * const { width, height } = useViewportSize();
 */
export function useViewportSize(): { width: number; height: number } {
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewportSize;
}

/**
 * useOrientation Hook
 * Returns current screen orientation
 * 
 * Usage:
 * const orientation = useOrientation();
 * // "portrait" | "landscape"
 */
export type Orientation = "portrait" | "landscape";

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>("landscape");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOrientation = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation("portrait");
      } else {
        setOrientation("landscape");
      }
    };

    updateOrientation();

    const media = window.matchMedia("(orientation: portrait)");
    const listener = () => updateOrientation();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return orientation;
}

/**
 * usePrefersReducedMotion Hook
 * Returns true if user prefers reduced motion
 * Note: Also available via Framer Motion's useReducedMotion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * useTouchDevice Hook
 * Returns true if device supports touch
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsTouch(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * useRetinaDisplay Hook
 * Returns true if device has high pixel density (Retina)
 */
export function useRetinaDisplay(): boolean {
  return useMediaQuery("(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)");
}
