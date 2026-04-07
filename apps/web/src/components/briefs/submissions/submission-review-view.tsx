"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, GitCompareArrows, ShieldAlert } from "lucide-react";
import { Button, Card, Dialog, Input, Skeleton, Textarea, useToast } from "@novabots/ui";
import { BriefModuleHeader } from "@/components/briefs/shared/brief-module-header";
import { BriefRouteNotFoundState } from "@/components/briefs/shared/route-state";
import { ScorePill } from "@/components/briefs/shared/score-pill";
import { StatusBadge } from "@/components/briefs/shared/status-badge";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  useAssignBriefReviewer,
  useBriefVersions,
  useCreateClarificationRequest,
  useReviewBrief,
} from "@/hooks/useBriefs";
import { useWorkspaceUsers } from "@/hooks/useWorkspaceUsers";
import { type BriefRecord, type BriefVersionRecord } from "@/lib/briefs";

type ReviewTab = "review" | "versions" | "activity";

interface SubmissionReviewViewProps {
  brief: BriefRecord | undefined;
  isLoading?: boolean;
}

const REVIEW_TABS: Array<{ key: ReviewTab; label: string }> = [
  { key: "review", label: "Review" },
  { key: "versions", label: "Versions" },
  { key: "activity", label: "Activity" },
];

type DecisionAction = "approve" | "clarify" | "hold" | "override";
type ReviewMutationStatus =
  | "clarification_needed"
  | "approved"
  | "rejected";
type ClarificationDraft = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  prompt: string;
  severity: "low" | "medium" | "high";
  sourceFlagId?: string;
};

const DECISION_COPY: Record<
  DecisionAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    status: ReviewMutationStatus;
    reasonLabel: string;
    reasonPlaceholder: string;
    reasonRequired: boolean;
    successMessage: string;
  }
> = {
  approve: {
    title: "Approve brief",
    description:
      "Confirm this brief is clear enough to move into delivery. Add an approval note if you want the decision context preserved in the scoring metadata.",
    confirmLabel: "Approve brief",
    status: "approved",
    reasonLabel: "Approval note",
    reasonPlaceholder: "Approved after review. Scope is clear enough to proceed.",
    reasonRequired: false,
    successMessage: "Brief approved",
  },
  clarify: {
    title: "Mark clarification needed",
    description:
      "Keep this brief out of kickoff until the client provides more detail. Add the key clarification message so the team understands what is still missing.",
    confirmLabel: "Request clarification",
    status: "clarification_needed",
    reasonLabel: "Clarification request",
    reasonPlaceholder: "We still need clearer success metrics and a tighter deliverables list.",
    reasonRequired: true,
    successMessage: "Brief marked for clarification",
  },
  hold: {
    title: "Place brief on hold",
    description:
      "Use hold when the brief should not proceed in its current state. This is the operational equivalent of rejecting the submission until the blockers are resolved.",
    confirmLabel: "Place on hold",
    status: "rejected",
    reasonLabel: "Hold reason",
    reasonPlaceholder: "The scope is too ambiguous to staff or estimate safely.",
    reasonRequired: true,
    successMessage: "Brief placed on hold",
  },
  override: {
    title: "Override and approve brief",
    description:
      "This bypasses the current AI hold and marks the brief approved. Add a clear reason so the decision is visible in project history.",
    confirmLabel: "Confirm override",
    status: "approved",
    reasonLabel: "Override reason",
    reasonPlaceholder: "Client clarified scope live on the kickoff call.",
    reasonRequired: true,
    successMessage: "Brief overridden and marked approved",
  },
};

