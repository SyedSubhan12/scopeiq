"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProvider, useOnboardingContext } from "@/components/onboarding/OnboardingContext";
import { PersonaStep } from "@/components/onboarding/steps/PersonaStep";
import { WorkspaceSetup } from "@/components/onboarding/steps/WorkspaceSetup";
import { PainPointRouter } from "@/components/onboarding/steps/PainPointRouter";
import { ScopeGuardSetup } from "@/components/onboarding/steps/ScopeGuardSetup";
import { ApprovalPortalSetup } from "@/components/onboarding/steps/ApprovalPortalSetup";
import { BriefBuilderSetup } from "@/components/onboarding/steps/BriefBuilderSetup";
import { InviteTeam } from "@/components/onboarding/steps/InviteTeam";
import { SetupComplete } from "@/components/onboarding/steps/SetupComplete";
import type { TransitionDirection } from "@/animations/context/AnimationContext";

const STEP_KEYS = [
    "persona_selected",
    "workspace_configured",
    "pain_point_selected",
    "path_setup_complete",
    "team_invited",
    "setup_complete",
] as const;

const STEP_LABELS = [
    "Who You Are",
    "Your Workspace",
    "Your Challenge",
    "First Value",
    "Your Team",
    "You're Ready",
];

function PathSetupStep() {
    const { painPoint } = useOnboardingContext();
    if (painPoint === "approval_portal") return <ApprovalPortalSetup />;
    if (painPoint === "brief_builder") return <BriefBuilderSetup />;
    return <ScopeGuardSetup />;
}

const STEP_COMPONENTS = [
    PersonaStep,
    WorkspaceSetup,
    PainPointRouter,
    PathSetupStep,
    InviteTeam,
    SetupComplete,
];

function OnboardingPageInner() {
    const completedSteps = useWorkspaceStore(
        (s) => s.onboardingProgress?.completedSteps ?? []
    );

    const currentStepIndex = STEP_KEYS.findIndex(
        (key) => !completedSteps.includes(key)
    );

    const [direction, setDirection] = useState<TransitionDirection>("forward");
    const prevIndexRef = useRef(currentStepIndex);

    useEffect(() => {
        if (currentStepIndex === -1) return;
        const prev = prevIndexRef.current;
        setDirection(currentStepIndex > prev ? "forward" : "backward");
        prevIndexRef.current = currentStepIndex;
    }, [currentStepIndex]);

    if (currentStepIndex === -1) {
        return (
            <div
                className="flex min-h-screen items-center justify-center text-sm"
                style={{ color: "rgba(244,241,236,0.4)" }}
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

export default function OnboardingPage() {
    return (
        <OnboardingProvider>
            <OnboardingPageInner />
        </OnboardingProvider>
    );
}
