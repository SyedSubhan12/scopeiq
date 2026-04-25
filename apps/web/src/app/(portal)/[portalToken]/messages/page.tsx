"use client";

import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalMessages } from "@/components/portal/PortalMessages";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Skeleton } from "@novabots/ui";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function MessagesPageContent() {
  const session = usePortalSession();

  if (session.loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
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
            type="button"
            className="mt-6 w-full rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { project, workspace, token } = session;

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
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Messages</h1>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
              Direct communication with your agency.
            </p>
          </div>
          <Link
            href={`/${token}/review`}
            className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portal
          </Link>
        </div>

        <PortalMessages
          portalToken={token}
          brandColor={workspace.brandColor}
          clientName={project.clientName}
          agencyName={workspace.name}
        />

        <div className="mt-8">
          <PoweredByBadge plan={workspace.plan} />
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage({
  params,
}: {
  params: { portalToken: string };
}) {
  return (
    <PortalSessionProvider portalToken={params.portalToken}>
      <MessagesPageContent />
    </PortalSessionProvider>
  );
}
