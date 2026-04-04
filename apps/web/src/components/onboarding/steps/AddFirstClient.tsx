"use client";

import { useState } from "react";
import { Button, Input, useToast } from "@novabots/ui";
import { Users, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function AddFirstClient() {
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

    const handleContinue = async () => {
        if (!clientName.trim()) return;
        setSaving(true);
        try {
            await apiClient.post("/v1/clients", {
                name: clientName.trim(),
                email: clientEmail.trim() || undefined,
            });
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "first_client",
                complete: true,
            });
            await hydrateWorkspace();
        } catch {
            toast("error", "Failed to add client");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
                    Add your first client
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    You&apos;ll organize projects under each client.
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                        Client Name
                    </label>
                    <Input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Nike, Spotify"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                        Client Email <span className="text-[rgb(var(--text-muted))]">(optional)</span>
                    </label>
                    <Input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@company.com"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={() => void handleContinue()} disabled={!clientName.trim() || saving}>
                    {saving ? "Saving..." : "Continue"}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
