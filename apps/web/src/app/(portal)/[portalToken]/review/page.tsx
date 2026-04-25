"use client";

import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalDeliverableView } from "@/components/portal/PortalDeliverableView";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import type { Deliverable } from "@/hooks/useDeliverables";
import { Skeleton } from "@novabots/ui";
import { AlertCircle, CheckSquare, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

function ReviewPageContent() {
  const session = usePortalSession();

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

  const { project, workspace, deliverables, token } = session;

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${workspace.brandColor}08` }}>
      <PortalHeader
        workspaceName={workspace.name}
        logoUrl={workspace.logoUrl}
        brandColor={workspace.brandColor}
        projectName={project.name}
        clientName={project.clientName}
      />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Review Work</h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
              Approve or request changes on each deliverable below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${token}/messages`}
              className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <Link
              href={`/portal/${token}`}
              className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Portal
            </Link>
          </div>
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
                portalToken={token}
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <PoweredByBadge plan={workspace.plan} />
        </div>
      </main>
    </div>
  );
}

export default function ReviewPage({
  params,
}: {
  params: { portalToken: string };
}) {
  return (
    <PortalSessionProvider portalToken={params.portalToken}>
      <ReviewPageContent />
    </PortalSessionProvider>
  );
}
