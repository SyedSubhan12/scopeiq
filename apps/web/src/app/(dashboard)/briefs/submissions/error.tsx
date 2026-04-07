"use client";

import { BriefRouteErrorState } from "@/components/briefs/shared/route-state";

export default function BriefSubmissionsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <BriefRouteErrorState
      title="Submission queue could not be loaded"
      description="The brief review queue is temporarily unavailable."
      onRetry={reset}
    />
  );
}

