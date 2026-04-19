"use client";

import { useRef, useState, useCallback } from "react";
import { useToast } from "@novabots/ui";
import { Palette, Code2, Video, PenLine, Lightbulb, Camera, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { Micro } from "@/animations/utils/micro-interactions";
import { motion } from "framer-motion";

const SERVICE_TYPES = [
    { id: "brand_design", label: "Brand Design", tagline: "Logos, identity systems, brand guidelines", icon: Palette, color: "bg-purple-50 text-purple-600" },
    { id: "web_design_dev", label: "Web Design / Dev", tagline: "Websites, landing pages, web apps", icon: Code2, color: "bg-blue-50 text-blue-600" },
    { id: "video_production", label: "Video Production", tagline: "Commercials, reels, motion graphics", icon: Video, color: "bg-red-50 text-red-600" },
    { id: "copywriting", label: "Copywriting", tagline: "Website copy, ads, content strategy", icon: PenLine, color: "bg-amber-50 text-amber-600" },
    { id: "strategy", label: "Strategy / Consulting", tagline: "Brand strategy, growth, workshops", icon: Lightbulb, color: "bg-emerald-50 text-emerald-600" },
    { id: "photography_other", label: "Photography / Other", tagline: "Product, editorial, or any creative work", icon: Camera, color: "bg-sky-50 text-sky-600" },
] as const;

type ServiceTypeId = (typeof SERVICE_TYPES)[number]["id"];

// --- Sub-component so each card owns its own ref (respects Rules of Hooks) ---
interface CardProps {
    type: (typeof SERVICE_TYPES)[number];
    isSelected: boolean;
    onSelect: (id: ServiceTypeId, el: HTMLButtonElement) => void;
}

function ServiceCard({ type, isSelected, onSelect }: CardProps) {
    const Icon = type.icon;
    const cardRef = useRef<HTMLButtonElement>(null);

    return (
        <button
            ref={cardRef}
            onClick={() => cardRef.current && onSelect(type.id, cardRef.current)}
            onMouseEnter={() => cardRef.current && Micro.cardPress(cardRef.current)}
            onMouseLeave={() => cardRef.current && Micro.cardRelease(cardRef.current)}
            className={[
                "ob-persona-card relative flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors duration-150",
                isSelected
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-[rgb(var(--border-default))] bg-white hover:border-primary/40 hover:bg-primary/[0.02]",
            ].join(" ")}
            style={{ willChange: "transform" }}
        >
            {isSelected && (
                <motion.div
                    layoutId="selected-dot"
                    className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
            )}
            <span className={`ob-persona-icon flex h-9 w-9 items-center justify-center rounded-xl ${type.color}`}>
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{type.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[rgb(var(--text-muted))]">{type.tagline}</p>
            </div>
        </button>
    );
}

// --- Main component ---
export function ServiceTypeSelector() {
    const [selected, setSelected] = useState<ServiceTypeId | null>(null);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const ctaRef = useRef<HTMLButtonElement>(null);

    const handleContinue = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            localStorage.setItem("scopeiq_service_type", selected);
            await apiClient.patch("/v1/workspaces/me/onboarding", { step: "service_type", complete: true });
            await hydrateWorkspace();
        } catch (err) {
            console.error("[ServiceTypeSelector] save failed:", err);
            toast("error", err instanceof Error ? err.message : "Failed to save service type");
        } finally {
            setSaving(false);
        }
    };

    const handleSelect = useCallback((id: ServiceTypeId, el: HTMLButtonElement) => {
        setSelected(id);
        Micro.cardSelect(el);
    }, []);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="ob-persona-heading text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
                    What type of work do you do?
                </h2>
                <p className="ob-persona-sub mt-2 text-sm text-[rgb(var(--text-muted))]">
                    We&apos;ll load the right brief template, SOW structure, and rate card defaults for you.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {SERVICE_TYPES.map((type) => (
                    <ServiceCard
                        key={type.id}
                        type={type}
                        isSelected={selected === type.id}
                        onSelect={handleSelect}
                    />
                ))}
            </div>

            <div className="flex justify-end pt-4">
                <button
                    ref={ctaRef}
                    onClick={() => void handleContinue()}
                    disabled={!selected || saving}
                    onMouseDown={() => ctaRef.current && Micro.buttonPress(ctaRef.current)}
                    onMouseUp={() => ctaRef.current && Micro.buttonRelease(ctaRef.current)}
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#0F6E56] px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#0F6E56]/20 transition-all hover:bg-[#0D5D48] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
                >
                    {saving ? "Saving…" : "Continue to Next Step"}
                    {!saving && (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                </button>
            </div>

        </div>
    );
}
