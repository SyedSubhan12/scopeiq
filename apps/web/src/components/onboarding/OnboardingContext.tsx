"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type PersonaType = "solo" | "studio" | "agency";
export type ServiceType =
    | "brand_identity"
    | "web_design"
    | "social_media"
    | "motion_video"
    | "ux_product"
    | "marketing_copy"
    | "other";
export type PainPoint =
    | "scope_guard"
    | "approval_portal"
    | "brief_builder"
    | "full_tour";

interface OnboardingContextValue {
    persona: PersonaType | null;
    serviceType: ServiceType | null;
    painPoint: PainPoint | null;
    setPersona: (p: PersonaType) => void;
    setServiceType: (s: ServiceType) => void;
    setPainPoint: (p: PainPoint) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [persona, setPersona] = useState<PersonaType | null>(null);
    const [serviceType, setServiceType] = useState<ServiceType | null>(null);
    const [painPoint, setPainPoint] = useState<PainPoint | null>(null);

    return (
        <OnboardingContext.Provider
            value={{ persona, serviceType, painPoint, setPersona, setServiceType, setPainPoint }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboardingContext() {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error("useOnboardingContext must be used within OnboardingProvider");
    return ctx;
}
