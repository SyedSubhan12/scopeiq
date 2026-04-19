"use client";

/**
 * PageEnter — lightweight Framer Motion wrapper applied to each dashboard page.
 *
 * Wraps page content in a subtle fade-up on route change.
 * Mount in the page `<main>` child (not the layout) so only page content
 * transitions, not the sidebar/topbar.
 */

import { motion } from "framer-motion";

interface PageEnterProps {
  children: React.ReactNode;
  className?: string;
}

const variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

export function PageEnter({ children, className }: PageEnterProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}
