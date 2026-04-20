"use client";

import { useState, useRef } from "react";
import { useToast } from "@novabots/ui";
import { ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useOnboardingContext, type PersonaType, type ServiceType } from "@/components/onboarding/OnboardingContext";
import { Micro } from "@/animations/utils/micro-interactions";

const PERSONAS: { id: PersonaType; emoji: string; label: string; sub: string }[] = [
    { id: "solo", emoji: "🧑‍💻", label: "Solo freelancer", sub: "Just me — I manage my own clients" },
    { id: "studio", emoji: "🏠", label: "Small studio", sub: "2–10 people, shared client accounts" },
    { id: "agency", emoji: "🏢", label: "Agency", sub: "10+ people, multiple account managers" },
];

const SERVICES: { id: ServiceType; label: string }[] = [
    { id: "brand_identity", label: "Brand & visual identity" },
    { id: "web_design", label: "Web design & development" },
    { id: "social_media", label: "Social media & content" },
    { id: "motion_video", label: "Motion & video production" },
    { id: "ux_product", label: "UX / product design" },
    { id: "marketing_copy", label: "Marketing & copywriting" },
    { id: "other", label: "Other / multiple" },
];

const CARD = {
    base: "flex items-center gap-4 rounded-2xl border p-4 cursor-pointer transition-all duration-200",
    idle: "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(15,110,86,0.35)] hover:bg-[rgba(15,110,86,0.06)]",
    selected: "border-[rgba(15,110,86,0.6)] bg-[rgba(15,110,86,0.12)] shadow-[0_0_20px_rgba(15,110,86,0.15)]",
};

const PILL = {
    base: "px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all duration-150",
    idle: "border-[rgba(255,255,255,0.1)] text-[rgba(244,241,236,0.5)] hover:border-[rgba(15,110,86,0.4)] hover:text-[#F4F1EC]",
    selected: "border-[#0F6E56] bg-[rgba(15,110,86,0.2)] text-[#1DB98A]",
};

export function PersonaStep() {
    const [persona, setPersonaLocal] = useState<PersonaType | null>(null);
    const [serviceType, setServiceLocal] = useState<ServiceType | null>(null);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const ctaRef = useRef<HTMLButtonElement>(null);
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const { setPersona, setServiceType } = useOnboardingContext();

    const canContinue = persona !== null && serviceType !== null;

    const handleContinue = async () => {
        if (!canContinue || saving) return;
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "persona_selected",
                complete: true,
                metadata: { persona, serviceType },
            });
            setPersona(persona!);
            setServiceType(serviceType!);
            await hydrateWorkspace();
        } catch (err) {
            toast("error", err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ob-persona-root space-y-8">
            {/* Heading */}
            <div className="ob-persona-heading text-center space-y-2">
                <p
                    className="text-xs font-medium tracking-[0.2em] uppercase"
                    style={{ color: "#0F6E56", fontFamily: "var(--font-mono)" }}
                >
                    Step 1 of 6 · ~5 minutes
                </p>
                <h2
                    className="text-4xl font-bold leading-tight"
                    style={{ color: "#F4F1EC", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                    Welcome to ScopeIQ.
                    <br />
                    Let&apos;s set you up.
                </h2>
                <p
                    className="ob-persona-sub text-sm"
                    style={{ color: "rgba(244,241,236,0.5)", fontFamily: "var(--font-sans)" }}
                >
                    Tell us about your setup — we&apos;ll skip anything that doesn&apos;t apply to you.
                </p>
            </div>

            {/* Q1.1 — Persona cards */}
            <div className="ob-persona-cards space-y-3">
                <p
                    className="text-xs font-semibold tracking-widest uppercase"
                    style={{ color: "rgba(244,241,236,0.35)", fontFamily: "var(--font-mono)" }}
                >
                    How do you work?
                </p>
                {PERSONAS.map((p) => (
                    <div
                        key={p.id}
                        className={`${CARD.base} ${persona === p.id ? CARD.selected : CARD.idle}`}
                        onClick={() => setPersonaLocal(p.id)}
                        role="radio"
                        aria-checked={persona === p.id}
                    >
                        <span className="text-2xl">{p.emoji}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: "#F4F1EC" }}>
                                {p.label}
                            </p>
                            <p className="text-xs" style={{ color: "rgba(244,241,236,0.45)" }}>
                                {p.sub}
                            </p>
                        </div>
                        <div
                            className="h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                                borderColor: persona === p.id ? "#0F6E56" : "rgba(255,255,255,0.2)",
                                background: persona === p.id ? "#0F6E56" : "transparent",
                            }}
                        >
                            {persona === p.id && (
                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Q1.2 — Service type pills */}
            <div className="ob-service-pills space-y-3">
                <p
                    className="text-xs font-semibold tracking-widest uppercase"
                    style={{ color: "rgba(244,241,236,0.35)", fontFamily: "var(--font-mono)" }}
                >
                    What kind of creative work do you deliver?
                </p>
                <div className="flex flex-wrap gap-2">
                    {SERVICES.map((s) => (
                        <button
                            key={s.id}
                            className={`${PILL.base} ${serviceType === s.id ? PILL.selected : PILL.idle}`}
                            onClick={() => setServiceLocal(s.id)}
                            style={{ fontFamily: "var(--font-sans)" }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="ob-persona-cta flex justify-end">
                <button
                    ref={ctaRef}
                    onClick={() => void handleContinue()}
                    disabled={!canContinue || saving}
                    onMouseDown={() => ctaRef.current && Micro.buttonPress(ctaRef.current)}
                    onMouseUp={() => ctaRef.current && Micro.buttonRelease(ctaRef.current)}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                        background: canContinue ? "linear-gradient(135deg, #0F6E56, #1DB98A)" : "rgba(255,255,255,0.06)",
                        color: canContinue ? "#fff" : "rgba(244,241,236,0.3)",
                        boxShadow: canContinue ? "0 4px 20px rgba(15,110,86,0.35)" : "none",
                        fontFamily: "var(--font-sans)",
                    }}
                >
                    {saving ? "Saving…" : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
