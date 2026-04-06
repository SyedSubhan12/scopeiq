import { cn } from "@novabots/ui";
import { ReactNode } from "react";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "fluid";

export interface ContainerProps {
  children: ReactNode;
  size?: ContainerSize;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  center?: boolean;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-2xl",      // 42rem - narrow content
  md: "max-w-4xl",      // 56rem - medium content
  lg: "max-w-5xl",      // 64rem - wide content
  xl: "max-w-7xl",      // 80rem - very wide content
  "2xl": "max-w-[1400px]", // ultra-wide displays
  full: "max-w-full",   // full width with padding
  fluid: "max-w-none",  // truly full width (use sparingly)
};

/**
 * Responsive Container Component
 * Mobile-first container with configurable max-width
 * 
 * Usage:
 * <Container size="xl">Content</Container>
 * <Container size="md" as="section">Narrow content</Container>
 */
export function Container({
  children,
  size = "xl",
  className,
  as: Component = "div",
  center = true,
}: ContainerProps) {
  return (
    <Component
      className={cn(
        // Base: full width with horizontal padding
        "w-full px-4 sm:px-6 lg:px-8",
        // Center content by default
        center && "mx-auto",
        // Apply max-width constraint
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Responsive Section Component
 * Container with built-in vertical padding that scales by breakpoint
 * 
 * Usage:
 * <Section>Hero content</Section>
 * <Section size="md" tight>Tighter section</Section>
 */
export function Section({
  children,
  size = "xl",
  className,
  as: Component = "section",
  center = true,
  tight = false,
}: ContainerProps & { tight?: boolean }) {
  return (
    <Component
      className={cn(
        // Base: full width with horizontal padding
        "w-full",
        // Mobile: tighter padding
        tight ? "py-8 px-4" : "py-12 px-4",
        // Tablet: more breathing room
        tight ? "sm:py-10 sm:px-6" : "sm:py-16 sm:px-6",
        // Desktop: maximum spacing
        tight ? "lg:py-12 lg:px-8" : "lg:py-20 lg:px-8",
        // Center content by default
        center && "mx-auto",
        // Apply max-width constraint
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Component>
  );
}
