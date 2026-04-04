"use client";

import { useWorkspaceStore } from "@/stores/workspace.store";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { NameWorkspace } from "@/components/onboarding/steps/NameWorkspace";
import { AddFirstClient } from "@/components/onboarding/steps/AddFirstClient";
import { CreateFirstProject } from "@/components/onboarding/steps/CreateFirstProject";
import { CreateBriefTemplate } from "@/components/onboarding/steps/CreateBriefTemplate";
import { PortalTour } from "@/components/onboarding/steps/PortalTour";

const STEP_KEYS = [
    "workspace_named",
    "first_client",
    "first_project",
    "brief_template",
    "portal_tour",
] as const;

const STEP_LABELS = [
    "Name Workspace",
    "Add Client",
    "First Project",
    "Brief Template",
    "Portal Tour",
];

const STEP_COMPONENTS = [
    NameWorkspace,
    AddFirstClient,
    CreateFirstProject,
    CreateBriefTemplate,
    PortalTour,
];

export default function OnboardingPage() {
    const completedSteps = useWorkspaceStore(
        (s) => s.onboardingProgress?.completedSteps ?? [],
    );

    // Find the first step that hasn't been completed yet
    const currentStepIndex = STEP_KEYS.findIndex(
        (key) => !completedSteps.includes(key),
    );

    // All steps done — auth-provider will redirect to dashboard
    if (currentStepIndex === -1) {
        return (
            <div className="py-12 text-center text-sm text-[rgb(var(--text-muted))]">
                Redirecting to dashboard…
            </div>
        );
    }

    const StepComponent = STEP_COMPONENTS[currentStepIndex]!;

    return (
        <OnboardingShell
            steps={STEP_LABELS}
            currentStep={currentStepIndex}
            completedSteps={completedSteps}
            stepKeys={[...STEP_KEYS]}
        >
            <StepComponent />
        </OnboardingShell>
    );
}
