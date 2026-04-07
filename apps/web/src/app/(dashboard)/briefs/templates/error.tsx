"use client";

import { BriefRouteErrorState } from "@/components/briefs/shared/route-state";

export default function BriefTemplatesError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <BriefRouteErrorState
      title="Templates could not be loaded"
      description="The brief template library is temporarily unavailable."
      onRetry={reset}
    />
  );
}

