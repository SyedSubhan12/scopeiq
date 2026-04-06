"use client";

import { PageLoadingAnimation } from "@/components/shared/PageLoadingAnimation";
import { useAuth } from "@/providers/auth-provider";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 160;
const MIN_VISIBLE_MS = 260;

export function AppLoadingOverlay() {
  const { loading: authLoading, session } = useAuth();
  const workspaceLoading = useWorkspaceStore((state) => state.loading);
  const workspaceHydrated = useWorkspaceStore((state) => state.hydrated);
  const pathname = usePathname();

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/briefs") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/scope-flags") ||
    pathname.startsWith("/change-orders");

  const shouldBlock =
    isProtectedRoute &&
    (authLoading ||
      (Boolean(session) && !workspaceHydrated) ||
      workspaceLoading);

  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldBlock) {
      const timeoutId = window.setTimeout(() => {
        shownAtRef.current = performance.now();
        setVisible(true);
      }, SHOW_DELAY_MS);

      return () => window.clearTimeout(timeoutId);
    }

    if (!visible) {
      return;
    }

    const elapsed =
      shownAtRef.current === null ? MIN_VISIBLE_MS : performance.now() - shownAtRef.current;
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
      shownAtRef.current = null;
    }, Math.max(MIN_VISIBLE_MS - elapsed, 0));

    return () => window.clearTimeout(timeoutId);
  }, [shouldBlock, visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="app-loading-overlay"
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-[rgb(var(--surface-subtle))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          aria-busy={true}
          aria-live="polite"
          aria-label="Loading application"
        >
          <PageLoadingAnimation compact />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
