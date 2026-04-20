"use client";

import { useState, useRef } from "react";
import { useToast } from "@novabots/ui";
import { ArrowRight, Upload, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { Micro } from "@/animations/utils/micro-interactions";

const PRESET_COLORS = [
    "#0F6E56", "#1D4ED8", "#7C3AED", "#DB2777",
    "#EA580C", "#CA8A04", "#16A34A", "#0891B2",
];

function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function WorkspaceSetup() {
    const [name, setName] = useState("");
    const [brandColor, setBrandColor] = useState("#0F6E56");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

    const slug = slugify(name);

    const handleFile = (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            toast("error", "Logo must be under 2MB");
            return;
        }
        setLogoFile(file);
    };

    const handleContinue = async () => {
        if (!name.trim() || saving) return;
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me", { name: name.trim(), brandColor });
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "workspace_configured",
                complete: true,
            });
            await hydrateWorkspace();
        } catch (err) {
            toast("error", err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ob-ws-root space-y-8">
            {/* Heading */}
            <div className="ob-ws-heading space-y-2">
                <p
                    className="text-xs font-medium tracking-[0.2em] uppercase"
                    style={{ color: "#0F6E56", fontFamily: "var(--font-mono)" }}
                >
                    Step 2 of 6
                </p>
                <h2
                    className="text-3xl font-bold leading-tight"
                    style={{ color: "#F4F1EC", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                    Set up your workspace
                </h2>
                <p className="text-sm" style={{ color: "rgba(244,241,236,0.5)" }}>
                    Your agency&apos;s home on ScopeIQ. You can change everything later.
                </p>
            </div>

            {/* Workspace name */}
            <div className="ob-ws-name-field space-y-2">
                <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(244,241,236,0.35)", fontFamily: "var(--font-mono)" }}>
                    Agency / Practice name
                </label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleContinue()}
                    placeholder="e.g. Acme Creative Studio"
                    autoFocus
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200"
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#F4F1EC",
                        fontFamily: "var(--font-sans)",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(15,110,86,0.6)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
                {slug && (
                    <p className="text-xs" style={{ color: "rgba(244,241,236,0.3)", fontFamily: "var(--font-mono)" }}>
                        Your workspace URL:{" "}
                        <span style={{ color: "#0F6E56" }}>{slug}.scopeiq.com</span>
                    </p>
                )}
            </div>

            {/* Brand color */}
            <div className="ob-ws-color-row space-y-2">
                <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(244,241,236,0.35)", fontFamily: "var(--font-mono)" }}>
                    Brand color <span style={{ color: "rgba(244,241,236,0.2)" }}>· Optional</span>
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => setBrandColor(c)}
                            className="h-7 w-7 rounded-full transition-transform duration-150 hover:scale-110"
                            style={{
                                background: c,
                                outline: brandColor === c ? `2px solid #fff` : "none",
                                outlineOffset: "2px",
                            }}
                            aria-label={`Select color ${c}`}
                        />
                    ))}
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                            <input
                                type="color"
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                className="h-10 w-10 -ml-1.5 -mt-1.5 cursor-pointer"
                            />
                        </div>
                        <span className="text-xs" style={{ color: "rgba(244,241,236,0.35)", fontFamily: "var(--font-mono)" }}>
                            {brandColor.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Logo upload */}
            <div className="ob-ws-logo-zone space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(244,241,236,0.35)", fontFamily: "var(--font-mono)" }}>
                        Logo <span style={{ color: "rgba(244,241,236,0.2)" }}>· Optional</span>
                    </label>
                    {!logoFile && (
                        <button
                            className="text-xs"
                            style={{ color: "rgba(244,241,236,0.3)" }}
                            onClick={() => { /* skip is implicit */ }}
                        >
                            Skip for now
                        </button>
                    )}
                </div>

                {logoFile ? (
                    <div
                        className="flex items-center gap-3 rounded-xl border px-4 py-3"
                        style={{ background: "rgba(15,110,86,0.08)", borderColor: "rgba(15,110,86,0.3)" }}
                    >
                        <Upload className="h-4 w-4" style={{ color: "#0F6E56" }} />
                        <span className="text-sm flex-1 truncate" style={{ color: "#F4F1EC" }}>{logoFile.name}</span>
                        <button onClick={() => setLogoFile(null)}>
                            <X className="h-4 w-4" style={{ color: "rgba(244,241,236,0.4)" }} />
                        </button>
                    </div>
                ) : (
                    <div
                        className="rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-all duration-200"
                        style={{
                            borderColor: dragOver ? "rgba(15,110,86,0.5)" : "rgba(255,255,255,0.1)",
                            background: dragOver ? "rgba(15,110,86,0.06)" : "rgba(255,255,255,0.02)",
                        }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            const f = e.dataTransfer.files[0];
                            if (f) handleFile(f);
                        }}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload className="h-6 w-6 mx-auto mb-2" style={{ color: "rgba(244,241,236,0.25)" }} />
                        <p className="text-sm" style={{ color: "rgba(244,241,236,0.4)" }}>
                            Drag & drop or <span style={{ color: "#0F6E56" }}>browse</span>
                        </p>
                        <p className="text-xs mt-1" style={{ color: "rgba(244,241,236,0.2)" }}>
                            PNG, SVG, JPG — up to 2MB
                        </p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".png,.svg,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="ob-ws-cta flex justify-end">
                <button
                    ref={ctaRef}
                    onClick={() => void handleContinue()}
                    disabled={!name.trim() || saving}
                    onMouseDown={() => ctaRef.current && Micro.buttonPress(ctaRef.current)}
                    onMouseUp={() => ctaRef.current && Micro.buttonRelease(ctaRef.current)}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                        background: name.trim() ? "linear-gradient(135deg, #0F6E56, #1DB98A)" : "rgba(255,255,255,0.06)",
                        color: name.trim() ? "#fff" : "rgba(244,241,236,0.3)",
                        boxShadow: name.trim() ? "0 4px 20px rgba(15,110,86,0.35)" : "none",
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
