"use client";

/**
 * SandboxBanner — shown when the workspace is in demo/sandbox mode.
 *
 * Fetches sandbox status from GET /v1/workspaces/me/sandbox-status on mount.
 * Renders a soft amber banner with a link to the demo project and an X button
 * to dismiss (persisted to localStorage so the banner stays gone on refresh).
 *
 * Intentionally amber/yellow, not red — this is helpful context, not an error.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X, FlaskConical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@novabots/ui";
import { apiClient } from "@/lib/api";

const DISMISS_KEY = "scopeiq.sandbox_banner.dismissed.v1";

interface SandboxStatus {
  sandbox_mode: boolean;
  sandbox_expires_at: string | null;
  demo_project_id: string | null;
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function persistDismiss(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, "true");
  } catch {
    /* ignore quota errors */
  }
}

export function SandboxBanner() {
  const [status, setStatus] = useState<SandboxStatus | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already dismissed by the user — don't even fetch.
    if (isDismissed()) return;

    let cancelled = false;

    apiClient
      .get<{ data: SandboxStatus }>("/v1/workspaces/me/sandbox-status")
      .then((json) => {
        if (!cancelled && json.data.sandbox_mode) {
          setStatus(json.data);
          setVisible(true);
        }
      })
      .catch(() => {
        // Non-fatal — banner simply won't appear.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    persistDismiss();
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && status !== null && (
        <motion.div
          key="sandbox-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "relative flex w-full items-center justify-between gap-3 px-4 py-2.5",
            "bg-amber-50 dark:bg-amber-950/30",
            "border-b border-amber-200 dark:border-amber-800/50",
          )}
          role="banner"
          aria-label="Demo workspace notice"
        >
          {/* Left: icon + message */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <FlaskConical
              className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <p className="truncate text-sm text-amber-800 dark:text-amber-200">
              <span className="font-medium">This is your demo workspace</span>
              {" — "}
              test everything without involving a real client.
            </p>
          </div>

          {/* Right: link + dismiss */}
          <div className="flex shrink-0 items-center gap-3">
            {status.demo_project_id !== null && (
              <Link
                href={`/projects/${status.demo_project_id}`}
                className={cn(
                  "whitespace-nowrap text-sm font-medium",
                  "text-amber-700 underline-offset-2 hover:underline",
                  "dark:text-amber-300 dark:hover:text-amber-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                )}
              >
                View demo project &rarr;
              </Link>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss demo workspace notice"
              className={cn(
                "rounded p-1 transition-colors",
                "text-amber-600 hover:bg-amber-100 hover:text-amber-800",
                "dark:text-amber-400 dark:hover:bg-amber-900/40 dark:hover:text-amber-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
