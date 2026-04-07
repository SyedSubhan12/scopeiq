"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, FileText, FolderKanban, Paperclip, ShieldAlert } from "lucide-react";
import { Card, Skeleton, Button } from "@novabots/ui";
import { BriefModuleHeader } from "@/components/briefs/shared/brief-module-header";
import { ScorePill } from "@/components/briefs/shared/score-pill";
import { StatusBadge } from "@/components/briefs/shared/status-badge";
import { type BriefRecord } from "@/lib/briefs";

interface ProjectBriefViewProps {
  projectId: string;
  briefs: BriefRecord[];
  isLoading?: boolean;
}

export function ProjectBriefView({
  projectId,
  briefs,
  isLoading,
}: ProjectBriefViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <Skeleton className="h-[560px] w-full rounded-3xl" />
      </div>
    );
  }

  const approved = briefs.find((brief) => brief.status === "approved") ?? briefs[0] ?? null;
  const latest = briefs[0] ?? null;
  const approvedAttachments = approved?.attachments ?? [];
  const approvedFlags = approved?.flags ?? [];

  return (
    <div className="space-y-6">
      <BriefModuleHeader
        eyebrow="Project brief"
        title="Project source of truth"
        description="Use the approved brief as the kickoff reference for scope, constraints, and client intent."
        actions={
          <>
            <Link href={`/projects/${projectId}`}>
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to project
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/briefs`}>
              <Button variant="secondary">Legacy brief list</Button>
            </Link>
          </>
        }
      />

      {!approved ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <Card className="rounded-3xl py-16 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-[rgb(var(--text-muted))]" />
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              No approved brief yet
            </h3>
            <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
              Once a project brief is submitted and approved, it will appear here as the kickoff reference.
            </p>
          </Card>

          <Card className="rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                <Clock3 className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  Latest brief activity
                </h3>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  {latest
                    ? "A brief exists for this project but it has not been approved yet."
                    : "No brief has been submitted for this project yet."}
                </p>
              </div>
            </div>

            {latest ? (
              <Link
                href={`/briefs/submissions/${latest.id}`}
                className="mt-5 block rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4 transition-colors hover:border-primary/25"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[rgb(var(--text-primary))]">
                      {latest.title || `Brief ${latest.id.slice(0, 8)}`}
                    </p>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                      Last updated {new Date(latest.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={latest.status} />
                </div>
              </Link>
            ) : null}
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-4">
            <Card className="rounded-3xl p-6">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <StatusBadge status={approved.status} />
                <ScorePill score={approved.scopeScore} />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                    Approved brief
                  </p>
                  <p className="mt-2 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {approved.title || `Brief ${approved.id.slice(0, 8)}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                    Last review
                  </p>
                  <p className="mt-2 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {new Date(approved.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                    Submission set
                  </p>
                  <p className="mt-2 text-sm font-medium text-[rgb(var(--text-primary))]">
                    {briefs.length} brief{briefs.length === 1 ? "" : "s"} on record
                  </p>
                </div>
              </div>
            </Card>

            {approvedFlags.length > 0 ? (
              <Card className="rounded-3xl border-amber-200 bg-amber-50/70 p-6">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
                  <div>
                    <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                      Carry-forward risks
                    </h3>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                      These are the last recorded ambiguity flags on the approved brief. Keep them visible during kickoff and change-order review.
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {approvedFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="rounded-2xl border border-amber-200/80 bg-white px-4 py-4"
                    >
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {flag.message}
                      </p>
                      {flag.suggestedQuestion ? (
                        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                          Clarification prompt: {flag.suggestedQuestion}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className="rounded-3xl p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    Approved answers
                  </h2>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    Use this as the kickoff reference for goals, constraints, and client intent.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(approved.fields ?? []).map((field) => (
                  <div
                    key={field.fieldKey}
                    className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                      {field.fieldLabel}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--text-primary))]">
                      {field.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Reference files
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                Attachments submitted with the approved brief.
              </p>

              {approvedAttachments.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-8 text-sm text-[rgb(var(--text-muted))]">
                  No files were attached to the approved brief.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {approvedAttachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] px-4 py-4 transition-colors hover:border-primary/25 hover:bg-[rgb(var(--surface-subtle))]"
                    >
                      <Paperclip className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[rgb(var(--text-primary))]">
                          {attachment.originalName}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-secondary))]">
                          {attachment.mimeType || "File"}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </Card>

            <Card className="rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Brief history
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                All brief submissions linked to this project.
              </p>

              <div className="mt-5 space-y-3">
                {briefs.map((brief) => (
                  <Link
                    key={brief.id}
                    href={`/briefs/submissions/${brief.id}`}
                    className="block rounded-2xl border border-[rgb(var(--border-subtle))] px-4 py-4 transition-colors hover:border-primary/25 hover:bg-[rgb(var(--surface-subtle))]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[rgb(var(--text-primary))]">
                          {brief.title || `Brief ${brief.id.slice(0, 8)}`}
                        </p>
                        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                          {new Date(brief.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {brief.scopeScore != null ? <ScorePill score={brief.scopeScore} /> : null}
                        <StatusBadge status={brief.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
