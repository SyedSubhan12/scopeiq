"use client";

import { useEffect } from "react";
import { Button } from "@novabots/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to error tracking service (Sentry later)
    console.error("[ScopeIQ Error Boundary]", error);
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>

      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm text-[rgb(var(--text-muted))]">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>

      {isDevelopment && error?.message && (
        <details className="mt-4 w-full max-w-xl text-left">
          <summary className="cursor-pointer text-xs font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
            View error details (development only)
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-[rgb(var(--surface-subtle))] p-3 text-xs text-[rgb(var(--text-muted))]">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      {error.digest && isDevelopment && (
        <p className="mt-2 text-xs font-mono text-[rgb(var(--text-muted))]">
          Digest: {error.digest}
        </p>
      )}

      <div className="mt-6">
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
