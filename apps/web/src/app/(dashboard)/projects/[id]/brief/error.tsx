"use client";

import { BriefRouteErrorState } from "@/components/briefs/shared/route-state";

export default function ProjectBriefError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <BriefRouteErrorState
      title="Project brief could not be loaded"
      description="The approved brief view for this project is temporarily unavailable."
      onRetry={reset}
    />
  );
}

