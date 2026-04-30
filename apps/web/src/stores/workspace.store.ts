import { create } from "zustand";
import { apiClient } from "@/lib/api";

export interface OnboardingProgress {
    completedSteps: string[];
    skippedAt?: string | undefined;
    completedAt?: string | undefined;
}

interface WorkspaceState {
    // Data
    id: string | null;
    name: string;
    plan: "free" | "solo" | "studio" | "agency";
    brandColor: string;
    logoUrl: string | null;
    onboardingProgress: OnboardingProgress;
    settingsJson: Record<string, unknown>;
    features: Record<string, boolean>;
    hydrated: boolean;
    loading: boolean;

    // Derived
    isOnboarded: boolean;

    // Actions
    hydrateWorkspace: () => Promise<void>;
    setWorkspaceField: (field: Partial<WorkspaceState>) => void;
    markOnboardingStep: (step: string) => void;
    reset: () => void;
}

const initialState = {
    id: null,
    name: "",
    plan: "free" as const,
    brandColor: "#0F6E56",
    logoUrl: null,
    onboardingProgress: { completedSteps: [] },
    settingsJson: {},
    features: {},
    hydrated: false,
    loading: false,
    isOnboarded: false,
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    ...initialState,

    hydrateWorkspace: async () => {
        if (get().loading) return;
        set({ loading: true });

        try {
            const res = await apiClient.get<{ data: Record<string, unknown> }>("/v1/workspaces/me");
            const ws = res.data;

            const rawProgress = (ws.onboardingProgress as Partial<OnboardingProgress>) || {};
            const progress: OnboardingProgress = {
                completedSteps: Array.isArray(rawProgress.completedSteps)
                    ? rawProgress.completedSteps
                    : [],
                skippedAt: rawProgress.skippedAt,
                completedAt: rawProgress.completedAt,
            };
            const isOnboarded = !!progress.completedAt;

            set({
                id: ws.id as string,
                name: (ws.name as string) ?? "",
                plan: (ws.plan as "free" | "solo" | "studio" | "agency") ?? "free",
                brandColor: (ws.brandColor as string) ?? "#0F6E56",
                logoUrl: (ws.logoUrl as string) ?? null,
                onboardingProgress: progress,
                settingsJson: (ws.settingsJson as Record<string, unknown>) ?? {},
                features: (ws.features as Record<string, boolean>) ?? {},
                isOnboarded,
                hydrated: true,
                loading: false,
            });

            if (typeof document !== "undefined") {
                const secure =
                    typeof window !== "undefined" && window.location.protocol === "https:";
                const secureAttr = secure ? "; Secure" : "";
                document.cookie = `x-onboarded=${isOnboarded ? "1" : "0"}; path=/; SameSite=Lax${secureAttr}`;
            }
        } catch (error) {
            console.error("Failed to hydrate workspace:", error);
            set({ loading: false, hydrated: true });
        }
    },

    setWorkspaceField: (fields) => set(fields),

    markOnboardingStep: (step) => {
        const { onboardingProgress } = get();
        if (!onboardingProgress.completedSteps.includes(step)) {
            set({
                onboardingProgress: {
                    ...onboardingProgress,
                    completedSteps: [...onboardingProgress.completedSteps, step],
                },
            });
        }
    },

    reset: () => set(initialState),
}));
