import Link from "next/link";
import { NotFoundAnimation } from "@/components/shared/NotFoundAnimation";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[rgb(var(--surface-subtle))] px-6 py-16 text-center">
      <NotFoundAnimation />
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[rgb(var(--text-primary))]">
          Page not found
        </h1>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-[rgb(var(--primary))] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--primary))]"
      >
        Back to ScopeIQ
      </Link>
    </div>
  );
}
