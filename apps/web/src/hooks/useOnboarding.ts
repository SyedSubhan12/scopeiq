import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export type OnboardingStep = "branding" | "first_project" | "first_template" | "first_sow";

export interface OnboardingProgress {
  branding: boolean;
  first_project: boolean;
  first_template: boolean;
  first_sow: boolean;
}

const ALL_STEPS: OnboardingStep[] = ["branding", "first_project", "first_template", "first_sow"];

export interface WorkspaceWithOnboarding {
  id: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
  onboardingProgress: OnboardingProgress | null;
}

export function useOnboardingProgress() {
  return useQuery<WorkspaceWithOnboarding>({
    queryKey: ["workspace"],
    queryFn: () => fetchWithAuth("/v1/workspaces/me") as Promise<WorkspaceWithOnboarding>,
  });
}

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (onboardingProgress: OnboardingProgress) =>
      fetchWithAuth("/v1/workspaces/me", {
        method: "PATCH",
        body: JSON.stringify({ onboardingProgress }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
}

export function getProgress(onboardingProgress: OnboardingProgress | null): {
  completed: number;
  total: number;
  percentage: number;
} {
  const progress = onboardingProgress ?? {
    branding: false,
    first_project: false,
    first_template: false,
    first_sow: false,
  };

  const completed = ALL_STEPS.filter((step) => progress[step]).length;
  const total = ALL_STEPS.length;

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
}

export function isStepComplete(
  onboardingProgress: OnboardingProgress | null,
  step: OnboardingStep,
): boolean {
  return onboardingProgress?.[step] ?? false;
}

export function isOnboardingComplete(onboardingProgress: OnboardingProgress | null): boolean {
  if (!onboardingProgress) return false;
  return ALL_STEPS.every((step) => onboardingProgress[step]);
}

export function useMarkStepComplete() {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateOnboardingProgress();

  return useMutation({
    mutationFn: async (step: OnboardingStep) => {
      const current = await fetchWithAuth("/v1/workspaces/me") as WorkspaceWithOnboarding;
      const currentProgress = current.onboardingProgress ?? {
        branding: false,
        first_project: false,
        first_template: false,
        first_sow: false,
      };

      if (currentProgress[step]) {
        return currentProgress;
      }

      const updated = { ...currentProgress, [step]: true };

      await fetchWithAuth("/v1/workspaces/me", {
        method: "PATCH",
        body: JSON.stringify({ onboardingProgress: updated }),
      });

      return updated;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
  });
}
