"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BriefCoachHint as BriefCoachHintType } from "@/hooks/useAIBriefCoach";

interface BriefCoachHintProps {
  hint: BriefCoachHintType | null;
  loading?: boolean;
}

const TONE_STYLES = {
  tip: {
    bg: "bg-[#0D1B2A]/5 border-[#1D9E75]/20",
    dot: "bg-[#1D9E75]",
    text: "text-[#1D9E75]",
    label: "Coach tip",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
    label: "Worth clarifying",
  },
  praise: {
    bg: "bg-[#1D9E75]/5 border-[#1D9E75]/25",
    dot: "bg-[#1D9E75]",
    text: "text-[#1D9E75]",
    label: "Looks good",
  },
} as const;

function WordReveal({ text }: { text: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const prevTextRef = useRef<string>("");

  useEffect(() => {
    if (prevTextRef.current === text) return;
    prevTextRef.current = text;

    const container = containerRef.current;
    if (!container) return;

    const words = container.querySelectorAll<HTMLSpanElement>("[data-word]");
    if (words.length === 0) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    import("animejs").then(({ default: anime }) => {
      anime({
        targets: words,
        opacity: [0, 1],
        translateY: [4, 0],
        duration: 220,
        delay: anime.stagger(25),
        easing: "easeOutQuad",
      });
    });
  }, [text]);

  return (
    <span ref={containerRef} className="leading-5">
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          data-word
          style={{ opacity: 0, display: "inline-block", marginRight: "0.25em" }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

export function BriefCoachHint({ hint, loading }: BriefCoachHintProps) {
  if (loading) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 px-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[rgb(var(--text-muted))]" />
        <span className="text-xs text-[rgb(var(--text-muted))]">Analyzing…</span>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {hint ? (
        <motion.div
          key={hint.hint}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div
            className={`mt-1.5 flex items-start gap-2 rounded-xl border px-3 py-2 ${TONE_STYLES[hint.tone].bg}`}
          >
            <span
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_STYLES[hint.tone].dot}`}
            />
            <div className="min-w-0">
              <span
                className={`mr-1 text-xs font-semibold ${TONE_STYLES[hint.tone].text}`}
              >
                {TONE_STYLES[hint.tone].label}:
              </span>
              <span className="text-xs text-[rgb(var(--text-secondary))]">
                <WordReveal text={hint.hint} />
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
