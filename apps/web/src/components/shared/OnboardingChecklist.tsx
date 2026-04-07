"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  X,
  Palette,
  FolderKanban,
  FileText,
  FileCheck,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button, Card, Badge } from "@novabots/ui";
import {
  useOnboardingProgress,
  useMarkStepComplete,
  getProgress,
  isStepComplete,
  isOnboardingComplete,
  OnboardingStep,
} from "@/hooks/useOnboarding";
import { useUIStore } from "@/stores/ui.store";

const DISMISSED_STORAGE_KEY = "scopeiq-onboarding-checklist-dismissed";

const STEPS: {
  key: OnboardingStep;
  label: string;
  icon: typeof Palette;
  href: string;
}[] = [
  { key: "branding", label: "Upload logo & set brand color", icon: Palette, href: "/settings/workspace" },
  { key: "first_project", label: "Create first project", icon: FolderKanban, href: "/projects" },
  { key: "first_template", label: "Set up Brief Builder template", icon: FileText, href: "/briefs" },
  { key: "first_sow", label: "Upload or paste SOW", icon: FileCheck, href: "/projects/[id]/scope-guard" },
];

function fireConfetti() {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const context = ctx;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
  }

  const colors = [
    "hsl(var(--primary, 220 90% 56%))",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

  const particles: Particle[] = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -18 - 4,
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#0F6E56",
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
    });
  }

  let frame = 0;
  const maxFrames = 180;

  function animate() {
    if (frame >= maxFrames) {
      document.body.removeChild(canvas);
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - frame / maxFrames);

      context.save();
      context.translate(p.x, p.y);
      context.rotate((p.rotation * Math.PI) / 180);
      context.globalAlpha = p.opacity;
      context.fillStyle = p.color;
      context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      context.restore();
    }

    frame++;
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

export function OnboardingChecklist() {
  const { data: workspace, isLoading } = useOnboardingProgress();
  const markStepMutation = useMarkStepComplete();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const prevCompleteRef = useRef(0);
  const setActiveProjectId = useUIStore((s) => s.setActiveProjectId);

  useEffect(() => {
    const val = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (val) {
      setDismissed(true);
    }
  }, []);

  const onboardingProgress = workspace?.onboardingProgress ?? null;
  const { completed, total } = getProgress(onboardingProgress);
  const allComplete = isOnboardingComplete(onboardingProgress);

  // Watch for completion transition
  useEffect(() => {
    if (completed > prevCompleteRef.current && completed === total) {
      setCelebrating(true);
      fireConfetti();
      setTimeout(() => setCelebrating(false), 3000);
    }
    prevCompleteRef.current = completed;
  }, [completed, total]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    setDismissed(true);
  }, []);

  const handleStepClick = useCallback(
    (step: OnboardingStep, href: string) => {
      markStepMutation.mutate(step);
    },
    [markStepMutation],
  );

  if (isLoading || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 right-4 z-40 w-80"
      >
        <Card className="border-[rgb(var(--border-default))] bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[rgb(var(--primary))]" />
              <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                Setup Checklist
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="rounded p-1 text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
                aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
              >
                {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded p-1 text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
                aria-label="Dismiss checklist"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="pt-3">
                  {/* Progress bar */}
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(completed / total) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--primary))] to-purple-500"
                      />
                    </div>
                    <Badge status={allComplete ? "completed" : "active"}>
                      Step {completed} of {total}
                    </Badge>
                  </div>

                  {/* Steps */}
                  <ul className="space-y-1">
                    {STEPS.map((step) => {
                      const complete = isStepComplete(onboardingProgress, step.key);
                      const Icon = step.icon;
                      const isMarking = markStepMutation.isPending;

                      // Resolve href for dynamic route
                      let resolvedHref = step.href;
                      if (step.href.includes("[id]")) {
                        resolvedHref = "/projects";
                      }

                      return (
                        <li key={step.key}>
                          <div
                            className={`flex items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                              complete
                                ? "bg-green-50/50"
                                : "hover:bg-[rgb(var(--surface-subtle))]"
                            }`}
                          >
                            {/* Checkbox */}
                            <button
                              type="button"
                              disabled={isMarking || complete}
                              onClick={() => handleStepClick(step.key, step.href)}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                                complete
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-[rgb(var(--border-default))] hover:border-[rgb(var(--primary))]"
                              }`}
                              aria-label={`Mark ${step.label} as complete`}
                            >
                              {complete && <Check className="h-3 w-3" />}
                            </button>

                            {/* Icon */}
                            <Icon
                              className={`h-4 w-4 shrink-0 ${
                                complete
                                  ? "text-green-500"
                                  : "text-[rgb(var(--text-muted))]"
                              }`}
                            />

                            {/* Label + Link */}
                            <Link
                              href={resolvedHref}
                              onClick={() => handleStepClick(step.key, step.href)}
                              className={`min-w-0 flex-1 truncate text-xs font-medium transition-colors ${
                                complete
                                  ? "text-green-600 line-through"
                                  : "text-[rgb(var(--text-primary))] hover:text-[rgb(var(--primary))]"
                              }`}
                            >
                              {step.label}
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Celebration message */}
                  {celebrating && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="mt-3 rounded-md bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 text-center"
                    >
                      <p className="text-xs font-semibold text-green-700">
                        All steps complete -- you&apos;re ready to go!
                      </p>
                    </motion.div>
                  )}

                  {/* Dismiss link */}
                  {!allComplete && (
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="mt-2 w-full text-center text-xs text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text-primary))]"
                    >
                      Dismiss for now
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
