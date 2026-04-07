"use client";

import { BriefRouteErrorState } from "@/components/briefs/shared/route-state";

export default function BriefTemplateDetailError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <BriefRouteErrorState
      title="Template detail could not be loaded"
      description="The template route failed to load. Try again or return to the template library."
      onRetry={reset}
    />
  );
}

