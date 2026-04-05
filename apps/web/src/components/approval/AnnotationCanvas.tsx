"use client";

import { useCallback } from "react";
import type { FeedbackItem } from "@/hooks/useFeedback";

interface AnnotationCanvasProps {
  pins: FeedbackItem[];
  onPinClick: (pin: FeedbackItem) => void;
  onPlacePin: (xPercent: number, yPercent: number) => void;
  placingPin: boolean;
}

export function AnnotationCanvas({
  pins,
  onPinClick,
  onPlacePin,
  placingPin,
}: AnnotationCanvasProps) {
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

  return (
    <div
      className={`absolute inset-0 ${placingPin ? "cursor-crosshair" : ""}`}
      onClick={handleClick}
    >
      {pins.map((pin) => {
        const annotation = pin.annotationJson;
        if (!annotation) return null;

        return (
          <button
            key={pin.id}
            className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold shadow-md transition-all hover:scale-110 ${pin.resolvedAt
                ? "bg-gray-300 text-gray-600 opacity-50"
                : "bg-primary text-white"
              }`}
            style={{
              left: `${annotation.xPos}%`,
              top: `${annotation.yPos}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPinClick(pin);
            }}
            title={pin.body}
          >
            {annotation.pinNumber}
          </button>
        );
      })}
    </div>
  );
}
