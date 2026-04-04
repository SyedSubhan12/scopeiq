"use client";

import { useState, useEffect } from "react";
import { Button, Input, Skeleton, useToast } from "@novabots/ui";
import { FolderKanban, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";

interface Client {
    id: string;
    name: string;
}

export function CreateFirstProject() {
    const [projectName, setProjectName] = useState("");
    const [clientId, setClientId] = useState("");
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await apiClient.get<{ data: Client[] }>("/v1/clients");
                setClients(res.data);
                if (res.data.length > 0 && res.data[0]) {
                    setClientId(res.data[0].id);
                }
            } catch {
                // Silent — will show empty state
            } finally {
                setLoadingClients(false);
            }
        };
        void fetchClients();
    }, []);

    const handleContinue = async () => {
        if (!projectName.trim() || !clientId) return;
        setSaving(true);
        try {
            await apiClient.post("/v1/projects", {
                name: projectName.trim(),
                clientId,
            });
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "first_project",
                complete: true,
            });
            await hydrateWorkspace();
        } catch {
            toast("error", "Failed to create project");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
                    <FolderKanban className="h-6 w-6 text-violet-600" />
                </div>
                <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
                    Create your first project
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Projects hold deliverables, briefs, and approvals.
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                        Project Name
                    </label>
                    <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Brand Refresh Q2"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                        Client
                    </label>
                    {loadingClients ? (
                        <Skeleton className="h-10 w-full" />
                    ) : (
                        <select
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={() => void handleContinue()}
                    disabled={!projectName.trim() || !clientId || saving}
                >
                    {saving ? "Saving..." : "Continue"}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
