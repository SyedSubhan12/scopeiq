"use client";

/**
 * BlurReveal — 21st.dev inspired character blur reveal
 * Each character starts blurred + transparent, sharpens on scroll entry.
 * Uses IntersectionObserver so it only fires once when visible.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@novabots/ui";

interface BlurRevealProps {
  text: string;
  className?: string;
  delay?: number;        // base delay in seconds
  stagger?: number;      // per-character stagger in seconds
  threshold?: number;    // IntersectionObserver threshold
  once?: boolean;
}

export function BlurReveal({
  text,
  className,
  delay = 0,
  stagger = 0.05,
  threshold = 0.3,
  once = true,
}: BlurRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("inline", className)} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap">
          <motion.span
            aria-hidden
            className="inline-block will-change-[opacity,filter,transform]"
            initial={{ opacity: 0, filter: "blur(8px)", y: 4 }}
            animate={
              visible
                ? { opacity: 1, filter: "blur(0px)", y: 0 }
                : { opacity: 0, filter: "blur(8px)", y: 4 }
            }
            transition={{
              duration: 0.5,
              delay: delay + i * stagger,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
