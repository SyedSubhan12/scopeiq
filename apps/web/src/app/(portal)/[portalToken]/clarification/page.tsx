"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Button, Card, Input, Skeleton, Textarea, useToast } from "@novabots/ui";
import { AlertCircle, ArrowLeft, CheckCircle, HelpCircle, Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function ClarificationPageContent() {
  const session = usePortalSession();
  const { toast } = useToast();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const clarificationBrief = session.clarificationBrief;
  const clarificationRequest = session.clarificationRequest;
  const effectiveBranding = clarificationBrief?.branding ?? null;
  const portalBrandColor = effectiveBranding?.accentColor || session.workspace.brandColor;
  const portalLogoUrl = effectiveBranding?.logoUrl ?? session.workspace.logoUrl;
  const successCopy =
    effectiveBranding?.successMessage || "Thanks. Your updated answers are back with the agency for review.";
  const fieldsByKey = useMemo(
    () =>
      new Map((clarificationBrief?.fields ?? []).map((field) => [field.key, field])),
    [clarificationBrief?.fields],
  );

  if (session.loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (session.error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-[rgb(var(--border-default))] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">Link Invalid or Expired</h2>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
            {session.error}. Please contact your agency for a new portal link.
          </p>
        </div>
      </div>
    );
  }

  const { project, workspace } = session;

  if (!clarificationBrief || !clarificationRequest || clarificationRequest.items.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: `${portalBrandColor}08` }}>
        <PortalHeader
          workspaceName={workspace.name}
          logoUrl={portalLogoUrl}
          brandColor={portalBrandColor}
          projectName={project.name}
          clientName={project.clientName}
        />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">No active clarification request</h3>
            <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
              There is nothing to revise right now.
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

  const severityColors: Record<string, string> = {
    low: "bg-blue-50 border-blue-100 text-blue-800",
    medium: "bg-amber-50 border-amber-100 text-amber-800",
    high: "bg-red-50 border-red-100 text-red-800",
  };

  const handleSubmit = async () => {
    const missingItem = clarificationRequest.items.find((item) => !(answers[item.fieldKey] ?? "").trim());
    if (missingItem) {
      toast("error", `Please answer "${missingItem.fieldLabel}" before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/portal/session/brief/clarify-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Portal-Token": session.token,
        },
        body: JSON.stringify({
          briefId: clarificationBrief.id,
          clarificationRequestId: clarificationRequest.id,
          responses: answers,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Failed to submit clarifications");
      }

      toast("success", "Clarifications submitted successfully.");
      router.push(`/${session.token}/success?kind=clarification&message=${encodeURIComponent(successCopy)}`);
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Failed to submit clarifications.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${portalBrandColor}08` }}>
      <PortalHeader
        workspaceName={workspace.name}
        logoUrl={portalLogoUrl}
        brandColor={portalBrandColor}
        projectName={project.name}
        clientName={project.clientName}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
          <Link href={`/portal/${session.token}`} className="hover:text-[rgb(var(--text-secondary))]">
            Portal
          </Link>
          <span>/</span>
          <span className="text-[rgb(var(--text-primary))]">Clarifications</span>
        </div>

        <div className="rounded-[32px] border border-[rgb(var(--border-subtle))] bg-white/85 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 border-b border-[rgb(var(--border-subtle))] pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Brief Clarifications</h1>
              </div>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
                Your agency has highlighted the exact details needed before work can proceed. Update each item below and resubmit the brief.
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
              <p className="font-medium text-[rgb(var(--text-primary))]">
                {clarificationRequest.items.length} clarification item{clarificationRequest.items.length > 1 ? "s" : ""}
              </p>
              {clarificationRequest.message ? (
                <p className="mt-1 leading-6">{clarificationRequest.message}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {clarificationRequest.items.map((item) => {
              const field = fieldsByKey.get(item.fieldKey);
              const currentValue = answers[item.fieldKey] ?? field?.value ?? "";
              const prefersLongText =
                item.fieldKey.includes("scope") ||
                item.fieldKey.includes("description") ||
                item.fieldKey.includes("detail") ||
                item.prompt.length > 110;

              return (
                <Card key={item.id} className="border border-[rgb(var(--border-subtle))] p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--surface-subtle))]">
                      <HelpCircle className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                          {item.fieldLabel}
                        </h3>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            severityColors[item.severity]
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                        {item.prompt}
                      </p>
                    </div>
                  </div>

                  {field?.value ? (
                    <div className="mb-4 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                        Previous answer
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--text-secondary))]">
                        {field.value}
                      </p>
                    </div>
                  ) : null}

                  {prefersLongText ? (
                    <Textarea
                      value={currentValue}
                      onChange={(event) =>
                        setAnswers((prev) => ({ ...prev, [item.fieldKey]: event.target.value }))
                      }
                      placeholder="Provide the extra detail requested here..."
                      rows={5}
                      className="w-full"
                    />
                  ) : (
                    <Input
                      value={currentValue}
                      onChange={(event) =>
                        setAnswers((prev) => ({ ...prev, [item.fieldKey]: event.target.value }))
                      }
                      placeholder="Your updated answer..."
                      className="w-full"
                    />
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/portal/${session.token}`}
              className="rounded-xl border border-[rgb(var(--border-default))] px-6 py-2.5 text-center text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
            >
              Back to Portal
            </Link>
            <Button size="lg" onClick={() => void handleSubmit()} disabled={submitting} className="gap-2">
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Clarifications"}
            </Button>
          </div>
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
