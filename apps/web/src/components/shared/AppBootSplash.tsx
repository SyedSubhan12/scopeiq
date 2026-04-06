"use client";

import { PageLoadingAnimation } from "@/components/shared/PageLoadingAnimation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const MIN_BOOT_MS = 420;

export function AppBootSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const startedAt = performance.now();
    let timeoutId: number | null = null;

    const hide = () => {
      const elapsed = performance.now() - startedAt;
      timeoutId = window.setTimeout(
        () => setVisible(false),
        Math.max(MIN_BOOT_MS - elapsed, 0),
      );
    };

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide, { once: true });
    }

    return () => {
      window.removeEventListener("load", hide);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="app-boot-splash"
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-[rgb(var(--surface-subtle))]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          aria-busy={true}
          aria-live="polite"
          aria-label="Loading application"
        >
          <PageLoadingAnimation compact />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
