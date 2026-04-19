"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { NameWorkspace } from "@/components/onboarding/steps/NameWorkspace";
import { ServiceTypeSelector } from "@/components/onboarding/steps/ServiceTypeSelector";
import { BriefLinkStep } from "@/components/onboarding/steps/BriefLinkStep";
import { DemoSandbox } from "@/components/onboarding/steps/DemoSandbox";
import type { TransitionDirection } from "@/animations/context/AnimationContext";

const STEP_KEYS = [
    "workspace_named",
    "service_type",
    "brief_link",
    "sandbox",
] as const;

const STEP_LABELS = [
    "Name Workspace",
    "Service Type",
    "Brief Link",
    "Try It Live",
];

const STEP_COMPONENTS = [NameWorkspace, ServiceTypeSelector, BriefLinkStep, DemoSandbox];

export default function OnboardingPage() {
    const completedSteps = useWorkspaceStore(
        (s) => s.onboardingProgress?.completedSteps ?? []
    );

    // Derive current step index from completed steps
    const currentStepIndex = STEP_KEYS.findIndex(
        (key) => !completedSteps.includes(key)
    );

    // Track direction for GSAP slide transitions
    const [direction, setDirection] = useState<TransitionDirection>("forward");
    const prevIndexRef = useRef(currentStepIndex);

    useEffect(() => {
        if (currentStepIndex === -1) return;
        const prev = prevIndexRef.current;
        setDirection(currentStepIndex > prev ? "forward" : "backward");
        prevIndexRef.current = currentStepIndex;
    }, [currentStepIndex]);

    // All steps done — the auth-provider / middleware will redirect to dashboard
    if (currentStepIndex === -1) {
        return (
            <div
                className="flex min-h-screen items-center justify-center text-sm"
                style={{ color: "rgb(var(--text-muted))" }}
            >
                <div className="flex items-center gap-2">
                    <span
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        aria-hidden="true"
                    />
                    Redirecting to your dashboard…
                </div>
            </div>
        );
    }

    const StepComponent = STEP_COMPONENTS[currentStepIndex]!;

    return (
        <OnboardingShell
            steps={STEP_LABELS}
            currentStep={currentStepIndex}
            direction={direction}
        >
            <StepComponent />
        </OnboardingShell>
    );
}
