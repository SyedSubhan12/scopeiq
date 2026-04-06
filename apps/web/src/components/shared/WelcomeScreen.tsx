"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, FolderKanban, FileText, FileCheck, CheckCircle2, Circle } from "lucide-react";
import { Button, Card } from "@novabots/ui";
import {
  useOnboardingProgress,
  getProgress,
  isStepComplete,
  OnboardingStep,
} from "@/hooks/useOnboarding";

const WELCOME_STORAGE_KEY = "scopeiq-welcome-dismissed";

const STEPS: { key: OnboardingStep; label: string; icon: typeof Palette }[] = [
  { key: "branding", label: "Upload logo & set brand color", icon: Palette },
  { key: "first_project", label: "Create your first project", icon: FolderKanban },
  { key: "first_template", label: "Set up a Brief Builder template", icon: FileText },
  { key: "first_sow", label: "Upload or paste a SOW", icon: FileCheck },
];

export function WelcomeScreen() {
  const { data: workspace, isLoading } = useOnboardingProgress();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!dismissed && !isLoading) {
      setVisible(true);
    }
  }, [isLoading]);

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    setVisible(false);
  };

  const handleGetStarted = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    setVisible(false);
  };

  if (isLoading || !visible) return null;

  const onboardingProgress = workspace?.onboardingProgress ?? null;
  const { completed } = getProgress(onboardingProgress);
  const allComplete = completed === STEPS.length;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg mx-4"
          >
            <Card className="relative overflow-hidden border-0 shadow-2xl bg-white p-0">
              {/* Gradient accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[rgb(var(--primary))] via-purple-500 to-blue-500" />

              <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                    Welcome to ScopeIQ!
                  </h2>
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                    Let&apos;s get you set up. Complete these 4 steps to unlock the full experience.
                  </p>
                </div>

                {/* Step Checklist */}
                <ul className="space-y-3">
                  {STEPS.map((step) => {
                    const complete = isStepComplete(onboardingProgress, step.key);
                    const Icon = step.icon;

                    return (
                      <motion.li
                        key={step.key}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + STEPS.indexOf(step) * 0.08 }}
                        className="flex items-center gap-3 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-3"
                      >
                        {complete ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-[rgb(var(--text-muted))]" />
                        )}
                        <Icon className={`h-4 w-4 shrink-0 ${complete ? "text-green-500" : "text-[rgb(var(--text-muted))]"} `} />
                        <span
                          className={`text-sm font-medium ${
                            complete
                              ? "text-[rgb(var(--text-muted))] line-through"
                              : "text-[rgb(var(--text-primary))]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>

                {/* Progress indicator */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(completed / STEPS.length) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--primary))] to-purple-500"
                    />
                  </div>
                  <span className="text-xs font-medium text-[rgb(var(--text-muted))]">
                    {completed}/{STEPS.length}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  {allComplete ? (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleGetStarted}
                      className="flex-1"
                    >
                      You&apos;re all set!
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleGetStarted}
                      className="flex-1"
                    >
                      Get Started
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="rounded-md p-2 text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
                    aria-label="Dismiss welcome"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
