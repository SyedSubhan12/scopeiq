"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/animations/utils/gsap.config";
import { useReducedMotion } from "@/animations/context/ReducedMotionProvider";

interface PhaseProgressProps {
    total: number;
    current: number;
}

export function PhaseProgress({ total, current }: PhaseProgressProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();

    // Morph dots: active dot stretches from 8px circle → 24px pill via GSAP
    useEffect(() => {
        if (!containerRef.current) return;
        const dots = containerRef.current.querySelectorAll<HTMLDivElement>(".ob-phase-dot");

        dots.forEach((dot, i) => {
            if (reducedMotion) {
                // Skip morphing — just switch colour
                dot.style.width = i === current ? "24px" : "8px";
                dot.style.borderRadius = i === current ? "4px" : "50%";
                return;
            }

            if (i === current) {
                gsap.to(dot, {
                    width: 24,
                    borderRadius: 4,
                    duration: 0.3,
                    ease: "power2.out",
                });
            } else {
                gsap.to(dot, {
                    width: 8,
                    borderRadius: "50%",
                    duration: 0.3,
                    ease: "power2.out",
                });
            }
        });
    }, [current, reducedMotion]);

    return (
        <div ref={containerRef} className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: total }).map((_, i) => {
                const isCompleted = i < current;
                const isCurrent = i === current;

                return (
                    <div
                        key={i}
                        className="ob-phase-dot transition-colors duration-300"
                        style={{
                            height: 8,
                            width: isCurrent ? 24 : 8,
                            borderRadius: isCurrent ? 4 : "50%",
                            background: isCompleted
                                ? "#1D9E75"
                                : isCurrent
                                    ? "#0F6E56"
                                    : "rgba(15,110,86,0.15)",
                            willChange: "width, border-radius",
                            flexShrink: 0,
                        }}
                    />
                );
            })}
        </div>
    );
}
