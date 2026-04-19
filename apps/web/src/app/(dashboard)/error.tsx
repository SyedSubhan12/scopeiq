"use client";

import { RouteError } from "@/components/shared/RouteError";

// Sprint 6 launch prep: shared error boundary for every dashboard segment.
// Next.js propagates errors to the nearest parent error.tsx, so this covers
// all nested routes (briefs, projects, clients, change-orders, scope-flags,
// analytics, activity, settings, …) unless a segment defines its own.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} />;
}
