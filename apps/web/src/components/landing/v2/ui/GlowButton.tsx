"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "ghost";

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps & { href: string; onClick?: () => void };

type Props = ButtonProps | LinkProps;

export const GlowButton = forwardRef<HTMLButtonElement, Props>(function GlowButton(
  { variant = "primary", className = "", children, ...rest },
  ref
) {
  const base = variant === "primary" ? "lv2-btn-primary" : "lv2-btn-ghost";
  const cls = `${base} ${className}`.trim();

  const animationProps = {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: { scale: 0.98, y: 0 },
    transition: { type: "spring", stiffness: 400, damping: 17 },
  };

  if ("href" in rest && rest.href) {
    const { href, onClick } = rest;
    const linkProps = onClick ? { href, onClick } : { href };
    return (
      <motion.div {...animationProps} className="inline-flex">
        <Link {...linkProps} className={cls}>
          {children}
        </Link>
      </motion.div>
    );
  }

  const { style: buttonStyle, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <motion.button
      ref={ref}
      {...animationProps}
      className={cls}
      // Cast away the exactOptionalPropertyTypes conflict between ButtonHTMLAttributes
      // and HTMLMotionProps — framer-motion handles the overlap fine at runtime.
      {...(buttonRest as unknown as import("framer-motion").HTMLMotionProps<"button">)}
      style={buttonStyle as import("framer-motion").MotionStyle}
    >
      {children}
    </motion.button>
  );
});

