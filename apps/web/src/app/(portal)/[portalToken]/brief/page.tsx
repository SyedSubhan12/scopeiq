"use client";

import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { IntakeForm } from "@/components/portal/IntakeForm";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Skeleton } from "@novabots/ui";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

function BriefPageContent() {
  const session = usePortalSession();
  const router = useRouter();

  if (session.loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
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

  const { project, workspace, pendingBrief } = session;

  if (!pendingBrief) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            No brief to fill out
          </h3>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            Your agency will share a brief when your project is ready to begin.
          </p>
          <button
            className="mt-6 rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
            onClick={() => router.push(`/portal/${session.token}`)}
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Project Brief</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Help us understand your project by answering the questions below.
          </p>
        </div>

        <IntakeForm
          brief={{
            id: pendingBrief.id,
            title: pendingBrief.title,
            fields: pendingBrief.fields,
          }}
          projectId={project.id}
          workspaceId={workspace.id}
          onSuccess={() => router.push(`/portal/${session.token}`)}
        />

        <div className="mt-8">
          <PoweredByBadge plan={workspace.plan} />
        </div>
      </main>
    </div>
  );
}

export default function BriefPage({
  params,
}: {
  params: { portalToken: string };
}) {
  return (
    <PortalSessionProvider portalToken={params.portalToken}>
      <BriefPageContent />
    </PortalSessionProvider>
  );
}
