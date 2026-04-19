"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { scrollToElement } from "@/hooks/useLenisScroll";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="btt"
          type="button"
          aria-label="Back to top"
          onClick={() => {
            const lenis = (window as unknown as { __lenis__?: { scrollTo: (v: number, o?: { duration?: number }) => void } }).__lenis__;
            if (lenis) lenis.scrollTo(0, { duration: 1.8 });
            else window.scrollTo({ top: 0, behavior: "smooth" });
            // avoid unused import
            void scrollToElement;
          }}
          className="fixed bottom-6 right-6 z-[110] flex h-11 w-11 items-center justify-center rounded-full bg-[var(--lv2-teal-700,#0F6E56)] text-white shadow-[0_8px_30px_-8px_rgba(15,110,86,0.8)] hover:bg-[var(--lv2-teal-500,#1D9E75)]"
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
        >
          <ChevronUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
