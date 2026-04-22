"use client";

import {
    useRef,
    useState,
    useLayoutEffect,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import { gsap } from "@/animations/utils/gsap.config";
import { useStepTransition } from "@/animations/hooks/useStepTransition";
import { useReducedMotion } from "@/animations/context/ReducedMotionProvider";
import { PhaseProgress } from "./PhaseProgress";
import { buildPersonaTimeline } from "@/animations/timelines/persona.timeline";
import { buildWorkspaceTimeline } from "@/animations/timelines/workspace.timeline";
import { buildSandboxTimeline } from "@/animations/timelines/sandbox.timeline";
import { buildInviteTimeline } from "@/animations/timelines/invite.timeline";
import { buildCompletionTimeline } from "@/animations/timelines/completion.timeline";
import type { TransitionDirection } from "@/animations/context/AnimationContext";

const ENTRANCE_TIMELINES = [
    buildPersonaTimeline,    // step 0 — Welcome + Persona
    buildWorkspaceTimeline,  // step 1 — Workspace Setup
    buildSandboxTimeline,    // step 2 — Pain Point Router
    buildSandboxTimeline,    // step 3 — Path Setup (4A/4B/4C)
    buildInviteTimeline,     // step 4 — Invite Team
    buildCompletionTimeline, // step 5 — Setup Complete
] as const;

interface OnboardingShellProps {
    /** Ordered step labels for the progress indicator */
    steps: string[];
    /** 0-based index of the step currently visible */
    currentStep: number;
    /** The step content to render */
    children: ReactNode;
    /** Direction driven by the parent page (changes when currentStep changes) */
    direction: TransitionDirection;
}

/**
 * Full-screen onboarding wizard shell.
 *
 * Architecture:
 * - Double-buffer slot pattern: two absolute-positioned containers share one
 *   relative parent. During a transition the entering step sits on top while
 *   the exiting step slides out, then both are swapped.
 * - useStepTransition drives the GSAP timeline.
 * - Each step's entrance content animation fires from the step-specific timeline
 *   builder after the slide settles.
 */
export function OnboardingShell({
    steps,
    currentStep,
    children,
    direction,
}: OnboardingShellProps) {
    const reducedMotion = useReducedMotion();

    // -- Double-buffer slot state --
    const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
    const [slotA, setSlotA] = useState<ReactNode>(currentStep === 0 ? children : null);
    const [slotB, setSlotB] = useState<ReactNode>(currentStep > 0 ? children : null);

    const slotARef = useRef<HTMLDivElement>(null);
    const slotBRef = useRef<HTMLDivElement>(null);
    const prevStepRef = useRef<number>(currentStep);

    const { runTransition, killTransition } = useStepTransition();

    // Initialization
    useLayoutEffect(() => {
        if (activeSlot === "A") {
            gsap.set(slotARef.current, { x: 0, opacity: 1, pointerEvents: "auto" });
            gsap.set(slotBRef.current, { x: "100%", opacity: 0, pointerEvents: "none" });
        } else {
            gsap.set(slotBRef.current, { x: 0, opacity: 1, pointerEvents: "auto" });
            gsap.set(slotARef.current, { x: "-100%", opacity: 0, pointerEvents: "none" });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Step change effect
    useEffect(() => {
        if (prevStepRef.current === currentStep) return;

        const nextSlot = activeSlot === "A" ? "B" : "A";
        const enterRef = nextSlot === "A" ? slotARef : slotBRef;
        const exitRef = nextSlot === "A" ? slotBRef : slotARef;

        // 1. Stage the new content into the incoming slot
        if (nextSlot === "A") setSlotA(children);
        else setSlotB(children);

        // 2. Animate
        const raf = requestAnimationFrame(() => {
            runTransition(direction, { enterRef, exitRef }, () => {
                // onComplete: Settled
                const timelineFn = ENTRANCE_TIMELINES[currentStep];
                if (timelineFn && enterRef.current) {
                    timelineFn(enterRef.current, reducedMotion);
                }

                // Clear the exit slot's contents to prevent background renders
                if (nextSlot === "A") setSlotB(null);
                else setSlotA(null);
            });

            // Update semantic state immediately so next render knows which is active
            setActiveSlot(nextSlot);
            prevStepRef.current = currentStep;
        });

        return () => {
            cancelAnimationFrame(raf);
            killTransition();
        };
    }, [currentStep, direction, children, runTransition]);

    // -- Progress bar width (CSS) --
    const progressPct = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="ob-wizard-shell flex flex-col" style={{ minHeight: "100svh" }}>

            {/* ── Header ───────────────────────────────────── */}
            <header className="ob-header flex items-center justify-between px-6 py-5 md:px-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Logo mark */}
                <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo.svg"
                        alt="ScopeIQ"
                        className="ob-logo-mark h-8 w-auto"
                    />
                    <span
                        className="text-lg font-bold"
                        style={{ color: "#0F6E56", fontFamily: "var(--font-sans)" }}
                    >
                        ScopeIQ
                    </span>
                </div>

                {/* Phase dot progress */}
                <PhaseProgress total={steps.length} current={currentStep} />

                {/* Step counter */}
                <span
                    className="text-xs font-medium"
                    style={{ color: "rgba(244,241,236,0.3)", fontFamily: "var(--font-mono)" }}
                >
                    {currentStep + 1} / {steps.length}
                </span>
            </header>

            {/* ── Continuous progress bar ───────────────────── */}
            <div
                className="ob-progress-track h-px w-full"
                style={{ background: "rgba(15,110,86,0.1)" }}
            >
                <div
                    className="ob-progress-fill h-full"
                    style={{
                        width: `${progressPct}%`,
                        background: "linear-gradient(90deg, #0F6E56, #1DB98A)",
                        transition: reducedMotion
                            ? "width 0.1s linear"
                            : "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                        willChange: "width",
                        boxShadow: "0 0 8px rgba(15,110,86,0.6)",
                    }}
                />
            </div>

            {/* ── Double-buffer content area ─────────────────── */}
            <main
                className="ob-stage relative flex-1 overflow-hidden"
                style={{ willChange: "transform" }}
            >
                {/* Slot A */}
                <div
                    ref={slotARef}
                    className="ob-slot absolute inset-0 flex items-center justify-center p-4 md:p-8"
                    style={{ willChange: "transform, opacity" }}
                >
                    <div className="w-full max-w-2xl">{slotA}</div>
                </div>

                {/* Slot B */}
                <div
                    ref={slotBRef}
                    className="ob-slot absolute inset-0 flex items-center justify-center p-4 md:p-8"
                    style={{ willChange: "transform, opacity" }}
                >
                    <div className="w-full max-w-2xl">{slotB}</div>
                </div>
            </main>

            {/* ── Footer ───────────────────────────────────── */}
            <footer
                className="flex items-center justify-center gap-1.5 px-6 py-4 text-xs"
                style={{ color: "rgba(244,241,236,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
                <span>Secured by</span>
                <span className="font-semibold" style={{ color: "#0F6E56" }}>
                    ScopeIQ
                </span>
                <span>·</span>
                <span>Your data is encrypted</span>
            </footer>
        </div>
    );
}
