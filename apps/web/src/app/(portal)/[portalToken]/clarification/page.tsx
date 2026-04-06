"use client";

import { useState } from "react";
import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Button, Card, useToast, Textarea, Input } from "@novabots/ui";
import { Skeleton } from "@novabots/ui";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Send,
} from "lucide-react";
import Link from "next/link";

interface ScopeFlag {
  id: string;
  fieldKey: string;
  question: string;
  reason: string;
  severity: "low" | "medium" | "high";
  fieldLabel: string;
}

function ClarificationPageContent() {
  const session = usePortalSession();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // In a real implementation, these would be fetched from an API
  // For now, we derive flagged fields from the pending brief
  const pendingBrief = session.pendingBrief;
  const flaggedFields: ScopeFlag[] = pendingBrief
    ? pendingBrief.fields
        .filter((field) => {
          // Fields without values or with short values are considered "flagged"
          return !field.value || field.value.length < 20;
        })
        .map((field) => {
          return {
            id: field.id,
            fieldKey: field.fieldKey,
            fieldLabel: field.fieldLabel,
            question: `Could you elaborate on "${field.fieldLabel}"?`,
            reason: field.value
              ? "Your answer seems brief — more detail helps us deliver better results."
              : "This field was not answered yet.",
            severity: field.value ? "low" as const : "high" as const,
          };
        })
    : [];

  if (session.loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
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

  if (submitted) {
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
          <Card className="max-w-2xl mx-auto py-16 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              Clarifications Submitted
            </h2>
            <p className="text-[rgb(var(--text-muted))] mt-2">
              Thank you for providing additional details. Your agency will review your
              clarifications and update the project brief accordingly.
            </p>
            <Link
              href={`/portal/${session.token}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Portal
            </Link>
          </Card>
          <div className="mt-8 flex justify-center">
            <PoweredByBadge plan={workspace.plan} />
          </div>
        </main>
      </div>
    );
  }

  if (flaggedFields.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: `${workspace.brandColor}08` }}>
        <PortalHeader
          workspaceName={workspace.name}
          logoUrl={workspace.logoUrl}
          brandColor={workspace.brandColor}
          projectName={project.name}
          clientName={project.clientName}
        />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              All clear!
            </h3>
            <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
              No clarifications needed at this time. Your brief looks great.
            </p>
            <Link
              href={`/portal/${session.token}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Portal
            </Link>
          </div>
          <div className="mt-8">
            <PoweredByBadge plan={workspace.plan} />
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Submit clarifications — in a real app, this would hit a dedicated API endpoint
      // For now, we simulate success
      setSubmitted(true);
      toast("success", "Clarifications submitted successfully!");
    } catch {
      toast("error", "Failed to submit clarifications. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const severityColors: Record<string, string> = {
    low: "bg-blue-50 border-blue-100 text-blue-800",
    medium: "bg-amber-50 border-amber-100 text-amber-800",
    high: "bg-red-50 border-red-100 text-red-800",
  };

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
        <div className="mb-6 flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
          <Link
            href={`/portal/${session.token}`}
            className="hover:text-[rgb(var(--text-secondary))]"
          >
            Portal
          </Link>
          <span>/</span>
          <span className="text-[rgb(var(--text-primary))]">Clarifications</span>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[rgb(var(--text-muted))]" />
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              Brief Clarifications
            </h1>
          </div>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Our AI detected a few areas where more detail would help. Please review and
            provide additional information for the flagged fields below.
          </p>
        </div>

        <div className="space-y-6">
          {flaggedFields.map((flag) => (
            <Card key={flag.id} className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--surface-subtle))]">
                  <HelpCircle className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">
                      {flag.fieldLabel}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        severityColors[flag.severity]
                      }`}
                    >
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    {flag.reason}
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                {flag.question}
              </p>

              {flag.fieldKey.includes("scope") || flag.fieldKey.includes("description") || flag.fieldKey.includes("detail") ? (
                <Textarea
                  value={answers[flag.fieldKey] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [flag.fieldKey]: e.target.value }))
                  }
                  placeholder="Provide more detail here..."
                  rows={4}
                  className="w-full"
                />
              ) : (
                <Input
                  value={answers[flag.fieldKey] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [flag.fieldKey]: e.target.value }))
                  }
                  placeholder="Your answer..."
                  className="w-full"
                />
              )}
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Link
            href={`/portal/${session.token}`}
            className="rounded-xl border border-[rgb(var(--border-default))] px-6 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
          >
            Skip for Now
          </Link>
          <Button
            size="lg"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Clarifications"}
          </Button>
        </div>

        <div className="mt-8">
          <PoweredByBadge plan={workspace.plan} />
        </div>
      </main>
    </div>
  );
}

export default function ClarificationPage({
  params,
}: {
  params: { portalToken: string };
}) {
  return (
    <PortalSessionProvider portalToken={params.portalToken}>
      <ClarificationPageContent />
    </PortalSessionProvider>
  );
}
