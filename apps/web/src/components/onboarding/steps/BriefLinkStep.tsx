"use client";

import { useRef, useState } from "react";
import { useToast } from "@novabots/ui";
import { Link2, Copy, Check, ArrowRight, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { Micro } from "@/animations/utils/micro-interactions";
import { AnimatePresence, motion } from "framer-motion";

export function BriefLinkStep() {
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const workspaceId = useWorkspaceStore((s) => s.id);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const copyBtnRef = useRef<HTMLButtonElement>(null);

    const briefLink = `https://app.scopeiq.co/b/${workspaceId ?? "..."}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(briefLink);
            setCopied(true);
            if (copyBtnRef.current) Micro.copySuccess(copyBtnRef.current);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast("error", "Could not copy to clipboard");
        }
    };

    const handleContinue = async () => {
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "brief_link",
                complete: true,
            });
            await hydrateWorkspace();
        } catch (err) {
            console.error("[BriefLinkStep] save failed:", err);
            toast("error", err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header — targeted by workspace.timeline.ts */}
            <div className="text-center">
                <div className="ob-workspace-icon mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm shadow-primary/10">
                    <Link2 className="h-7 w-7 text-primary" />
                </div>
                <h2 className="ob-workspace-heading text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
                    Your brief intake link is ready
                </h2>
                <p className="ob-workspace-sub mt-2 text-sm text-[rgb(var(--text-muted))]">
                    Share this link with your next client — they fill in their brief, you get protected.
                    No form builder needed.
                </p>
            </div>

            {/* Link box — targeted as .ob-workspace-linkbox */}
            <div className="ob-workspace-linkbox rounded-2xl border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle,247,249,251))] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                    Your brief link
                </p>
                <div className="flex items-center gap-3">
                    <code className="flex-1 truncate rounded-xl border border-[rgb(var(--border-default))] bg-white px-3 py-2.5 text-sm font-mono text-[rgb(var(--text-primary))]">
                        {briefLink}
                    </code>
                    <button
                        ref={copyBtnRef}
                        onClick={() => void handleCopy()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--border-default))] bg-white text-[rgb(var(--text-muted))] transition-colors hover:border-primary/40 hover:text-primary"
                        aria-label="Copy brief link"
                        style={{ willChange: "transform" }}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {copied ? (
                                <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                                    <Check className="h-4 w-4 text-emerald-500" />
                                </motion.span>
                            ) : (
                                <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                                    <Copy className="h-4 w-4" />
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
                <AnimatePresence>
                    {copied && (
                        <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="mt-2 text-xs font-medium text-emerald-600"
                        >
                            Copied! Share this link with your client.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Value prop — targeted as .ob-workspace-valueprop */}
            <div className="ob-workspace-valueprop flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="text-sm">
                    <p className="font-semibold text-[rgb(var(--text-primary))]">
                        First value delivered in under 2 minutes
                    </p>
                    <p className="mt-0.5 text-[rgb(var(--text-muted))]">
                        Every submission through this link is automatically matched against your SOW.
                        ScopeIQ flags out-of-scope requests before they cost you.
                    </p>
                </div>
            </div>

            {/* CTA — targeted as .ob-workspace-cta */}
            <div className="ob-workspace-cta flex items-center justify-between">
                <p className="text-xs text-[rgb(var(--text-muted))]">
                    Find this link anytime in Brief settings.
                </p>
                <button
                    ref={ctaRef}
                    onClick={() => void handleContinue()}
                    disabled={saving}
                    onMouseDown={() => ctaRef.current && Micro.buttonPress(ctaRef.current)}
                    onMouseUp={() => ctaRef.current && Micro.buttonRelease(ctaRef.current)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? "Saving…" : "See it in action"}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
