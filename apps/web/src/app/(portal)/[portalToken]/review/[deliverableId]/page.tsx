"use client";

import { useState } from "react";
import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { DeliverableViewer } from "@/components/approval/DeliverableViewer";
import { FeedbackPanel } from "@/components/approval/FeedbackPanel";
import { RevisionCounter } from "@/components/approval/RevisionCounter";
import { RevisionHistory } from "@/components/approval/RevisionHistory";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import {
  usePortalFeedback,
  useCreatePortalFeedback,
  useResolvePortalFeedback,
  usePortalApprove,
  usePortalRequestRevision,
} from "@/hooks/usePortalFeedback";
import { Skeleton, Button, Badge, useToast } from "@novabots/ui";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  RotateCcw,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const statusMap: Record<string, { label: string; status: "active" | "pending" | "draft" }> = {
  not_started: { label: "Not Started", status: "draft" },
  draft: { label: "Draft", status: "draft" },
  delivered: { label: "Delivered", status: "pending" },
  in_review: { label: "Awaiting Review", status: "pending" },
  changes_requested: { label: "Changes Requested", status: "pending" },
  approved: { label: "Approved", status: "active" },
};

function DeliverableReviewContent({ deliverableId }: { deliverableId: string }) {
  const session = usePortalSession();
  const { toast } = useToast();
  const [showFeedback, setShowFeedback] = useState(false);
  const [placingPin, setPlacingPin] = useState(false);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  const { data: feedbackData } = usePortalFeedback(deliverableId, session.token);
  const createFeedback = useCreatePortalFeedback(deliverableId, session.token);
  const resolveFeedback = useResolvePortalFeedback(deliverableId, session.token);
  const approveMutation = usePortalApprove(deliverableId, session.token);
  const requestRevisionMutation = usePortalRequestRevision(deliverableId, session.token);

  const pins = feedbackData?.data ?? [];

  if (session.loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[500px] w-full" />
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
  const deliverable = session.deliverables.find((d) => d.id === deliverableId);

  if (!deliverable) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            Deliverable not found
          </h3>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            This deliverable does not exist or has been removed.
          </p>
          <Link
            href={`/portal/${session.token}/review`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reviews
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusMap[deliverable.status] ?? {
    label: "Awaiting Review",
    status: "pending" as const,
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(undefined);
      toast("success", "Deliverable approved!");
    } catch {
      toast("error", "Something went wrong. Please try again.");
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionComment.trim()) return;
    try {
      await requestRevisionMutation.mutateAsync(revisionComment.trim());
      setShowRevisionInput(false);
      setRevisionComment("");
      toast("success", "Revision requested");
    } catch {
      toast("error", "Something went wrong. Please try again.");
    }
  };

  const handlePlacePin = async (x: number, y: number) => {
    const pinNumber = pins.length + 1;
    try {
      await createFeedback.mutateAsync({
        body: `Revision request #${pinNumber}`,
        annotationJson: {
          xPos: x,
          yPos: y,
          pinNumber,
        },
      });
      setPlacingPin(false);
      setShowFeedback(true);
      toast("success", "Point-anchor feedback added");
    } catch {
      toast("error", "Failed to add feedback point");
    }
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

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
          <Link
            href={`/portal/${session.token}/review`}
            className="hover:text-[rgb(var(--text-secondary))]"
          >
            Review Work
          </Link>
          <span>/</span>
          <span className="text-[rgb(var(--text-primary))]">{deliverable.name}</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              {deliverable.name}
            </h1>
            <Badge status={statusInfo.status}>{statusInfo.label}</Badge>
            <RevisionCounter
              current={deliverable.revisionRound}
              limit={deliverable.maxRevisions}
              className="w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPlacingPin(!placingPin)}
              className={placingPin ? "bg-primary/10 border-primary text-primary" : ""}
            >
              <MapPin className="h-4 w-4 mr-1" />
              {placingPin ? "Cancel Pin" : "Add Feedback Point"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              Feedback ({pins.length})
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main viewer */}
          <div className="flex-1">
            <div className="mb-6 h-[600px]">
              <DeliverableViewer
                fileUrl={deliverable.fileUrl ?? ""}
                fileType={deliverable.mimeType}
                externalUrl={deliverable.externalUrl}
                pins={pins}
                onPinClick={(pin) => {
                  setActivePinId(pin.id);
                  setShowFeedback(true);
                }}
                onPlacePin={handlePlacePin}
                placingPin={placingPin}
              />
            </div>

            <div className="mb-6">
              <RevisionHistory deliverableId={deliverable.id} portalToken={session.token} />
            </div>

            {/* Actions */}
            {deliverable.status === "in_review" && (
              <div className="flex flex-col gap-4 rounded-xl border border-[rgb(var(--border-default))] bg-white p-6 shadow-sm">
                <h4 className="text-sm font-bold text-[rgb(var(--text-primary))]">
                  Actions Required
                </h4>
                {showRevisionInput ? (
                  <div className="space-y-4">
                    <textarea
                      value={revisionComment}
                      onChange={(e) => setRevisionComment(e.target.value)}
                      placeholder="Please describe the core changes requested..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-[rgb(var(--border-default))] p-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => void handleRequestRevision()}
                        disabled={!revisionComment.trim() || requestRevisionMutation.isPending}
                      >
                        Submit Revision Request
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowRevisionInput(false);
                          setRevisionComment("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button
                      size="lg"
                      className="flex-1 gap-2"
                      onClick={() => void handleApprove()}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-5 w-5" />
                      {approveMutation.isPending ? "Approving..." : "Approve Deliverable"}
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="flex-1 gap-2"
                      onClick={() => setShowRevisionInput(true)}
                    >
                      <RotateCcw className="h-5 w-5" />
                      Request Revisions
                    </Button>
                  </div>
                )}
              </div>
            )}

            {deliverable.status === "approved" && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-6 py-4">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-emerald-900">Approved</p>
                  <p className="text-xs text-emerald-700">
                    This deliverable has been signed off and is ready for the next phase.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Sidebar */}
          {showFeedback && (
            <div className="w-80 shrink-0">
              <FeedbackPanel
                deliverableId={deliverable.id}
                pins={pins}
                activePinId={activePinId}
                onClose={() => {
                  setShowFeedback(false);
                  setActivePinId(null);
                }}
                createMutation={createFeedback}
                resolveMutation={resolveFeedback}
              />
            </div>
          )}
        </div>

        <div className="mt-8">
          <PoweredByBadge plan={workspace.plan} />
        </div>
      </main>
    </div>
  );
}

export default function DeliverableReviewPage({
  params,
}: {
  params: { portalToken: string; deliverableId: string };
}) {
  return (
    <PortalSessionProvider portalToken={params.portalToken}>
      <DeliverableReviewContent deliverableId={params.deliverableId} />
    </PortalSessionProvider>
  );
}
