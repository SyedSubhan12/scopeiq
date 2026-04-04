"use client";

import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalDeliverableView } from "@/components/portal/PortalDeliverableView";
import { Skeleton } from "@novabots/ui";
import { AlertCircle } from "lucide-react";

function PortalContent() {
    const session = usePortalSession();

    if (session.loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-12">
                <Skeleton className="mb-4 h-16 w-full" />
                <Skeleton className="mb-2 h-8 w-64" />
                <div className="mt-6 space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }

    if (session.error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                        Portal Unavailable
                    </h2>
                    <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                        {session.error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PortalHeader
                workspaceName={session.workspace.name}
                logoUrl={session.workspace.logoUrl}
                brandColor={session.workspace.brandColor}
                projectName={session.project.name}
                clientName={session.project.clientName}
            />

            <main className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
                        Deliverables
                    </h2>
                    {session.project.description && (
                        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                            {session.project.description}
                        </p>
                    )}
                </div>

                {session.deliverables.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[rgb(var(--border-default))] bg-white p-12 text-center">
                        <p className="text-sm text-[rgb(var(--text-muted))]">
                            No deliverables yet. Your agency will share them here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {session.deliverables.map((d) => (
                            <PortalDeliverableView
                                key={d.id}
                                deliverable={d}
                                portalToken={session.token}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function PortalPage({
    params,
}: {
    params: { portalToken: string };
}) {
    return (
        <PortalSessionProvider portalToken={params.portalToken}>
            <PortalContent />
        </PortalSessionProvider>
    );
}
