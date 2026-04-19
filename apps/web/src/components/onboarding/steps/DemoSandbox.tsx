"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@novabots/ui";
import {
    ShieldAlert,
    MessageCircle,
    ArrowRight,
    TrendingUp,
    CheckCircle2,
    DollarSign,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { Micro } from "@/animations/utils/micro-interactions";

type SubStep = 0 | 1 | 2;

function useCountUp(target: number, duration = 1400, active = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!active) return;
        const steps = 60;
        const increment = target / steps;
        let current = 0, frame = 0;
        const interval = setInterval(() => {
            frame++;
            current = Math.min(current + increment + frame * 0.5, target);
            setCount(Math.floor(current));
            if (current >= target) { setCount(target); clearInterval(interval); }
        }, duration / steps);
        return () => clearInterval(interval);
    }, [target, duration, active]);
    return count;
}

const STEPS = [
    { label: "Client sends message", icon: MessageCircle },
    { label: "Scope flag detected", icon: ShieldAlert },
    { label: "Revenue recovered", icon: TrendingUp },
];

export function DemoSandbox() {
    const [subStep, setSubStep] = useState<SubStep>(0);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const recoveredAmount = useCountUp(800, 1400, subStep === 2);
    const ctaRef = useRef<HTMLButtonElement>(null);

    const handleComplete = async () => {
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "sandbox",
                complete: true,
            });
            await hydrateWorkspace();
        } catch (err) {
            console.error("[DemoSandbox] save failed:", err);
            toast("error", err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header — targeted by sandbox.timeline.ts */}
            <div className="text-center">
                <h2 className="ob-sandbox-heading text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
                    See ScopeIQ in action
                </h2>
                <p className="ob-sandbox-sub mt-2 text-sm text-[rgb(var(--text-muted))]">
                    Watch how ScopeIQ catches scope creep before it costs you — in 60 seconds.
                </p>
            </div>

            {/* Mini stepper — targeted as .ob-sandbox-stepper */}
            <div className="ob-sandbox-stepper flex items-center gap-2">
                {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx === subStep;
                    const isDone = idx < subStep;
                    return (
                        <div key={step.label} className="flex flex-1 items-center gap-2">
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={[
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                                    isDone ? "border-primary bg-primary text-white"
                                        : isActive ? "border-primary bg-white text-primary"
                                            : "border-[rgb(var(--border-default))] bg-white text-[rgb(var(--text-muted))]",
                                ].join(" ")}>
                                    {isDone
                                        ? <CheckCircle2 className="h-4 w-4" />
                                        : <Icon className="h-3.5 w-3.5" />
                                    }
                                </div>
                                <span className="max-w-[60px] text-center text-[10px] font-medium leading-tight text-[rgb(var(--text-muted))]">
                                    {step.label}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={[
                                    "mb-5 h-0.5 flex-1 transition-all duration-500",
                                    isDone ? "bg-primary" : "bg-[rgb(var(--border-default))]",
                                ].join(" ")} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step content panels — targeted as .ob-sandbox-panel */}
            <AnimatePresence mode="wait">
                {subStep === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25 }}
                        className="ob-sandbox-panel space-y-4"
                    >
                        <div className="rounded-2xl border border-[rgb(var(--border-default))] bg-white p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                Client portal — Alex from Acme Co.
                            </p>
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                    A
                                </div>
                                <div className="flex-1">
                                    <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                                        <p className="text-sm text-[rgb(var(--text-primary))]">
                                            Hi! Can you also add{" "}
                                            <span className="font-semibold">10 Instagram posts</span>{" "}
                                            to the project? We need them by Friday — just add it to the logo work!
                                        </p>
                                    </div>
                                    <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">just now</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setSubStep(1)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
                            >
                                See what ScopeIQ does
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {subStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25 }}
                        className="ob-sandbox-panel space-y-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 260 }}
                            className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Out-of-scope request detected</p>
                                    <p className="mt-1 text-sm text-amber-700">
                                        This request is outside your original SOW. Your brief covered:{" "}
                                        <span className="font-medium">Logo + Brand Guidelines only.</span>
                                    </p>
                                    <p className="mt-2 text-xs text-amber-600">
                                        Detected in &lt;3 seconds · Matched against your SOW
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="rounded-xl border border-[rgb(var(--border-default))] bg-white px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-primary))] transition-colors hover:bg-gray-50">
                                Send Quick Note
                            </button>
                            <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90">
                                Generate Change Order
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setSubStep(2)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
                            >
                                Send the change order
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {subStep === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25 }}
                        className="ob-sandbox-panel space-y-4 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100"
                        >
                            <DollarSign className="h-8 w-8 text-emerald-600" />
                        </motion.div>
                        <div>
                            <p className="text-sm font-medium text-[rgb(var(--text-muted))]">You just recovered</p>
                            <motion.p
                                className="mt-1 text-5xl font-bold tracking-tight text-emerald-600"
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                            >
                                ${recoveredAmount.toLocaleString()}
                            </motion.p>
                            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">in unbilled scope</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            In real life, ScopeIQ catches these automatically — every message, every time.
                            You never work for free again.
                        </div>
                        <button
                            ref={ctaRef}
                            onClick={() => void handleComplete()}
                            disabled={saving}
                            onMouseDown={() => ctaRef.current && Micro.buttonPress(ctaRef.current)}
                            onMouseUp={() => ctaRef.current && Micro.buttonRelease(ctaRef.current)}
                            className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? "Setting up…" : "Set up my first real project →"}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
