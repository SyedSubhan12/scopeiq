"use client";

import { useState, useRef } from "react";
import { useToast } from "@novabots/ui";
import { ArrowRight, Upload, Link, CheckCircle, Copy, Check } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { Micro } from "@/animations/utils/micro-interactions";

type SubStep = 0 | 1 | 2;

export function ApprovalPortalSetup() {
    const [subStep, setSubStep] = useState<SubStep>(0);
    const [projectName, setProjectName] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [deliverableType, setDeliverableType] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

    const fakePortalUrl = `app.scopeiq.com/review/${(projectName || "your-project").toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 7)}`;

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleContinue = async () => {
        if (subStep < 2) { setSubStep((s) => (s + 1) as SubStep); return; }
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

    const DELIVERY_OPTIONS = [
        { id: "file", icon: <Upload className="h-4 w-4" />, label: "Upload a file", sub: "Image, PDF, or video — up to 500MB" },
        { id: "figma", icon: <Link className="h-4 w-4" />, label: "Paste a Figma link", sub: "Figma design or prototype" },
        { id: "loom", icon: <Link className="h-4 w-4" />, label: "Paste a Loom link", sub: "Video walkthrough or recording" },
        { id: "skip", icon: <CheckCircle className="h-4 w-4" />, label: "Use sample deliverable", sub: "Explore the feature with demo content" },
    ];

    return (
        <div className="ob-ap-root space-y-6">
            {/* Heading */}
            <div className="ob-ap-heading space-y-2">
                <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "#0F6E56", fontFamily: "var(--font-mono)" }}>
                    Step 4 of 6 · Approval Portal
                </p>
                <h2 className="text-3xl font-bold leading-tight" style={{ color: "#F4F1EC", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                    Create your first client
                    <br />
                    review experience
                </h2>

                {/* Sub-step progress dots */}
                <div className="flex items-center gap-2 pt-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="transition-all duration-300"
                            style={{
                                width: subStep === i ? "20px" : "6px",
                                height: "6px",
                                borderRadius: "3px",
                                background: i <= subStep ? "#0F6E56" : "rgba(255,255,255,0.12)",
                            }}
                        />
                    ))}
                    <span className="text-xs ml-1" style={{ color: "rgba(244,241,236,0.35)", fontFamily: "var(--font-mono)" }}>
                        {subStep === 0 ? "Project details" : subStep === 1 ? "Add deliverable" : "Preview portal"}
                    </span>
                </div>
            </div>

            {/* Sub-step content */}
            <div className="ob-ap-form">
                {subStep === 0 && (
                    <div className="space-y-4">
                        {[
                            { label: "Project name", value: projectName, set: setProjectName, placeholder: "e.g. Acme Corp — Brand Identity" },
                            { label: "Client name", value: clientName, set: setClientName, placeholder: "e.g. Acme Corp" },
                            { label: "Client email", value: clientEmail, set: setClientEmail, placeholder: "hello@acmecorp.com (optional)" },
                        ].map(({ label, value, set, placeholder }) => (
                            <div key={label} className="space-y-1.5">
                                <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(244,241,236,0.35)", fontFamily: "var(--font-mono)" }}>
                                    {label}
                                </label>
                                <input
                                    value={value}
                                    onChange={(e) => set(e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F1EC", fontFamily: "var(--font-sans)" }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(15,110,86,0.5)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {subStep === 1 && (
                    <div className="ob-ap-options space-y-3">
                        {DELIVERY_OPTIONS.map((opt) => (
                            <div
                                key={opt.id}
                                className="flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-150"
                                style={{
                                    background: deliverableType === opt.id ? "rgba(15,110,86,0.1)" : "rgba(255,255,255,0.02)",
                                    borderColor: deliverableType === opt.id ? "rgba(15,110,86,0.45)" : "rgba(255,255,255,0.08)",
                                }}
                                onClick={() => setDeliverableType(opt.id)}
                            >
                                <span style={{ color: deliverableType === opt.id ? "#0F6E56" : "rgba(244,241,236,0.3)" }}>{opt.icon}</span>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: "#F4F1EC" }}>{opt.label}</p>
                                    <p className="text-xs" style={{ color: "rgba(244,241,236,0.35)" }}>{opt.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {subStep === 2 && (
                    <div className="ob-ap-preview space-y-4">
                        {/* Mock portal preview */}
                        <div
                            className="rounded-2xl border overflow-hidden"
                            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
                        >
                            {/* Fake URL bar */}
                            <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                                <div className="flex gap-1.5">
                                    {["#F87171", "#FBBF24", "#34D399"].map((c) => (
                                        <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                                    ))}
                                </div>
                                <div className="flex-1 rounded-md px-3 py-1 text-xs text-center" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(244,241,236,0.3)", fontFamily: "var(--font-mono)" }}>
                                    {fakePortalUrl}
                                </div>
                            </div>
                            {/* Portal body mockup */}
                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg" style={{ background: "rgba(15,110,86,0.3)", border: "1px solid rgba(15,110,86,0.4)" }} />
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: "#F4F1EC" }}>{projectName || "Your Project"}</p>
                                        <p className="text-xs" style={{ color: "rgba(244,241,236,0.35)" }}>Awaiting review</p>
                                    </div>
                                </div>
                                <div className="rounded-xl aspect-video" style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                                    <div className="flex items-center justify-center h-full">
                                        <span className="text-xs" style={{ color: "rgba(244,241,236,0.2)" }}>Deliverable preview</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-center" style={{ color: "rgba(244,241,236,0.5)" }}>
                            This is the link your client will see. Copy it and send it.
                        </p>
                        <button
                            onClick={handleCopy}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200"
                            style={{
                                background: copied ? "rgba(15,110,86,0.2)" : "rgba(255,255,255,0.06)",
                                border: "1px solid " + (copied ? "rgba(15,110,86,0.4)" : "rgba(255,255,255,0.1)"),
                                color: copied ? "#1DB98A" : "#F4F1EC",
                            }}
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : "Copy Client Portal Link"}
                        </button>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between">
                <button className="text-xs" style={{ color: "rgba(244,241,236,0.3)" }} onClick={() => void handleContinue()}>
                    {subStep < 2 ? "Skip this step" : "Skip for now"}
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
                    {saving ? "Saving…" : subStep < 2 ? "Next" : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
