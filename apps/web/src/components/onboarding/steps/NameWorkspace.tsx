"use client";

import { useRef } from "react";
import { Button, Input, useToast } from "@novabots/ui";
import { Building, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useState } from "react";
import { Micro } from "@/animations/utils/micro-interactions";

export function NameWorkspace() {
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const ctaRef = useRef<HTMLButtonElement>(null);

    const handleContinue = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me", { name: name.trim() });
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "workspace_named",
                complete: true,
            });
            await hydrateWorkspace();
        } catch (err) {
            console.error("[NameWorkspace] save failed:", err);
            const msg = err instanceof Error ? err.message : "Failed to save workspace name";
            toast("error", msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Icon — targeted by welcome.timeline.ts as .ob-welcome-icon */}
            <div className="text-center">
                <div className="ob-welcome-icon mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-sm shadow-primary/10">
                    <Building className="h-7 w-7 text-primary" />
                </div>
                <h2 className="ob-welcome-heading text-2xl font-bold text-[rgb(var(--text-primary))] tracking-tight">
                    Name your workspace
                </h2>
                <p className="ob-welcome-sub mt-2 text-sm text-[rgb(var(--text-muted))]">
                    This is your agency&apos;s home on ScopeIQ.{" "}
                    <span className="font-medium text-[rgb(var(--text-primary))]">
                        Clients will see this name.
                    </span>
                </p>
            </div>

            {/* Input — targeted as .ob-welcome-field */}
            <div className="ob-welcome-field">
                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                    Workspace Name
                </label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleContinue()}
                    placeholder="e.g. Acme Creative Studio"
                    autoFocus
                    className="transition-shadow duration-200"
                />
            </div>

            {/* CTA — targeted as .ob-welcome-cta */}
            <div className="ob-welcome-cta flex justify-end">
                <button
                    ref={ctaRef}
                    onClick={() => void handleContinue()}
                    disabled={!name.trim() || saving}
                    onMouseDown={() => ctaRef.current && Micro.buttonPress(ctaRef.current)}
                    onMouseUp={() => ctaRef.current && Micro.buttonRelease(ctaRef.current)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ position: "relative", overflow: "hidden" }}
                >
                    {saving ? "Saving…" : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
