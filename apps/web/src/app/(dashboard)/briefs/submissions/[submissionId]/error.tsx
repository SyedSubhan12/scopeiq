"use client";

import { BriefRouteErrorState } from "@/components/briefs/shared/route-state";

export default function BriefSubmissionDetailError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <BriefRouteErrorState
      title="Submission review could not be loaded"
      description="The review surface failed to load for this brief submission."
      onRetry={reset}
    />
  );
}

