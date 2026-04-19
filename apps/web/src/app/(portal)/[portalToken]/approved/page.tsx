"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Button, Card } from "@novabots/ui";
import { Skeleton } from "@novabots/ui";
import {
  AlertCircle,
  ArrowLeft,
  FileCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

function AnimatedCheckmark() {
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
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto mb-6" aria-hidden>
      <circle ref={circleRef} cx="40" cy="40" r="36" stroke="#10b981" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path ref={checkRef} d="M24 40 L35 52 L56 28" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function ApprovedPageContent() {
  const session = usePortalSession();

  if (session.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Skeleton className="h-64 w-full" />
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
        </div>
      </div>
    );
  }

  const { project, workspace } = session;

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${workspace.brandColor}08` }}>
      <PortalHeader
        workspaceName={workspace.name}
        logoUrl={workspace.logoUrl}
        brandColor={workspace.brandColor}
        projectName={project.name}
        clientName={project.clientName}
      />

      <main className="mx-auto max-w-4xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
        <Card className="max-w-2xl mx-auto text-center py-12 px-8">
          <AnimatedCheckmark />

          <motion.h1
            className="text-2xl font-bold text-[rgb(var(--text-primary))]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.35 }}
          >
            Successfully Approved
          </motion.h1>
          <motion.p
            className="mt-3 text-[rgb(var(--text-muted))] leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.35 }}
          >
            Your approval has been recorded. Your agency has been notified and will
            proceed with the next phase of your project.
          </motion.p>

          <motion.div
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.4 }}
          >
            <div className="rounded-xl bg-[rgb(var(--surface-subtle))] p-4">
              <FileCheck className="mx-auto h-6 w-6 text-[rgb(var(--text-muted))] mb-2" />
              <p className="text-xs font-bold text-[rgb(var(--text-primary))]">
                Approval Recorded
              </p>
              <p className="text-[10px] text-[rgb(var(--text-muted))] mt-1">
                Your response has been saved
              </p>
            </div>
            <div className="rounded-xl bg-[rgb(var(--surface-subtle))] p-4">
              <Sparkles className="mx-auto h-6 w-6 text-[rgb(var(--text-muted))] mb-2" />
              <p className="text-xs font-bold text-[rgb(var(--text-primary))]">
                Agency Notified
              </p>
              <p className="text-[10px] text-[rgb(var(--text-muted))] mt-1">
                They&apos;ll start working right away
              </p>
            </div>
            <div className="rounded-xl bg-[rgb(var(--surface-subtle))] p-4">
              <Clock className="mx-auto h-6 w-6 text-[rgb(var(--text-muted))] mb-2" />
              <p className="text-xs font-bold text-[rgb(var(--text-primary))]">
                Next Steps
              </p>
              <p className="text-[10px] text-[rgb(var(--text-muted))] mt-1">
                Expect updates in your portal
              </p>
            </div>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.35 }}
          >
            <Link href={`/portal/${session.token}`}>
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                Back to Portal
              </Button>
            </Link>
            <Link href={`/portal/${session.token}/review`}>
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                Review More Work
              </Button>
            </Link>
          </motion.div>
        </Card>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <PoweredByBadge plan={workspace.plan} />
        </div>
      </main>
    </div>
  );
}

export default function ApprovedPage({
  params,
}: {
  params: { portalToken: string };
}) {
  return (
    <PortalSessionProvider portalToken={params.portalToken}>
      <ApprovedPageContent />
    </PortalSessionProvider>
  );
}
