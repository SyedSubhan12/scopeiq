"use client";

import { useState } from "react";
import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalDeliverableView } from "@/components/portal/PortalDeliverableView";
import type { Deliverable } from "@/hooks/useDeliverables";
import { IntakeForm } from "@/components/portal/IntakeForm";
import { ChangeOrderView } from "@/components/portal/ChangeOrderView";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Skeleton } from "@novabots/ui";
import { AlertCircle, FileText, CheckSquare, FileSignature } from "lucide-react";
import { cn } from "@novabots/ui";

type TabKey = "brief" | "review" | "change-orders";

function PortalTabs({
    active,
    onChange,
    showBrief,
    showChangeOrders,
    changeOrderCount,
    brandColor,
}: {
    active: TabKey;
    onChange: (tab: TabKey) => void;
    showBrief: boolean;
    showChangeOrders: boolean;
    changeOrderCount: number;
    brandColor: string;
}) {
    const tabs = [
        ...(showBrief ? [{ key: "brief" as TabKey, label: "Brief", icon: FileText }] : []),
        { key: "review" as TabKey, label: "Review Work", icon: CheckSquare },
        ...(showChangeOrders ? [{
            key: "change-orders" as TabKey,
            label: `Change Orders${changeOrderCount > 0 ? ` (${changeOrderCount})` : ""}`,
            icon: FileSignature,
        }] : []),
    ];

    return (
        <div className="flex gap-1 border-b border-[rgb(var(--border-default))]">
            {tabs.map(({ key, label, icon: Icon }) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
                        active === key
                            ? "text-[rgb(var(--text-primary))]"
                            : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]",
                    )}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                    {active === key && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: brandColor }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}

function PortalContent() {
    const session = usePortalSession();
    const [activeTab, setActiveTab] = useState<TabKey | null>(null);

    if (session.loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-64" />
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
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-[rgb(var(--border-default))] max-w-md w-full">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
                        Link Invalid or Expired
                    </h2>
                    <p className="mt-2 text-sm text-[rgb(var(--text-muted))] leading-relaxed">
                        {session.error}. Please contact your agency for a new portal link.
                    </p>
                    <button
                        className="mt-6 w-full rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const { project, workspace, deliverables, pendingBrief, pendingChangeOrders } = session;
    const hasBrief = !!pendingBrief;
    const hasChangeOrders = pendingChangeOrders.length > 0;

    // Determine the active tab (default to brief if pending, else review)
    const tab: TabKey = activeTab ?? (hasBrief && deliverables.length === 0 ? "brief" : "review");

    return (
        <div className="min-h-screen" style={{ backgroundColor: `${workspace.brandColor}08` }}>
            <PortalHeader
                workspaceName={workspace.name}
                logoUrl={workspace.logoUrl}
                brandColor={workspace.brandColor}
                projectName={project.name}
                clientName={project.clientName}
            />

            <div className="mx-auto max-w-4xl px-4 pt-6">
                <PortalTabs
                    active={tab}
                    onChange={setActiveTab}
                    showBrief={hasBrief}
                    showChangeOrders={hasChangeOrders}
                    changeOrderCount={pendingChangeOrders.length}
                    brandColor={workspace.brandColor}
                />
            </div>

            <main className="mx-auto max-w-4xl px-4 py-8">
                {/* Brief Tab */}
                {tab === "brief" && pendingBrief && (
                    <IntakeForm
                        brief={pendingBrief}
                        projectId={project.id}
                        workspaceId={workspace.id}
                        onSuccess={() => setActiveTab("review")}
                    />
                )}

                {/* Review Work Tab */}
                {tab === "review" && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Review Work</h2>
                            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                                Approve or request changes on each deliverable below.
                            </p>
                        </div>

                        {deliverables.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))]">
                                    <CheckSquare className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                                </div>
                                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                                    Nothing to review yet
                                </h3>
                                <p className="mt-1 text-sm text-[rgb(var(--text-muted))] max-w-xs mx-auto">
                                    Your agency will share deliverables here when work is ready for review.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {deliverables.map((d) => (
                                    <PortalDeliverableView
                                        key={d.id}
                                        deliverable={d as unknown as Deliverable}
                                        portalToken={session.token}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Change Orders Tab */}
                {tab === "change-orders" && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Change Orders</h2>
                            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                                Review and respond to additional work requests from your agency.
                            </p>
                        </div>
                        <div className="grid gap-6">
                            {pendingChangeOrders.map((co) => (
                                <ChangeOrderView
                                    key={co.id}
                                    changeOrder={co}
                                    portalToken={session.token}
                                    onResponded={() => window.location.reload()}
                                />
                            ))}
                        </div>
                    </>
                )}

                <PoweredByBadge plan={workspace.plan} />
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
