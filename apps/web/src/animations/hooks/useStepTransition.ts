"use client";

import { useRef, useCallback } from "react";
import { gsap } from "@/animations/utils/gsap.config";
import { useReducedMotion } from "@/animations/context/ReducedMotionProvider";
import type { TransitionDirection } from "@/animations/context/AnimationContext";

interface SlotRefs {
    enterRef: React.RefObject<HTMLDivElement | null>;
    exitRef: React.RefObject<HTMLDivElement | null>;
}

export function useStepTransition() {
    const reducedMotion = useReducedMotion();
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    const runTransition = useCallback(
        (
            direction: TransitionDirection,
            slots: { enterRef: React.RefObject<HTMLElement | null>; exitRef: React.RefObject<HTMLElement | null> },
            onComplete?: () => void
        ) => {
            const { enterRef, exitRef } = slots;
            if (!enterRef.current || !exitRef.current) return;

            // Kill any in-flight transition to handle rapid clicking
            tlRef.current?.kill();

            if (reducedMotion) {
                // Accessible instant swap — no transform, just opacity
                gsap.set(enterRef.current, { opacity: 1, x: 0, pointerEvents: "auto" });
                gsap.set(exitRef.current, { opacity: 0, x: 0, pointerEvents: "none" });
                onComplete?.();
                return;
            }

            const isForward = direction === "forward";
            const enterX = isForward ? "100%" : "-100%";
            const exitX = isForward ? "-60%" : "60%";

            // Initialise entering step off-screen and blocking
            gsap.set(enterRef.current, { x: enterX, opacity: 0, pointerEvents: "auto" });
            gsap.set(exitRef.current, { pointerEvents: "none" });

            const tl = gsap.timeline({
                onComplete: () => {
                    onComplete?.();
                    // Reset exit slot so it is clean for next use
                    gsap.set(exitRef.current, { clearProps: "x,opacity" });
                },
            });

            tl
                // Both enter and exit animate simultaneously
                .to(
                    enterRef.current,
                    {
                        x: "0%",
                        opacity: 1,
                        duration: 0.42,
                        ease: "power3.out",
                    },
                    0
                )
                .to(
                    exitRef.current,
                    {
                        x: exitX,
                        opacity: 0,
                        duration: 0.38,
                        ease: "power3.in",
                    },
                    0
                );

            tlRef.current = tl;
        },
        [reducedMotion]
    );


    // Expose kill for cleanup
    const killTransition = useCallback(() => {
        tlRef.current?.kill();
    }, []);

    return { runTransition, killTransition };
}
