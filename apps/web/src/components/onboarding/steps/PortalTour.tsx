"use client";

import { useState, useEffect } from "react";
import { Button, useToast } from "@novabots/ui";
import { ExternalLink, Copy, Check, Rocket } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";

export function PortalTour() {
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [portalUrl, setPortalUrl] = useState<string | null>(null);
    const { toast } = useToast();
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);

    // Fetch user's first project to get a real portal token
    useEffect(() => {
        const fetchPortalUrl = async () => {
            try {
                const res = await apiClient.get<{ data: Array<{ portalToken?: string }> }>(
                    "/v1/projects?limit=1",
                );
                const project = res.data?.[0];
                if (project?.portalToken) {
                    const base = typeof window !== "undefined" ? window.location.origin : "";
                    setPortalUrl(`${base}/portal/${project.portalToken}`);
                }
            } catch {
                // Silent — use generic format
            }
        };
        void fetchPortalUrl();
    }, []);

    const handleFinish = async () => {
        setSaving(true);
        try {
            await apiClient.patch("/v1/workspaces/me/onboarding", {
                step: "portal_tour",
                complete: true,
            });
            await hydrateWorkspace();
            // auth-provider redirects to /dashboard
        } catch {
            toast("error", "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const handleCopy = () => {
        const url = portalUrl ?? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/<token>`;
        void navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                    <ExternalLink className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
                    The Client Portal
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                    Share deliverables with clients — no login required.
                </p>
            </div>

            <div className="space-y-4 rounded-lg border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] p-5">
                {[
                    {
                        n: 1,
                        title: "Upload deliverables to a project",
                        body: "Add design files, videos, or links under any project.",
                    },
                    {
                        n: 2,
                        title: "Copy the portal link",
                        body: "Each project has a unique portal link. Find it in project settings.",
                    },
                    {
                        n: 3,
                        title: "Client reviews & approves",
                        body: "Clients annotate, leave feedback, and approve — no account needed.",
                    },
                ].map(({ n, title, body }) => (
                    <div key={n} className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {n}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{title}</p>
                            <p className="text-xs text-[rgb(var(--text-muted))]">{body}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Real portal link (or format placeholder) */}
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[rgb(var(--border-default))] bg-white p-3">
                <code className="flex-1 truncate text-xs text-[rgb(var(--text-muted))]">
                    {portalUrl ?? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/<your-token>`}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                {portalUrl && (
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </a>
                )}
            </div>

            {portalUrl && (
                <p className="text-center text-xs text-[rgb(var(--text-muted))]">
                    This is your first project&apos;s portal link. Share it with your client.
                </p>
            )}

            <div className="flex justify-end">
                <Button onClick={() => void handleFinish()} disabled={saving}>
                    {saving ? "Finishing..." : "Go to Dashboard"}
                    <Rocket className="ml-1.5 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
