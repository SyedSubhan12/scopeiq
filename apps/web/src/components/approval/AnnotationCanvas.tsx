"use client";

import { useCallback, useRef, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import type { FeedbackItem } from "@/hooks/useFeedback";

interface AnnotationCanvasProps {
  pins: FeedbackItem[];
  onPinClick: (pin: FeedbackItem) => void;
  onPlacePin: (xPercent: number, yPercent: number) => void;
  placingPin: boolean;
  /** Controlled active pin id — lifted from parent for bidirectional sync */
  activePinId?: string | null;
  onActivePinChange?: (id: string | null) => void;
}

/** Returns true when the user has opted into reduced motion */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AnnotationCanvas({
  pins,
  onPinClick,
  onPlacePin,
  placingPin,
  activePinId,
  onActivePinChange,
}: AnnotationCanvasProps) {
  // Track refs by pin id so GSAP can target the DOM node on mount
  const pinRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!placingPin) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onPlacePin(
        Math.round(x * 100) / 100,
        Math.round(y * 100) / 100,
      );
    },
    [placingPin, onPlacePin],
  );

  // Callback ref: fires when a button mounts for the first time → run GSAP entrance
  const attachPinRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      if (!el) {
        pinRefs.current.delete(id);
        return;
      }
      const isNew = !pinRefs.current.has(id);
      pinRefs.current.set(id, el);

      if (isNew && !prefersReducedMotion()) {
        void import("gsap/dist/gsap").then((mod) => {
          const gsap = mod.default ?? mod;
          gsap.from(el, {
            scale: 0,
            opacity: 0,
            duration: 0.35,
            ease: "back.out(1.7)",
          });
        });
      }
    },
    [],
  );

  return (
    <div
      className={`absolute inset-0 ${placingPin ? "cursor-crosshair" : ""}`}
      onClick={handleClick}
    >
      <LayoutGroup>
        {pins.map((pin, index) => {
          const annotation = pin.annotationJson;
          if (!annotation) return null;

          const isActive = activePinId === pin.id;
          const isResolved = !!pin.resolvedAt;

          return (
            <motion.button
              key={pin.id}
              layout
              ref={attachPinRef(pin.id)}
              // Scale up on hover (Framer Motion whileHover)
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full text-xs font-bold shadow-lg transition-[outline] ${
                isResolved
                  ? "bg-gray-300 text-gray-600 opacity-50"
                  : "bg-[#1D9E75] text-white"
              } flex items-center justify-center ${
                isActive ? "outline outline-2 outline-offset-2 outline-white" : ""
              }`}
              style={{
                left: `${annotation.xPos}%`,
                top: `${annotation.yPos}%`,
              }}
              onMouseEnter={() => onActivePinChange?.(pin.id)}
              onMouseLeave={() => onActivePinChange?.(null)}
              onClick={(e) => {
                e.stopPropagation();
                onPinClick(pin);
              }}
              title={pin.body}
              aria-label={`Feedback pin ${index + 1}: ${pin.body}`}
            >
              {annotation.pinNumber}
            </motion.button>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
