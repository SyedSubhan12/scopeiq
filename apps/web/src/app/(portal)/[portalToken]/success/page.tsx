"use client";

import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Button, Card, Skeleton } from "@novabots/ui";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessPageContent() {
  const session = usePortalSession();
  const searchParams = useSearchParams();
  const kind = searchParams.get("kind");
  const messageOverride = searchParams.get("message");
  const briefBranding =
    session.pendingBrief?.branding ?? session.clarificationBrief?.branding ?? null;
  const portalBrandColor = briefBranding?.accentColor || session.workspace.brandColor;
  const portalLogoUrl = briefBranding?.logoUrl ?? session.workspace.logoUrl;
  const heading =
    kind === "clarification" ? "Clarifications submitted" : "Brief submitted";
  const message =
    messageOverride ||
    briefBranding?.successMessage ||
    "Your response is in. The agency will review it and follow up if anything else is needed.";

  if (session.loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (session.error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Card className="rounded-[28px] p-8 text-center">
          <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            Submission received
          </h1>
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            We could not reload the full portal session, but your submission was already accepted.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${portalBrandColor}08` }}>
      <PortalHeader
        workspaceName={session.workspace.name}
        logoUrl={portalLogoUrl}
        brandColor={portalBrandColor}
        projectName={session.project.name}
        clientName={session.project.clientName}
      />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <Card className="mx-auto max-w-2xl rounded-[32px] px-8 py-14 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${portalBrandColor}18` }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: portalBrandColor }} />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">{heading}</h1>
          <p className="mt-3 text-sm leading-7 text-[rgb(var(--text-secondary))]">{message}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`/portal/${session.token}`}>
              <Button>Back to portal</Button>
            </Link>
            <Link href={`/${session.token}/brief`}>
              <Button variant="secondary">View brief</Button>
            </Link>
          </div>
        </Card>

        <div className="mt-8 flex justify-center">
          <PoweredByBadge plan={session.workspace.plan} />
        </div>
      </main>
    </div>
  );
}

export default function BriefSuccessPage({
  params,
}: {
  params: { portalToken: string };
}) {
  return (
    <PortalSessionProvider portalToken={params.portalToken}>
      <SuccessPageContent />
    </PortalSessionProvider>
  );
}
