"use client";

import { useState, useRef } from "react";
import { useToast } from "@novabots/ui";
import { ArrowRight, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { Micro } from "@/animations/utils/micro-interactions";

type Tab = "upload" | "sample" | "test";

const EXTRACTIONS = [
    "Deliverables list",
    "Revision round limits",
    "Timeline milestones",
    "Explicit exclusions",
    "Payment terms",
];

export function ScopeGuardSetup() {
    const [tab, setTab] = useState<Tab>("upload");
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const [analyzed, setAnalyzed] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [saving, setSaving] = useState(false);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

    const handleAnalyze = () => {
        if (!message.trim()) return;
        setAnalyzing(true);
        setTimeout(() => { setAnalyzing(false); setAnalyzed(true); }, 1200);
    };

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

    const tabs: { id: Tab; label: string }[] = [
        { id: "upload", label: "Upload SOW" },
        { id: "sample", label: "Try sample" },
        { id: "test", label: "Test detection" },
    ];

    return (
        <div className="ob-sg-root space-y-6">
            <div className="ob-sg-heading space-y-2">
                <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "#0F6E56", fontFamily: "var(--font-mono)" }}>
                    Step 4 of 6 · Scope Guard
                </p>
                <h2 className="text-3xl font-bold leading-tight" style={{ color: "#F4F1EC", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                    Upload your SOW.
                    <br />
                    Scope monitoring begins now.
                </h2>
                <p className="text-sm" style={{ color: "rgba(244,241,236,0.5)" }}>
                    From this point, ScopeIQ monitors every client message against what you&apos;ve contracted to deliver.
                </p>
            </div>

            {/* Tab switcher */}
            <div className="ob-sg-tabs flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className="flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-150"
                        style={{
                            background: tab === t.id ? "rgba(15,110,86,0.2)" : "transparent",
                            color: tab === t.id ? "#1DB98A" : "rgba(244,241,236,0.4)",
                            border: tab === t.id ? "1px solid rgba(15,110,86,0.35)" : "1px solid transparent",
                            fontFamily: "var(--font-sans)",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="ob-sg-content min-h-[200px]">
                {tab === "upload" && (
                    <div className="space-y-4">
                        {file ? (
                            <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "rgba(15,110,86,0.08)", borderColor: "rgba(15,110,86,0.3)" }}>
                                <CheckCircle className="h-4 w-4" style={{ color: "#0F6E56" }} />
                                <span className="text-sm flex-1 truncate" style={{ color: "#F4F1EC" }}>{file.name}</span>
                            </div>
                        ) : (
                            <div
                                className="rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all duration-200"
                                style={{
                                    borderColor: dragOver ? "rgba(15,110,86,0.5)" : "rgba(255,255,255,0.1)",
                                    background: dragOver ? "rgba(15,110,86,0.06)" : "rgba(255,255,255,0.02)",
                                }}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                                onClick={() => fileRef.current?.click()}
                            >
                                <Upload className="h-7 w-7 mx-auto mb-3" style={{ color: "rgba(244,241,236,0.2)" }} />
                                <p className="text-sm font-medium" style={{ color: "rgba(244,241,236,0.5)" }}>
                                    Drag & drop your SOW or <span style={{ color: "#0F6E56" }}>browse</span>
                                </p>
                                <p className="text-xs mt-1" style={{ color: "rgba(244,241,236,0.2)" }}>PDF or plain text</p>
                                <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                            </div>
                        )}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(244,241,236,0.3)", fontFamily: "var(--font-mono)" }}>
                                What we extract automatically
                            </p>
                            <div className="space-y-1.5">
                                {EXTRACTIONS.map((item) => (
                                    <div key={item} className="flex items-center gap-2">
                                        <span style={{ color: "#0F6E56" }}>✓</span>
                                        <span className="text-sm" style={{ color: "rgba(244,241,236,0.55)" }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === "sample" && (
                    <div className="space-y-4 text-center py-4">
                        <div className="rounded-2xl border p-6" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                            <p className="text-4xl mb-3">📄</p>
                            <p className="text-sm font-semibold" style={{ color: "#F4F1EC" }}>Brand Identity Project SOW</p>
                            <p className="text-xs mt-1" style={{ color: "rgba(244,241,236,0.4)" }}>Pre-populated with realistic agency contract language</p>
                            <button
                                className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200"
                                style={{ background: "rgba(15,110,86,0.2)", color: "#1DB98A", border: "1px solid rgba(15,110,86,0.35)" }}
                            >
                                Use sample SOW <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-xs" style={{ color: "rgba(244,241,236,0.3)" }}>Explore the feature without your own documents</p>
                    </div>
                )}

                {tab === "test" && (
                    <div className="space-y-4">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={'e.g. "Hey, can we also get social media templates in Canva? We\'d need about 10 formats…"'}
                            rows={4}
                            className="w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none transition-all duration-200"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#F4F1EC",
                                fontFamily: "var(--font-sans)",
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(15,110,86,0.5)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={!message.trim() || analyzing}
                            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-40"
                            style={{ background: "rgba(15,110,86,0.2)", color: "#1DB98A", border: "1px solid rgba(15,110,86,0.3)" }}
                        >
                            {analyzing ? "Analyzing…" : "Analyze Message →"}
                        </button>
                        {analyzed && (
                            <div
                                className="rounded-xl border p-4 space-y-2"
                                style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }}
                            >
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: "#F87171" }} />
                                    <span className="text-sm font-semibold" style={{ color: "#F87171" }}>SCOPE FLAG DETECTED</span>
                                    <span className="ml-auto rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(239,68,68,0.15)", color: "#F87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                                        Out of scope
                                    </span>
                                </div>
                                <p className="text-sm" style={{ color: "rgba(244,241,236,0.7)" }}>
                                    <strong style={{ color: "#F4F1EC" }}>Social media templates (Canva)</strong> — flagged against Section 3.1 of the SOW. A change order is ready to generate.
                                </p>
                                <p className="text-xs" style={{ color: "rgba(244,241,236,0.35)" }}>
                                    This is how ScopeIQ confirms a deviation.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="ob-sg-cta flex items-center justify-between">
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
