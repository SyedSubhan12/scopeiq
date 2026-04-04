"use client";

import { useState } from "react";
import { Button, Input, useToast } from "@novabots/ui";
import { FileText, ArrowRight, SkipForward } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function CreateBriefTemplate() {
    const [templateName, setTemplateName] = useState("");
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

    const markStep = async () => {
        await apiClient.patch("/v1/workspaces/me/onboarding", {
            step: "brief_template",
            complete: true,
        });
        await hydrateWorkspace();
    };

    const handleCreate = async () => {
        if (!templateName.trim()) return;
        setSaving(true);
        try {
            await apiClient.post("/v1/brief-templates", {
                name: templateName.trim(),
                fieldsJson: [],
            });
            await markStep();
        } catch {
            toast("error", "Failed to create template");
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        setSaving(true);
        try {
            await markStep();
        } catch {
            toast("error", "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                    <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
                    Create a brief template
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Templates standardize client onboarding. You can customize fields later.
                </p>
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                    Template Name
                </label>
                <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Web Design Brief, Brand Strategy Brief"
                    autoFocus
                />
            </div>

            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => void handleSkip()}
                    disabled={saving}
                >
                    <SkipForward className="mr-1.5 h-4 w-4" />
                    Skip for now
                </Button>
                <Button
                    onClick={() => void handleCreate()}
                    disabled={!templateName.trim() || saving}
                >
                    {saving ? "Saving..." : "Create & Continue"}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
