import { cn } from "@novabots/ui";
import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  variant?: "default" | "elevated" | "outlined" | "ghost";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  onClick?: () => void;
  href?: string;
}

const variantClasses = {
  default: "bg-white border border-[rgb(var(--border-subtle))] shadow-sm",
  elevated:
    "bg-white border border-transparent shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]",
  outlined:
    "bg-transparent border-2 border-[rgb(var(--border-default))] shadow-none",
  ghost: "bg-transparent border border-transparent shadow-none",
};

const paddingClasses = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5 lg:p-6",
  lg: "p-5 sm:p-6 lg:p-8",
  xl: "p-6 sm:p-8 lg:p-10",
};

/**
 * Responsive Card Component
 * Adapts padding and spacing across breakpoints
 * 
 * Usage:
 * <Card variant="elevated" padding="lg">
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 * </Card>
 */
export function Card({
  children,
  className,
  as: Component = "div",
  variant = "default",
  padding = "md",
  interactive = false,
  onClick,
  href,
}: CardProps) {
  const ComponentType = href ? "a" : Component;

  return (
    <ComponentType
      href={href}
      onClick={onClick}
      className={cn(
        // Base: rounded corners, transition
        "rounded-2xl transition-all duration-200",
        // Variant styling
        variantClasses[variant],
        // Responsive padding
        paddingClasses[padding],
        // Interactive states
        interactive &&
          "cursor-pointer hover:shadow-[0_8px_32px_-12px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        // Focus states for accessibility
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))] focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </ComponentType>
  );
}

/**
 * Card Header Component
 * Typically contains title, subtitle, and optional actions
 */
export function CardHeader({
  children,
  className,
  actions,
}: {
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
        "mb-4 sm:mb-6",
        className
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * Card Body Component
 * Main content area
 */
export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  );
}

/**
 * Card Footer Component
 * Typically contains actions, metadata, or summary
 */
export function CardFooter({
  children,
  className,
  border = true,
}: {
  children: ReactNode;
  className?: string;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        "mt-4 sm:mt-6 pt-4 sm:pt-6",
        border && "border-t border-[rgb(var(--border-subtle))]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Horizontal Card Variant
 * Stacks vertically on mobile, horizontally on larger screens
 * 
 * Usage:
 * <CardHorizontal
 *   image={<Image src="..." />}
 *   content={<div>Text content</div>}
 * />
 */
export function CardHorizontal({
  image,
  content,
  className,
  imageFirst = true,
}: {
  image: ReactNode;
  content: ReactNode;
  className?: string;
  imageFirst?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        "sm:flex-row sm:items-stretch sm:gap-6",
        !imageFirst && "sm:flex-row-reverse",
        className
      )}
    >
      {/* Image: full width on mobile, constrained on desktop */}
      <div className="shrink-0 sm:w-1/3 md:w-2/5 [&>img]:w-full [&>img]:h-full [&>img]:object-cover">
        {image}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">{content}</div>
    </div>
  );
}

/**
 * Responsive Card Grid Preview
 * Shows a grid of cards that adapts to screen size
 * 
 * Usage:
 * <CardGridPreview cards={data} />
 */
export function CardGridPreview<T>({
  cards,
  renderCard,
  gap = "lg",
  minCardWidth = "280px",
  className,
}: {
  cards: T[];
  renderCard: (item: T, index: number) => ReactNode;
  gap?: "sm" | "md" | "lg" | "xl";
  minCardWidth?: string;
  className?: string;
}) {
  const gapClasses = {
    sm: "gap-3 sm:gap-4",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
    xl: "gap-8 sm:gap-10",
  };

  return (
    <div
      className={cn(
        "grid w-full",
        "grid-cols-1",
        "sm:grid-cols-2",
        "lg:grid-cols-3",
        "xl:grid-cols-4",
        gapClasses[gap],
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minCardWidth}), 1fr))`,
      }}
    >
      {cards.map((card, index) => renderCard(card, index))}
    </div>
  );
}
