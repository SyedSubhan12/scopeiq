"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@novabots/ui";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  description = "We hit an unexpected error while loading this page. You can try again, or head back to the dashboard.",
}: RouteErrorProps) {
  useEffect(() => {
    // Best-effort client-side reporting. Real Sentry wiring lives in app/error.tsx.
    // eslint-disable-next-line no-console
    console.error("[RouteError]", error);
  }, [error]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex min-h-[60vh] w-full flex-col items-center justify-center px-6"
      role="alert"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">
        {title}
      </h1>
      <p className="mt-1 max-w-md text-center text-sm text-[rgb(var(--text-secondary))]">
        {description}
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[10px] text-[rgb(var(--text-muted))]">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-5 flex gap-2">
        <Button size="sm" onClick={() => reset()} className="bg-[#1D9E75] hover:bg-[#178862]">
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    </motion.div>
  );
}
