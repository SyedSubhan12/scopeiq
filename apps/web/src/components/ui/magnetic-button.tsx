"use client";

/**
 * MagneticButton — 21st.dev inspired cursor-following magnetic effect.
 * On hover the button nudges toward the cursor, creating a tactile pull.
 * On mouse-leave it springs back to rest.
 */

import { type CSSProperties, useRef } from "react";
import { motion, type MotionStyle, useSpring } from "framer-motion";
import { cn } from "@novabots/ui";

type MagneticButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof motion.button>,
  "children" | "style"
> & {
  children: React.ReactNode;
  strength?: number;   // 0–1, how strongly it follows the cursor (default 0.35)
  className?: string;
  asChild?: boolean;
  style?: CSSProperties;
};

export function MagneticButton({
  children,
  strength = 0.35,
  className,
  style,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const springConfig = { stiffness: 200, damping: 18, mass: 0.6 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const magneticStyle = {
    ...(style ?? {}),
    x,
    y,
  } as MotionStyle;

  return (
    <motion.button
      ref={ref}
      style={magneticStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.96 }}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Link variant — same magnetic effect for anchor elements */
export function MagneticLink({
  children,
  strength = 0.3,
  className,
  href,
  style,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof motion.a>, "children" | "style"> & {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  href: string;
  target?: string;
  rel?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const springConfig = { stiffness: 200, damping: 18, mass: 0.6 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const magneticStyle = {
    ...(style ?? {}),
    x,
    y,
  } as MotionStyle;

  return (
    <motion.a
      ref={ref}
      href={href}
      style={magneticStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {children}
    </motion.a>
  );
}
