import { PageLoadingAnimation } from "@/components/shared/PageLoadingAnimation";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--surface-subtle))]">
      <PageLoadingAnimation />
    </div>
  );
}
