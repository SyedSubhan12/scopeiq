"use client";

import { cn } from "@novabots/ui";
import { Check } from "lucide-react";
import { ReactNode } from "react";

interface OnboardingShellProps {
    steps: string[];
    currentStep: number;
    completedSteps: string[];
    stepKeys: string[];
    children: ReactNode;
}

export function OnboardingShell({
    steps,
    currentStep,
    completedSteps,
    stepKeys,
    children,
}: OnboardingShellProps) {
    return (
        <div>
            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((label, idx) => {
                        const isCompleted = completedSteps.includes(stepKeys[idx]);
                        const isCurrent = idx === currentStep;

                        return (
                            <div key={label} className="flex flex-1 items-center">
                                {/* Step circle */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={cn(
                                            "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                                            isCompleted
                                                ? "border-primary bg-primary text-white"
                                                : isCurrent
                                                    ? "border-primary bg-white text-primary shadow-sm shadow-primary/20"
                                                    : "border-[rgb(var(--border-default))] bg-white text-[rgb(var(--text-muted))]",
                                        )}
                                    >
                                        {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <span
                                        className={cn(
                                            "mt-2 text-xs font-medium whitespace-nowrap",
                                            isCurrent
                                                ? "text-primary"
                                                : isCompleted
                                                    ? "text-[rgb(var(--text-primary))]"
                                                    : "text-[rgb(var(--text-muted))]",
                                        )}
                                    >
                                        {label}
                                    </span>
                                </div>

                                {/* Connector line */}
                                {idx < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "mx-2 h-0.5 flex-1",
                                            completedSteps.includes(stepKeys[idx])
                                                ? "bg-primary"
                                                : "bg-[rgb(var(--border-default))]",
                                        )}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step content */}
            <div className="rounded-xl border border-[rgb(var(--border-default))] bg-white p-8 shadow-sm">
                {children}
            </div>
        </div>
    );
}
