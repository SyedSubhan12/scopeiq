import { PageLoadingAnimation } from "@/components/shared/PageLoadingAnimation";

/**
 * Dashboard segment loading: same Sandy Lottie as global `app/loading.tsx`, shown
 * inside `<main>` while RSC payload for dashboard routes resolves (sidebar + top bar stay mounted).
 */
export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center"
      aria-busy={true}
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <PageLoadingAnimation />
    </div>
  );
}