export function SubmissionReviewView({ brief, isLoading }: SubmissionReviewViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: ReviewTab = REVIEW_TABS.some((item) => item.key === tabParam)
    ? (tabParam as ReviewTab)
    : "review";
  const { toast } = useToast();
  const reviewBrief = useReviewBrief(brief?.id ?? "");
  const createClarificationRequest = useCreateClarificationRequest(brief?.id ?? "");
  const assignReviewer = useAssignBriefReviewer(brief?.id ?? "");
  const versionsQuery = useBriefVersions(brief?.id ?? "");
  const workspaceUsers = useWorkspaceUsers();
  const auditLog = useAuditLog({
    entityType: "brief",
    ...(brief?.id ? { entityId: brief.id } : {}),
    limit: 20,
    enabled: Boolean(brief?.id),
  });
  const [pendingAction, setPendingAction] = useState<DecisionAction | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [clarificationDrafts, setClarificationDrafts] = useState<ClarificationDraft[]>([]);
  const [selectedBaseVersionId, setSelectedBaseVersionId] = useState<string>("");
  const [selectedCompareVersionId, setSelectedCompareVersionId] = useState<string>("");
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const groupedFlags = useMemo(() => {
    const source = brief?.flags ?? [];
    return {
      high: source.filter((flag) => flag.severity === "high"),
      medium: source.filter((flag) => flag.severity === "medium"),
      low: source.filter((flag) => flag.severity === "low"),
    };
  }, [brief?.flags]);

  const decisionMeta = pendingAction ? DECISION_COPY[pendingAction] : null;
  const availableVersions = versionsQuery.data?.data ?? currentBriefVersions(brief);
  const reviewers = workspaceUsers.data?.data ?? [];
  const assignedReviewer =
    reviewers.find((user) => user.id === brief?.reviewerId) ?? null;

  const selectedBaseVersion =
    availableVersions.find((version) => version.id === selectedBaseVersionId) ??
    availableVersions[0] ??
    null;
  const selectedCompareVersion =
    availableVersions.find((version) => version.id === selectedCompareVersionId) ??
    availableVersions[1] ??
    null;

  const diffRows = useMemo(() => {
    if (!selectedBaseVersion || !selectedCompareVersion) return [];

    const compareMap = new Map(
      selectedCompareVersion.answers.map((answer) => [answer.fieldKey, answer]),
    );

    return selectedBaseVersion.answers.map((baseAnswer) => {
      const compareAnswer = compareMap.get(baseAnswer.fieldKey);
      return {
        fieldKey: baseAnswer.fieldKey,
        label: baseAnswer.fieldLabel,
        before: baseAnswer.value ?? "—",
        after: compareAnswer?.value ?? "—",
        changed: (baseAnswer.value ?? "") !== (compareAnswer?.value ?? ""),
      };
    });
  }, [selectedBaseVersion, selectedCompareVersion]);

  async function handleDecision() {
    if (!brief || !decisionMeta) return;
    const trimmedReason = decisionReason.trim();
    if (decisionMeta.reasonRequired && !trimmedReason) return;
    try {
      if (pendingAction === "clarify") {
        await createClarificationRequest.mutateAsync({
          ...(trimmedReason ? { message: trimmedReason } : {}),
          items: clarificationDrafts.map((item) => ({
            fieldKey: item.fieldKey,
            fieldLabel: item.fieldLabel,
            prompt: item.prompt,
            severity: item.severity,
            ...(item.sourceFlagId ? { sourceFlagId: item.sourceFlagId } : {}),
          })),
        });
      } else {
        await reviewBrief.mutateAsync({
          action: pendingAction!,
          status: decisionMeta.status,
          ...(trimmedReason ? { note: trimmedReason } : {}),
        });
      }
      toast("success", decisionMeta.successMessage);
      setPendingAction(null);
      setDecisionReason("");
    } catch {
      toast("error", `Failed to ${decisionMeta.confirmLabel.toLowerCase()}`);
    }
  }

  function openDecision(action: DecisionAction) {
    setPendingAction(action);
    setDecisionReason("");
    if (action === "clarify") {
      const fieldLabelMap = new Map(
        (brief?.fields ?? []).map((field) => [field.fieldKey, field.fieldLabel]),
      );
      const nextDrafts =
        (brief?.flags ?? []).map((flag) => ({
          id: flag.id,
          fieldKey: flag.fieldKey ?? "general_clarification",
          fieldLabel: (flag.fieldKey ? fieldLabelMap.get(flag.fieldKey) : null) ?? "General clarification",
          prompt:
            flag.suggestedQuestion ??
            `Please clarify ${((flag.fieldKey ? fieldLabelMap.get(flag.fieldKey) : null) ?? "this part of the brief").toLowerCase()}.`,
          severity: flag.severity,
          ...(flag.id ? { sourceFlagId: flag.id } : {}),
        })) ?? [];

      setClarificationDrafts(
        nextDrafts.length > 0
          ? nextDrafts
          : [
              {
                id: "general_clarification",
                fieldKey: "general_clarification",
                fieldLabel: "General clarification",
                prompt: "Please provide the missing detail needed before this brief can proceed.",
                severity: "medium",
              },
            ],
      );
    } else {
      setClarificationDrafts([]);
    }
  }

  function jumpToField(fieldKey?: string | null) {
    if (!fieldKey) return;
    setActiveFieldKey(fieldKey);
    const node = fieldRefs.current[fieldKey];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function handleReviewerChange(nextReviewerId: string) {
    try {
      await assignReviewer.mutateAsync(nextReviewerId || null);
      toast("success", nextReviewerId ? "Reviewer assigned" : "Reviewer cleared");
    } catch {
      toast("error", "Failed to update reviewer");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid gap-4 xl:grid-cols-[1.25fr,0.9fr]">
          <Skeleton className="h-[720px] w-full rounded-3xl" />
          <Skeleton className="h-[720px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <BriefRouteNotFoundState
        title="Submission not found"
        description="This brief submission could not be loaded. It may have been removed or you may not have access to it."
        backHref="/briefs/submissions"
        backLabel="Back to submission queue"
      />
    );
  }

  const currentBrief = brief;
  const canApprove =
    currentBrief.status === "scored" ||
    currentBrief.status === "clarification_needed" ||
    currentBrief.status === "rejected";
  const canClarify = currentBrief.status !== "approved";
  const canHold = currentBrief.status !== "approved" && currentBrief.status !== "rejected";
  const canOverride = currentBrief.status === "clarification_needed" || currentBrief.status === "rejected";
  const isAwaitingScore =
    currentBrief.status === "pending_score" || currentBrief.status === "scoring";

  function setTab(nextTab: ReviewTab) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", nextTab);
    router.replace(`/briefs/submissions/${currentBrief.id}?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <BriefModuleHeader
        eyebrow="Submission review"
        title={currentBrief.title || `Brief ${currentBrief.id.slice(0, 8)}`}
        description="Review the submitted answers, inspect AI flags, and decide whether this brief is ready to move into project delivery."
        actions={
          <>
            <Link href="/briefs/submissions">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to queue
              </Button>
            </Link>
            <ScorePill score={currentBrief.scopeScore} />
            <StatusBadge status={currentBrief.status} />
            {canClarify ? (
              <Button variant="secondary" onClick={() => openDecision("clarify")}>
                Request clarification
              </Button>
            ) : null}
            {canHold ? (
              <Button variant="secondary" onClick={() => openDecision("hold")}>
                Place on hold
              </Button>
            ) : null}
            {canApprove ? (
              <Button onClick={() => openDecision("approve")}>Approve brief</Button>
            ) : null}
            {canOverride ? (
              <Button variant="secondary" onClick={() => openDecision("override")}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Override and approve
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {REVIEW_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.key
                ? "bg-[rgb(var(--primary-dark))] text-white"
                : "bg-white text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "review" && isAwaitingScore ? (
        <Card className="rounded-3xl border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] p-5">
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            AI scoring is still in progress.
          </p>
          <p className="mt-1 text-sm leading-6 text-[rgb(var(--text-secondary))]">
            You can inspect the answers now, but the final readiness decision should wait until scoring completes unless you are intentionally overriding the workflow.
          </p>
        </Card>
      ) : null}

      {tab === "review" &&
      (currentBrief.status === "clarification_needed" || currentBrief.status === "rejected") ? (
        <Card className="rounded-3xl border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            This brief is not ready for kickoff yet.
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-700">
            The current score and flags suggest missing detail or ambiguous scope. Review the flagged answers before approving.
          </p>
        </Card>
      ) : null}

      {tab === "review" ? (
        <div className="grid gap-4 xl:grid-cols-[1.25fr,0.9fr]">
          <div className="space-y-4">
            <Card className="rounded-3xl p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    Submitted answers
                  </h2>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    These are the structured answers currently attached to the brief.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(currentBrief.fields ?? []).length === 0 ? (
                  <p className="text-sm text-[rgb(var(--text-muted))]">No answers available.</p>
                ) : (
                  [...(currentBrief.fields ?? [])]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((field) => (
                      <div
                        key={field.fieldKey}
                        ref={(node) => {
                          fieldRefs.current[field.fieldKey] = node;
                        }}
                        className={`rounded-2xl border px-4 py-4 transition-colors ${
                          activeFieldKey === field.fieldKey
                            ? "border-primary/30 bg-primary/5"
                            : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]"
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                          {field.fieldLabel}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--text-primary))]">
                          {field.value || "—"}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <Card className="rounded-3xl p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                AI review summary
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                The right rail keeps the decision context visible while you review.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                    Clarity score
                  </p>
                  <div className="mt-2">
                    <ScorePill score={currentBrief.scopeScore} />
                  </div>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                    Summary
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                    {currentBrief.scoringResultJson?.summary || "No score summary available yet."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                    Reviewer
                  </label>
                  <select
                    className="mt-2 h-11 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-white px-3 text-sm outline-none transition-colors focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                    value={currentBrief.reviewerId ?? ""}
                    onChange={(event) => void handleReviewerChange(event.target.value)}
                    disabled={assignReviewer.isPending || workspaceUsers.isLoading}
                  >
                    <option value="">Unassigned</option>
                    {reviewers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} · {user.role}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                    {assignedReviewer
                      ? `${assignedReviewer.fullName} owns the current review.`
                      : "Assign a reviewer so this brief has a clear owner."}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Ambiguity flags
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                Review what is unclear before the project proceeds.
              </p>

              <div className="mt-5 space-y-4">
                {(["high", "medium", "low"] as const).map((severity) => {
                  const items = groupedFlags[severity];
                  if (items.length === 0) return null;

                  return (
                    <div key={severity} className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                        {severity} severity
                      </p>
                      {items.map((flag) => (
                        <div
                          key={flag.id}
                          className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4"
                        >
                          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                            {flag.message}
                          </p>
                          {flag.fieldKey ? (
                            <button
                              type="button"
                              onClick={() => jumpToField(flag.fieldKey)}
                              className="mt-1 text-left text-xs text-[rgb(var(--text-muted))] underline-offset-4 hover:text-[rgb(var(--text-primary))] hover:underline"
                            >
                              Field: {flag.fieldKey}
                            </button>
                          ) : null}
                          {flag.suggestedQuestion ? (
                            <div className="mt-3 rounded-xl bg-white px-3 py-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                              <span className="font-medium text-[rgb(var(--text-primary))]">
                                Suggested clarification:
                              </span>{" "}
                              {flag.suggestedQuestion}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {currentBrief.flags.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--text-muted))]">No flags were returned.</p>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "versions" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <Card className="rounded-3xl p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <GitCompareArrows className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Version comparison
                </h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Compare immutable submission snapshots to see what changed across resubmissions.
                </p>
              </div>
            </div>
            {versionsQuery.isLoading ? (
              <Skeleton className="h-72 w-full rounded-2xl" />
            ) : availableVersions.length < 2 ? (
              <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-8 text-sm text-[rgb(var(--text-muted))]">
                Version history will appear here after the brief is resubmitted.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                      Base version
                    </label>
                    <select
                      className="h-11 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-white px-3 text-sm outline-none transition-colors focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                      value={selectedBaseVersion?.id ?? ""}
                      onChange={(event) => setSelectedBaseVersionId(event.target.value)}
                    >
                      {availableVersions.map((version) => (
                        <option key={version.id} value={version.id}>
                          v{version.versionNumber} · {new Date(version.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
                      Compare with
                    </label>
                    <select
                      className="h-11 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-white px-3 text-sm outline-none transition-colors focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                      value={selectedCompareVersion?.id ?? ""}
                      onChange={(event) => setSelectedCompareVersionId(event.target.value)}
                    >
                      {availableVersions.map((version) => (
                        <option key={version.id} value={version.id}>
                          v{version.versionNumber} · {new Date(version.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {diffRows.map((row) => (
                    <div
                      key={row.fieldKey}
                      className={`rounded-2xl border px-4 py-4 ${
                        row.changed
                          ? "border-primary/20 bg-primary/5"
                          : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]"
                      }`}
                    >
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {row.label}
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                            Before
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--text-secondary))]">
                            {row.before}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                            After
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--text-secondary))]">
                            {row.after}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="rounded-3xl p-6">
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Version timeline</h3>
            <div className="mt-4 space-y-3">
              {availableVersions.map((version) => (
                <div
                  key={version.id}
                  className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      Version {version.versionNumber}
                    </p>
                    <StatusBadge status={version.status} />
                  </div>
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                    {version.answers.length} answers · {version.attachments.length} attachments
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                    {new Date(version.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "activity" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <Card className="rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Activity timeline</h2>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
              Workspace audit events for this brief entity.
            </p>

            <div className="mt-5 space-y-3">
              {auditLog.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                ))
              ) : auditLog.isError ? (
                <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-6 text-sm text-[rgb(var(--text-muted))]">
                  Audit activity is unavailable for this user or workspace.
                </div>
              ) : (auditLog.data?.data ?? []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-6 text-sm text-[rgb(var(--text-muted))]">
                  No audit events were returned for this brief.
                </div>
              ) : (
                auditLog.data?.data.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-4 py-4"
                  >
                    <p className="text-sm font-medium capitalize text-[rgb(var(--text-primary))]">
                      {event.action.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-3xl p-6">
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Workflow readiness</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">
              <li>Approve, clarification-needed, hold, and override now use a dedicated review route.</li>
              <li>Reviewer assignment now persists directly on the brief.</li>
              <li>Version history is backed by immutable submission snapshots.</li>
            </ul>
          </Card>
        </div>
      ) : null}

      <Dialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={decisionMeta?.title ?? "Review decision"}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[rgb(var(--text-secondary))]">
            {decisionMeta?.description}
          </p>
          {pendingAction === "clarify" ? (
            <div className="space-y-3">
              <Textarea
                label={decisionMeta?.reasonLabel ?? "Clarification note"}
                value={decisionReason}
                onChange={(event) => setDecisionReason(event.target.value)}
                rows={4}
                placeholder={decisionMeta?.reasonPlaceholder ?? ""}
              />
              <div className="space-y-3">
                {clarificationDrafts.map((item, index) => (
                  <Textarea
                    key={item.id}
                    label={`${item.fieldLabel} prompt`}
                    value={item.prompt}
                    onChange={(event) =>
                      setClarificationDrafts((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, prompt: event.target.value } : entry,
                        ),
                      )
                    }
                    rows={3}
                    placeholder="Ask for the exact detail needed to move this brief forward."
                  />
                ))}
              </div>
            </div>
          ) : decisionMeta?.reasonRequired ? (
            <Textarea
              label={decisionMeta.reasonLabel}
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
              rows={5}
              placeholder={decisionMeta.reasonPlaceholder}
            />
          ) : (
            <Input
              label={decisionMeta?.reasonLabel ?? "Note"}
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
              placeholder={decisionMeta?.reasonPlaceholder ?? ""}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleDecision()}
              loading={pendingAction === "clarify" ? createClarificationRequest.isPending : reviewBrief.isPending}
              disabled={
                (decisionMeta?.reasonRequired ? !decisionReason.trim() : false) ||
                (pendingAction === "clarify" && clarificationDrafts.some((item) => item.prompt.trim().length === 0))
              }
            >
              {decisionMeta?.confirmLabel ?? "Confirm"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function currentBriefVersions(brief: BriefRecord | undefined): BriefVersionRecord[] {
  return brief?.versions ?? [];
}
