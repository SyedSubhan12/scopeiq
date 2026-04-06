import { cn } from "@novabots/ui";
import { ReactNode } from "react";

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6;
export type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface GridProps {
  children: ReactNode;
  cols?: GridCols;
  colsSm?: GridCols;
  colsMd?: GridCols;
  colsLg?: GridCols;
  colsXl?: GridCols;
  gap?: GapSize;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const gapClasses: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
};

const colClasses: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

/**
 * Responsive Grid Component
 * Mobile-first grid that scales up through breakpoints
 * 
 * Usage:
 * <Grid cols={1} colsSm={2} colsLg={3} gap="lg">
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </Grid>
 * 
 * Shorthand: specify just cols for uniform grid
 * <Grid cols={3} gap="md">Cards</Grid>
 */
export function Grid({
  children,
  cols = 1,
  colsSm,
  colsMd,
  colsLg,
  colsXl,
  gap = "md",
  className,
  as: Component = "div",
}: GridProps) {
  return (
    <Component
      className={cn(
        "grid w-full",
        // Base gap
        gapClasses[gap],
        // Mobile (default): always start with base cols
        colClasses[cols],
        // Tablet portrait
        colsSm && `sm:${colClasses[colsSm]}`,
        // Tablet landscape / small desktop
        colsMd && `md:${colClasses[colsMd]}`,
        // Desktop
        colsLg && `lg:${colClasses[colsLg]}`,
        // Large desktop
        colsXl && `xl:${colClasses[colsXl]}`,
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * Auto-fill Grid Component
 * Creates as many columns as fit based on minimum item width
 * Great for card grids where you want items to flow naturally
 * 
 * Usage:
 * <GridAutoFill min="280px" gap="lg">
 *   {cards.map(card => <Card key={card.id} {...card} />)}
 * </GridAutoFill>
 */
export function GridAutoFill({
  children,
  min = "280px",
  gap = "md",
  className,
}: {
  children: ReactNode;
  min?: string;
  gap?: GapSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full",
        gapClasses[gap],
        "grid-cols-1",
        "sm:grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))]",
        "lg:grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]",
        className
      )}
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}), 1fr))` }}
    >
      {children}
    </div>
  );
}

/**
 * Auto-fit Grid Component
 * Similar to auto-fill but collapses empty tracks
 * Best when you know approximately how many items you have
 * 
 * Usage:
 * <GridAutoFit min="300px" gap="lg">{items}</GridAutoFit>
 */
export function GridAutoFit({
  children,
  min = "300px",
  gap = "md",
  className,
}: {
  children: ReactNode;
  min?: string;
  gap?: GapSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full",
        gapClasses[gap],
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))`,
      }}
    >
      {children}
    </div>
  );
}
