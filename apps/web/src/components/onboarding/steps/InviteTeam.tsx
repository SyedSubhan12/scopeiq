"use client";

import { useState, useRef } from "react";
import { useToast } from "@novabots/ui";
import { ArrowRight, Plus, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useOnboardingContext } from "@/components/onboarding/OnboardingContext";
import { Micro } from "@/animations/utils/micro-interactions";

type Role = "admin" | "member" | "viewer";
interface Teammate { name: string; email: string; role: Role }

const ROLE_STYLES: Record<Role, { bg: string; text: string; border: string }> = {
    admin: { bg: "rgba(15,110,86,0.15)", text: "#1DB98A", border: "rgba(15,110,86,0.35)" },
    member: { bg: "rgba(59,130,246,0.12)", text: "#93C5FD", border: "rgba(59,130,246,0.3)" },
    viewer: { bg: "rgba(255,255,255,0.06)", text: "rgba(244,241,236,0.45)", border: "rgba(255,255,255,0.1)" },
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
    admin: "Full access: all projects, billing, settings",
    member: "Access to assigned projects only",
    viewer: "Read-only access to projects they're added to",
};

export function InviteTeam() {
    const [teammates, setTeammates] = useState<Teammate[]>([{ name: "", email: "", role: "member" }]);
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const { persona } = useOnboardingContext();

    const isSolo = persona === "solo";
    const isAgency = persona === "agency";

    const updateTeammate = (i: number, field: keyof Teammate, val: string) => {
        setTeammates((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
    };

    const handleContinue = async () => {
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me/onboarding", { step: "team_invited", complete: true });
            await hydrateWorkspace();
        } catch (err) {
            toast("error", err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ob-invite-root space-y-8">
            <div className="ob-invite-heading space-y-2">
                <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "#0F6E56", fontFamily: "var(--font-mono)" }}>
                    Step 5 of 6 · Optional
                </p>
                <h2 className="text-3xl font-bold leading-tight" style={{ color: "#F4F1EC", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                    Who else should
                    <br />
                    have access?
                </h2>
            </div>

            {/* Team invite section — hidden for solo */}
            {!isSolo && (
                <div className="ob-invite-team-section space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(244,241,236,0.3)", fontFamily: "var(--font-mono)" }}>
                            Invite your team
                        </p>
                        {isAgency && (
                            <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "rgba(15,110,86,0.12)", color: "#0F6E56", border: "1px solid rgba(15,110,86,0.25)" }}>
                                Enterprise SSO available
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {teammates.map((t, i) => (
                            <div key={i} className="flex gap-2 items-start">
                                <input
                                    value={t.name}
                                    onChange={(e) => updateTeammate(i, "name", e.target.value)}
                                    placeholder="Name (optional)"
                                    className="w-28 rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F1EC" }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(15,110,86,0.45)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                                />
                                <input
                                    value={t.email}
                                    onChange={(e) => updateTeammate(i, "email", e.target.value)}
                                    placeholder="Email address"
                                    type="email"
                                    className="flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F1EC" }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(15,110,86,0.45)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                                />
                                <select
                                    value={t.role}
                                    onChange={(e) => updateTeammate(i, "role", e.target.value as Role)}
                                    className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F1EC" }}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                                {teammates.length > 1 && (
                                    <button onClick={() => setTeammates((p) => p.filter((_, idx) => idx !== i))} className="p-2.5 rounded-xl" style={{ color: "rgba(244,241,236,0.3)" }}>
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Role key */}
                    <div className="flex gap-3 flex-wrap">
                        {(["admin", "member", "viewer"] as Role[]).map((r) => (
                            <div key={r} className="flex items-center gap-1.5">
                                <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: ROLE_STYLES[r].bg, color: ROLE_STYLES[r].text, border: `1px solid ${ROLE_STYLES[r].border}` }}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </span>
                                <span className="text-xs" style={{ color: "rgba(244,241,236,0.3)" }}>{ROLE_DESCRIPTIONS[r]}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setTeammates((p) => [...p, { name: "", email: "", role: "member" }])}
                        className="inline-flex items-center gap-1.5 text-sm"
                        style={{ color: "#0F6E56" }}
                    >
                        <Plus className="h-3.5 w-3.5" /> Add another teammate
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 pt-2">
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(244,241,236,0.2)", fontFamily: "var(--font-mono)" }}>CLIENT</span>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </div>
                </div>
            )}

            {/* Client section */}
            <div className="ob-invite-client-section space-y-4">
                {isSolo && (
                    <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(244,241,236,0.3)", fontFamily: "var(--font-mono)" }}>
                        Add your first client
                    </p>
                )}
                <div className="space-y-3">
                    <input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Client or company name"
                        className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-150"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F1EC", fontFamily: "var(--font-sans)" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(15,110,86,0.45)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                    />
                    <input
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="Client email (optional — for portal access)"
                        type="email"
                        className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-150"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F1EC", fontFamily: "var(--font-sans)" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(15,110,86,0.45)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                    />
                </div>
            </div>

            {/* CTA */}
            <div className="ob-invite-cta flex items-center justify-between">
                <button className="text-xs" style={{ color: "rgba(244,241,236,0.3)" }} onClick={() => void handleContinue()}>
                    Skip — I&apos;ll add later
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
