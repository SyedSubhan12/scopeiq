"use client";

/**
 * WordPullUp — 21st.dev inspired word reveal
 * Each word clips up from below its container.
 * The mask ensures words are invisible before they enter — no flash.
 */

import { motion, type Variants } from "framer-motion";
import { cn } from "@novabots/ui";

interface WordPullUpProps {
  text: string;
  className?: string;
  delayOffset?: number;   // seconds before first word starts
  stagger?: number;       // seconds between each word
  duration?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

const wordVariants: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      delay: i,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function WordPullUp({
  text,
  className,
  delayOffset = 0,
  stagger = 0.1,
  as: Tag = "p",
}: WordPullUpProps) {
  const words = text.split(" ");

  return (
    <Tag className={cn("flex flex-wrap", className)}>
      {words.map((word, i) => (
        <span key={i} className="overflow-hidden" style={{ display: "inline-block", marginRight: "0.25em" }}>
          <motion.span
            style={{ display: "inline-block" }}
            variants={wordVariants}
            initial="hidden"
            animate="visible"
            custom={delayOffset + i * stagger}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
