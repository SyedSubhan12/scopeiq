"use client";

import { useState, useRef } from "react";
import { useToast } from "@novabots/ui";
import { ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useOnboardingContext, type PainPoint } from "@/components/onboarding/OnboardingContext";
import { Micro } from "@/animations/utils/micro-interactions";

const OPTIONS: {
    id: PainPoint;
    emoji: string;
    label: string;
    sub: string;
    module: string;
}[] = [
    {
        id: "scope_guard",
        emoji: "🚨",
        label: "Clients keep adding work outside what we agreed",
        sub: "Scope creep, out-of-scope requests, untracked extras",
        module: "Scope Guard",
    },
    {
        id: "approval_portal",
        emoji: "⏳",
        label: "Approvals take forever and clients go silent",
        sub: "Chasing sign-off, no structured review process",
        module: "Approval Portal",
    },
    {
        id: "brief_builder",
        emoji: "📋",
        label: "Clients send vague briefs and expect perfect results",
        sub: "Ambiguous briefs, misaligned expectations at kickoff",
        module: "Brief Builder",
    },
    {
        id: "full_tour",
        emoji: "⚡",
        label: "All three — I need the full platform",
        sub: "Show me everything",
        module: "Full Platform",
    },
];

export function PainPointRouter() {
    const [selected, setSelected] = useState<PainPoint | null>(null);
    const [saving, setSaving] = useState(false);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const { setPainPoint } = useOnboardingContext();

    const handleContinue = async () => {
        if (!selected || saving) return;
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "pain_point_selected",
                complete: true,
                metadata: { painPoint: selected },
            });
            setPainPoint(selected);
            await hydrateWorkspace();
        } catch (err) {
            toast("error", err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ob-pain-root space-y-8">
            {/* Heading */}
            <div className="ob-pain-heading space-y-2">
                <p
                    className="text-xs font-medium tracking-[0.2em] uppercase"
                    style={{ color: "#0F6E56", fontFamily: "var(--font-mono)" }}
                >
                    Step 3 of 6
                </p>
                <h2
                    className="text-3xl font-bold leading-tight"
                    style={{ color: "#F4F1EC", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                    What&apos;s your biggest
                    <br />
                    challenge right now?
                </h2>
                <p className="ob-pain-sub text-sm" style={{ color: "rgba(244,241,236,0.5)" }}>
                    We&apos;ll set up the most important part of ScopeIQ first.
                </p>
            </div>

            {/* Pain point cards */}
            <div className="ob-pain-cards space-y-3">
                {OPTIONS.map((opt) => (
                    <div
                        key={opt.id}
                        className="ob-pain-card flex items-center gap-4 rounded-2xl border p-4 cursor-pointer transition-all duration-200"
                        style={{
                            borderLeft: selected === opt.id ? "4px solid #0F6E56" : "4px solid transparent",
                            border: selected === opt.id
                                ? "1px solid rgba(15,110,86,0.5)"
                                : "1px solid rgba(255,255,255,0.08)",
                            borderLeftWidth: selected === opt.id ? "4px" : "1px",
                            background: selected === opt.id
                                ? "rgba(15,110,86,0.1)"
                                : "rgba(255,255,255,0.02)",
                            boxShadow: selected === opt.id
                                ? "0 0 24px rgba(15,110,86,0.12), inset 0 0 0 0"
                                : "none",
                            transform: selected === opt.id ? "translateX(4px)" : "translateX(0)",
                        }}
                        onClick={() => setSelected(opt.id)}
                        onMouseEnter={(e) => {
                            if (selected !== opt.id) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selected !== opt.id) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                e.currentTarget.style.transform = "translateX(0)";
                            }
                        }}
                    >
                        <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug" style={{ color: selected === opt.id ? "#F4F1EC" : "rgba(244,241,236,0.85)" }}>
                                {opt.label}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(244,241,236,0.4)" }}>
                                {opt.sub}
                            </p>
                        </div>
                        <span
                            className="rounded-full px-2.5 py-1 text-xs font-medium flex-shrink-0"
                            style={{
                                background: selected === opt.id ? "rgba(15,110,86,0.25)" : "rgba(255,255,255,0.05)",
                                color: selected === opt.id ? "#1DB98A" : "rgba(244,241,236,0.35)",
                                border: selected === opt.id ? "1px solid rgba(15,110,86,0.4)" : "1px solid rgba(255,255,255,0.08)",
                                fontFamily: "var(--font-mono)",
                            }}
                        >
                            {opt.module}
                        </span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="ob-pain-cta flex justify-end">
                <button
                    ref={ctaRef}
                    onClick={() => void handleContinue()}
                    disabled={!selected || saving}
                    onMouseDown={() => ctaRef.current && Micro.buttonPress(ctaRef.current)}
                    onMouseUp={() => ctaRef.current && Micro.buttonRelease(ctaRef.current)}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                        background: selected ? "linear-gradient(135deg, #0F6E56, #1DB98A)" : "rgba(255,255,255,0.06)",
                        color: selected ? "#fff" : "rgba(244,241,236,0.3)",
                        boxShadow: selected ? "0 4px 20px rgba(15,110,86,0.35)" : "none",
                        fontFamily: "var(--font-sans)",
                    }}
                >
                    {saving ? "Saving…" : "Set up this module first"}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
