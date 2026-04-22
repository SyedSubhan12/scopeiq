"use client";

import { useState, useRef } from "react";
import { useToast } from "@novabots/ui";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useOnboardingContext } from "@/components/onboarding/OnboardingContext";
import { Micro } from "@/animations/utils/micro-interactions";

const TEMPLATES = [
    { id: "brand_identity", emoji: "🎨", label: "Brand Identity", fields: 12, serviceMatch: "brand_identity" },
    { id: "web_design", emoji: "🌐", label: "Web Design", fields: 14, serviceMatch: "web_design" },
    { id: "social_media", emoji: "📱", label: "Social Media", fields: 9, serviceMatch: "social_media" },
    { id: "ux_product", emoji: "🖥️", label: "UX / Product", fields: 11, serviceMatch: "ux_product" },
    { id: "motion_video", emoji: "🎬", label: "Motion & Video", fields: 10, serviceMatch: "motion_video" },
];

function ScoreRing({ score }: { score: number }) {
    const r = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const good = score >= 70;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle
                        cx="44" cy="44" r={r}
                        fill="none"
                        stroke={good ? "#0F6E56" : "#F59E0B"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 1s ease-out" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: good ? "#1DB98A" : "#F59E0B", fontFamily: "var(--font-sans)" }}>
                        {score}
                    </span>
                    <span className="text-xs" style={{ color: "rgba(244,241,236,0.4)" }}>/100</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                {good
                    ? <><Check className="h-3.5 w-3.5" style={{ color: "#0F6E56" }} /><span className="text-sm font-medium" style={{ color: "#1DB98A" }}>Clear brief</span></>
                    : <><AlertTriangle className="h-3.5 w-3.5" style={{ color: "#F59E0B" }} /><span className="text-sm font-medium" style={{ color: "#F59E0B" }}>Needs clarification</span></>
                }
            </div>
            {!good && (
                <div className="space-y-1.5 w-full">
                    {["Project timeline unclear — no deadline specified", "Target audience not defined"].map((flag) => (
                        <div key={flag} className="flex items-start gap-2 rounded-lg border p-2" style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}>
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: "#F59E0B" }} />
                            <p className="text-xs" style={{ color: "rgba(244,241,236,0.6)" }}>{flag}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function BriefBuilderSetup() {
    const [selected, setSelected] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const { serviceType } = useOnboardingContext();

    const recommended = TEMPLATES.find((t) => t.serviceMatch === serviceType);
    const score = selected === recommended?.id ? 87 : selected ? 42 : null;

    const handleContinue = async () => {
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me/onboarding", { step: "path_setup_complete", complete: true });
            await hydrateWorkspace();
        } catch (err) {
            toast("error", err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ob-bb-root space-y-6">
            <div className="ob-bb-heading space-y-2">
                <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "#0F6E56", fontFamily: "var(--font-mono)" }}>
                    Step 4 of 6 · Brief Builder
                </p>
                <h2 className="text-3xl font-bold leading-tight" style={{ color: "#F4F1EC", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                    Set your brief
                    <br />
                    clarity threshold.
                </h2>
                <p className="text-sm" style={{ color: "rgba(244,241,236,0.5)" }}>
                    Briefs below your threshold score are held automatically. Clients are asked to clarify before work begins.
                </p>
            </div>

            {/* Template cards */}
            <div className="ob-bb-templates">
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {TEMPLATES.map((t) => {
                        const isRecommended = t.id === recommended?.id;
                        const isSelected = selected === t.id;
                        return (
                            <div
                                key={t.id}
                                className="flex-shrink-0 w-40 rounded-2xl border p-4 cursor-pointer transition-all duration-200 space-y-3"
                                style={{
                                    background: isSelected ? "rgba(15,110,86,0.12)" : "rgba(255,255,255,0.03)",
                                    borderColor: isSelected ? "rgba(15,110,86,0.5)" : "rgba(255,255,255,0.08)",
                                    boxShadow: isSelected ? "0 0 20px rgba(15,110,86,0.15)" : "none",
                                }}
                                onClick={() => setSelected(t.id)}
                            >
                                {isRecommended && (
                                    <div className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(15,110,86,0.2)", color: "#1DB98A", border: "1px solid rgba(15,110,86,0.35)" }}>
                                        ★ Recommended
                                    </div>
                                )}
                                <div className="text-2xl">{t.emoji}</div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: "#F4F1EC" }}>{t.label}</p>
                                    <p className="text-xs" style={{ color: "rgba(244,241,236,0.35)" }}>{t.fields} fields · Pre-validated</p>
                                </div>
                                <button
                                    className="w-full rounded-lg py-1.5 text-xs font-medium transition-all duration-150"
                                    style={{
                                        background: isSelected ? "rgba(15,110,86,0.25)" : "rgba(255,255,255,0.05)",
                                        color: isSelected ? "#1DB98A" : "rgba(244,241,236,0.5)",
                                        border: isSelected ? "1px solid rgba(15,110,86,0.35)" : "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    {isSelected ? "Selected ✓" : "Select"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Score preview */}
            {score !== null && (
                <div className="ob-bb-score rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                    <p className="text-xs font-semibold tracking-widest uppercase text-center mb-4" style={{ color: "rgba(244,241,236,0.3)", fontFamily: "var(--font-mono)" }}>
                        Clarity score — briefs below 70 are held
                    </p>
                    <ScoreRing score={score} />
                </div>
            )}

            {/* CTA */}
            <div className="flex items-center justify-between">
                <button className="text-xs" style={{ color: "rgba(244,241,236,0.3)" }} onClick={() => void handleContinue()}>
                    Skip for now
                </button>
                <button
                    ref={ctaRef}
                    onClick={() => void handleContinue()}
                    disabled={saving}
                    onMouseDown={() => ctaRef.current && Micro.buttonPress(ctaRef.current)}
                    onMouseUp={() => ctaRef.current && Micro.buttonRelease(ctaRef.current)}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #0F6E56, #1DB98A)", color: "#fff", boxShadow: "0 4px 20px rgba(15,110,86,0.35)", fontFamily: "var(--font-sans)" }}
                >
                    {saving ? "Saving…" : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
