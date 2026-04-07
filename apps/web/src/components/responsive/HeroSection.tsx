import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@novabots/ui";
import { Container } from "@/components/responsive/Container";

export interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  media?: ReactNode;
  badge?: {
    text: string;
    icon?: ReactNode;
  };
  className?: string;
  variant?: "center" | "left" | "split";
  size?: "sm" | "md" | "lg";
}

/**
 * Responsive Hero Section
 * Mobile-first hero that adapts layout based on screen size
 * 
 * Features:
 * - Mobile: stacked layout, centered text
 * - Tablet: optional side-by-side layout
 * - Desktop: full hero with media
 * - Fluid typography scaling
 * - Reduced motion support
 * 
 * Usage:
 * <HeroSection
 *   title="Build better products"
 *   subtitle="Subtitle here"
 *   description="Longer description"
 *   actions={<Button>Get Started</Button>}
 *   media={<Image src="..." />}
 * />
 */
export function HeroSection({
  title,
  subtitle,
  description,
  actions,
  media,
  badge,
  className,
  variant = "center",
  size = "lg",
}: HeroProps) {
  const reduceMotion = useReducedMotion();

  const getRevealProps = (delay = 0, duration = 0.4) =>
    reduceMotion
      ? {
          transition: { duration, delay },
        }
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration, delay },
        };

  const sizePadding = {
    sm: "py-12 sm:py-16 lg:py-20",
    md: "py-16 sm:py-20 lg:py-24",
    lg: "py-20 sm:py-24 lg:py-32",
  };

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        sizePadding[size],
        className
      )}
    >
      <Container size="xl">
        {/* Center Variant */}
        {variant === "center" && (
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            {badge && (
              <motion.div
                {...getRevealProps()}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border-subtle))] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--primary-dark))] backdrop-blur sm:text-sm"
              >
                {badge.icon}
                {badge.text}
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              {...getRevealProps(0.1)}
              className="mb-4 font-serif text-4xl leading-tight tracking-tight text-[rgb(var(--text-primary))] sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              {title}
            </motion.h1>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                {...getRevealProps(0.15)}
                className="mb-4 text-xl font-medium text-[rgb(var(--primary-dark))] sm:text-2xl"
              >
                {subtitle}
              </motion.p>
            )}

            {/* Description */}
            {description && (
              <motion.p
                {...getRevealProps(0.2)}
                className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-[rgb(var(--text-secondary))] sm:text-lg lg:text-xl"
              >
                {description}
              </motion.p>
            )}

            {/* Actions */}
            {actions && (
              <motion.div
                {...getRevealProps(0.3)}
                className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4"
              >
                {actions}
              </motion.div>
            )}

            {/* Media */}
            {media && (
              <motion.div
                {...getRevealProps(0.4, 0.5)}
                className="mt-12 lg:mt-16"
              >
                {media}
              </motion.div>
            )}
          </div>
        )}

        {/* Left-Aligned Variant */}
        {variant === "left" && (
          <div className="mx-auto max-w-3xl text-left">
            {badge && (
              <motion.div
                {...getRevealProps()}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border-subtle))] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--primary-dark))] backdrop-blur sm:text-sm"
              >
                {badge.icon}
                {badge.text}
              </motion.div>
            )}

            <motion.h1
              {...getRevealProps(0.1)}
              className="mb-4 font-serif text-4xl leading-tight tracking-tight text-[rgb(var(--text-primary))] sm:text-5xl lg:text-6xl"
            >
              {title}
            </motion.h1>

            {subtitle && (
              <motion.p
                {...getRevealProps(0.15)}
                className="mb-4 text-xl font-medium text-[rgb(var(--primary-dark))] sm:text-2xl"
              >
                {subtitle}
              </motion.p>
            )}

            {description && (
              <motion.p
                {...getRevealProps(0.2)}
                className="mb-8 max-w-xl text-base leading-relaxed text-[rgb(var(--text-secondary))] sm:text-lg"
              >
                {description}
              </motion.p>
            )}

            {actions && (
              <motion.div
                {...getRevealProps(0.3)}
                className="flex flex-col gap-3 sm:flex-row sm:gap-4"
              >
                {actions}
              </motion.div>
            )}

            {media && (
              <motion.div
                {...getRevealProps(0.4, 0.5)}
                className="mt-12"
              >
                {media}
              </motion.div>
            )}
          </div>
        )}

        {/* Split Variant */}
        {variant === "split" && (
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            {/* Content */}
            <div className="flex flex-col justify-center">
              {badge && (
                <motion.div
                  {...getRevealProps()}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border-subtle))] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--primary-dark))] backdrop-blur sm:text-sm"
                >
                  {badge.icon}
                  {badge.text}
                </motion.div>
              )}

              <motion.h1
                {...getRevealProps(0.1)}
                className="mb-4 font-serif text-4xl leading-tight tracking-tight text-[rgb(var(--text-primary))] sm:text-5xl lg:text-5xl xl:text-6xl"
              >
                {title}
              </motion.h1>

              {subtitle && (
                <motion.p
                  {...getRevealProps(0.15)}
                  className="mb-4 text-xl font-medium text-[rgb(var(--primary-dark))] sm:text-2xl"
                >
                  {subtitle}
                </motion.p>
              )}

              {description && (
                <motion.p
                  {...getRevealProps(0.2)}
                  className="mb-8 text-base leading-relaxed text-[rgb(var(--text-secondary))] sm:text-lg"
                >
                  {description}
                </motion.p>
              )}

              {actions && (
                <motion.div
                  {...getRevealProps(0.3)}
                  className="flex flex-col gap-3 sm:flex-row sm:gap-4"
                >
                  {actions}
                </motion.div>
              )}
            </div>

            {/* Media */}
            <motion.div
              {...getRevealProps(0.3, 0.5)}
              className="flex items-center justify-center"
            >
              {media}
            </motion.div>
          </div>
        )}
      </Container>
    </section>
  );
}

/**
 * Hero CTA Button Component
 * Pre-styled button for hero actions
 */
export function HeroButton({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}) {
  const variantClasses = {
    primary:
      "bg-[rgb(var(--primary-dark))] text-white hover:bg-[rgb(var(--primary))] shadow-lg hover:shadow-xl",
    secondary:
      "bg-white text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-subtle))] border border-[rgb(var(--border-subtle))]",
    outline:
      "bg-transparent text-[rgb(var(--text-primary))] hover:bg-white/10 border-2 border-[rgb(var(--text-primary))]",
  };

  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 sm:px-8 sm:py-4 sm:text-base",
        "hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))] focus-visible:ring-offset-2",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </a>
  );
}
