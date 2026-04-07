"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Layers3 } from "lucide-react";
import { Card, Button, Skeleton } from "@novabots/ui";
import { BriefModuleHeader } from "@/components/briefs/shared/brief-module-header";
import { ScorePill } from "@/components/briefs/shared/score-pill";
import { StatusBadge } from "@/components/briefs/shared/status-badge";
import { type BriefRecord, type BriefTemplateRecord } from "@/lib/briefs";

interface BriefsOverviewProps {
  templates: BriefTemplateRecord[];
  submissions: BriefRecord[];
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : "bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-primary))]";

  return (
    <Card className="rounded-3xl p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
        {label}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-[-0.03em] text-[rgb(var(--text-primary))]">
          {value}
        </p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
          Live
        </span>
      </div>
    </Card>
  );
}

export function BriefsOverview({ templates, submissions, isLoading }: BriefsOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.35fr,0.95fr]">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const flaggedCount = submissions.filter(
    (brief) => brief.status === "clarification_needed" || brief.status === "rejected",
  ).length;
  const approvedCount = submissions.filter((brief) => brief.status === "approved").length;
  const avgScore = submissions.length
    ? Math.round(
        submissions.reduce((sum, brief) => sum + (brief.scopeScore ?? 0), 0) /
          submissions.length,
      )
    : 0;
  const recentTemplates = templates.slice(0, 4);
  const recentSubmissions = submissions.slice(0, 6);

  return (
    <div className="space-y-6">
      <BriefModuleHeader
        eyebrow="Brief Module"
        title="Brief operations dashboard"
        description="Track intake quality, keep templates healthy, and move the right submissions into review before project kickoff."
        actions={
          <>
            <Link href="/briefs/templates">
              <Button variant="secondary">Manage templates</Button>
            </Link>
            <Link href="/briefs/submissions">
              <Button>Open submission queue</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Templates" value={templates.length} />
        <StatCard label="Submissions" value={submissions.length} />
        <StatCard label="Need clarification" value={flaggedCount} tone="warning" />
        <StatCard label="Approved" value={approvedCount} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr,0.95fr]">
        <Card className="rounded-3xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Recent submissions
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                The latest briefs waiting for a decision.
              </p>
            </div>
            <Link
              href="/briefs/submissions"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentSubmissions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-6 text-sm text-[rgb(var(--text-muted))]">
                No submissions yet.
              </p>
            ) : (
              recentSubmissions.map((brief) => (
                <Link
                  key={brief.id}
                  href={`/briefs/submissions/${brief.id}`}
                  className="block rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4 transition-colors hover:border-primary/25 hover:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-[rgb(var(--text-primary))]">
                          {brief.title || `Brief ${brief.id.slice(0, 8)}`}
                        </p>
                        <StatusBadge status={brief.status} />
                      </div>
                      <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                        Project {brief.projectId.slice(0, 8)} · {new Date(brief.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScorePill score={brief.scopeScore} />
                      <span className="text-xs text-[rgb(var(--text-muted))]">
                        {brief.flags.length} flags
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Template health
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Keep the intake system clean and ready for new work.
                </p>
              </div>
              <Layers3 className="h-5 w-5 text-[rgb(var(--text-muted))]" />
            </div>

            <div className="mt-5 space-y-3">
              {recentTemplates.length === 0 ? (
                <p className="text-sm text-[rgb(var(--text-muted))]">No templates yet.</p>
              ) : (
                recentTemplates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/briefs/templates/${template.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] px-4 py-3 transition-colors hover:border-primary/25 hover:bg-[rgb(var(--surface-subtle))]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[rgb(var(--text-primary))]">
                        {template.name}
                      </p>
                      <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                        {template.fields.length} fields
                      </p>
                    </div>
                    <StatusBadge status={template.status} kind="template" />
                  </Link>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-3xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                {flaggedCount > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-status-red" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  Intake quality snapshot
                </h3>
                <p className="text-sm leading-6 text-[rgb(var(--text-secondary))]">
                  Average clarity score is {avgScore}/100. {flaggedCount > 0
                    ? `${flaggedCount} submissions still need clarification before kickoff.`
                    : "No submissions are currently blocked."}
                </p>
                <Link href="/briefs/submissions">
                  <Button variant="secondary" size="sm">
                    Review queue
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

