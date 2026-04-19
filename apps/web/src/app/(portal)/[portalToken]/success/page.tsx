"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Button, Card, Skeleton } from "@novabots/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function AnimatedCheckmark({ color }: { color: string }) {
  const circleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    void import("animejs").then((mod) => {
      const anime = (mod as { default: (p: unknown) => void }).default;
      anime({
        targets: circleRef.current,
        strokeDashoffset: [(anime as any).setDashoffset, 0],
        duration: 700,
        easing: "easeOutQuad",
      });
      anime({
        targets: checkRef.current,
        strokeDashoffset: [(anime as any).setDashoffset, 0],
        duration: 450,
        delay: 550,
        easing: "easeOutQuad",
      });
    });
  }, []);

  return (
    <svg width="64" height="64" viewBox="0 0 80 80" fill="none" className="mx-auto mb-5" aria-hidden>
      <circle ref={circleRef} cx="40" cy="40" r="36" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path ref={checkRef} d="M24 40 L35 52 L56 28" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="mx-auto max-w-2xl rounded-[32px] px-8 py-14 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <AnimatedCheckmark color={portalBrandColor} />
            <motion.h1
              className="text-2xl font-bold text-[rgb(var(--text-primary))]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.35 }}
            >
              {heading}
            </motion.h1>
            <motion.p
              className="mt-3 text-sm leading-7 text-[rgb(var(--text-secondary))]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.05, duration: 0.35 }}
            >
              {message}
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.35 }}
            >
              <Link href={`/portal/${session.token}`}>
                <Button>Back to portal</Button>
              </Link>
              <Link href={`/${session.token}/brief`}>
                <Button variant="secondary">View brief</Button>
              </Link>
            </motion.div>
          </Card>
        </motion.div>

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
