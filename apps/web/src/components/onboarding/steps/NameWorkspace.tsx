"use client";

import { useState } from "react";
import { Button, Input, useToast } from "@novabots/ui";
import { Building, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function NameWorkspace() {
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

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
        } catch {
            toast("error", "Failed to save workspace name");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Building className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
                    Name your workspace
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    This is your agency&apos;s home on ScopeIQ. Clients will see this name.
                </p>
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                    Workspace Name
                </label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Creative Studio"
                    autoFocus
                />
            </div>

            <div className="flex justify-end">
                <Button onClick={() => void handleContinue()} disabled={!name.trim() || saving}>
                    {saving ? "Saving..." : "Continue"}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
