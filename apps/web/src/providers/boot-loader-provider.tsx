"use client";

import { GlobalLoader } from "@/components/shared/GlobalLoader";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const MIN_BOOT_MS = 800; // Controlled reveal (ClickUp style): minimum display time

type LoaderTask = Promise<unknown> | (() => Promise<unknown> | unknown);

type BootLoaderContextValue = {
  isBootReady: boolean;
  registerTasks: (scopeId: string, tasks: LoaderTask[]) => () => void;
};

const BootLoaderContext = createContext<BootLoaderContextValue | null>(null);

function waitForDocumentReady() {
  if (typeof document === "undefined" || document.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

function waitForFonts() {
  const documentWithFonts = document as Document & {
    fonts?: {
      ready: Promise<unknown>;
    };
  };

  if (typeof document === "undefined" || !documentWithFonts.fonts) {
    return Promise.resolve();
  }

  return documentWithFonts.fonts.ready.then(() => undefined);
}

export function BootLoaderProvider({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [isBootReady, setIsBootReady] = useState(false);
  const [registrationWindowClosed, setRegistrationWindowClosed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const bootStartedAtRef = useRef<number | null>(null);
  const tokenRef = useRef(0);
  const pendingTokensRef = useRef(new Set<number>());
  const scopesRef = useRef(new Map<string, Set<number>>());

  const syncPendingCount = useCallback(() => {
    setPendingCount(pendingTokensRef.current.size);
  }, []);

  const removeToken = useCallback(
    (scopeId: string, token: number) => {
      if (!pendingTokensRef.current.delete(token)) {
        return;
      }

      const scopeTokens = scopesRef.current.get(scopeId);
      if (scopeTokens) {
        scopeTokens.delete(token);
        if (scopeTokens.size === 0) {
          scopesRef.current.delete(scopeId);
        }
      }

      syncPendingCount();
    },
    [syncPendingCount],
  );

  const registerTasks = useCallback(
    (scopeId: string, tasks: LoaderTask[]) => {
      if (isBootReady || tasks.length === 0) {
        return () => undefined;
      }

      const scopeTokens = scopesRef.current.get(scopeId) ?? new Set<number>();
      scopesRef.current.set(scopeId, scopeTokens);

      const taskTokens = tasks.map((task) => {
        const token = ++tokenRef.current;
        pendingTokensRef.current.add(token);
        scopeTokens.add(token);

        Promise.resolve()
          .then(() => (typeof task === "function" ? task() : task))
          .catch(() => null)
          .finally(() => {
            removeToken(scopeId, token);
          });

        return token;
      });

      syncPendingCount();

      return () => {
        taskTokens.forEach((token) => removeToken(scopeId, token));
      };
    },
    [isBootReady, removeToken, syncPendingCount],
  );

  // Phase 1: Wait for fonts and document ready
  useEffect(() => {
    bootStartedAtRef.current = performance.now();
    const unregisterBaseTasks = registerTasks("boot:base", [
      () => waitForFonts(),
      () => waitForDocumentReady(),
    ]);

    let secondFrame: number | null = null;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setRegistrationWindowClosed(true);
      });
    });

    return () => {
      unregisterBaseTasks();
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [registerTasks]);

  // Phase 2: Wait for minimum time + all tasks
  useEffect(() => {
    if (isBootReady || !registrationWindowClosed || pendingCount > 0) {
      return;
    }

    const startedAt = bootStartedAtRef.current ?? performance.now();
    const elapsed = performance.now() - startedAt;
    const timeoutId = window.setTimeout(
      () => setIsBootReady(true),
      Math.max(MIN_BOOT_MS - elapsed, 0),
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isBootReady, pendingCount, registrationWindowClosed]);

  const contextValue = useMemo(
    () => ({
      isBootReady,
      registerTasks,
    }),
    [isBootReady, registerTasks],
  );

  return (
    <BootLoaderContext.Provider value={contextValue}>
      {/* Main app: hidden until boot complete, smooth fade in */}
      <motion.div
        initial={false}
        animate={
          isBootReady
            ? { opacity: 1, scale: 1, filter: "blur(0px)" }
            : { opacity: 0, scale: 0.995, filter: "blur(2px)" }
        }
        transition={{
          duration: reduceMotion ? 0.18 : 0.42,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ visibility: isBootReady ? "visible" : "hidden" }}
      >
        {children}
      </motion.div>

      {/* Sandy loader: shows until boot ready, smooth fade out */}
      <AnimatePresence>
        {!isBootReady ? (
          <motion.div
            key="boot-loader"
            className="fixed inset-0 z-[100001] flex items-center justify-center bg-[rgb(var(--surface-subtle))]"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: reduceMotion ? 1 : 0.985,
            }}
            transition={{
              duration: reduceMotion ? 0.2 : 0.46,
              ease: [0.4, 0, 0.2, 1],
            }}
            aria-busy={true}
            aria-live="polite"
            aria-label="Loading application"
          >
            <GlobalLoader compact />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </BootLoaderContext.Provider>
  );
}

export function useBootLoader() {
  const context = useContext(BootLoaderContext);

  if (!context) {
    throw new Error("useBootLoader must be used within BootLoaderProvider");
  }

  return context;
}

export const LoaderProvider = BootLoaderProvider;

export function useAppReady() {
  const { isBootReady, registerTasks } = useBootLoader();

  return {
    isReady: isBootReady,
    registerTasks,
  };
}
