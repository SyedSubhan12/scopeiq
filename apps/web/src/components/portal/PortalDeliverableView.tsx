"use client";

import { useState } from "react";
import { Badge, useToast, Button } from "@novabots/ui";
import {
    CheckCircle,
    RotateCcw,
    Eye,
    FileImage,
    Video,
    Link2,
    X,
} from "lucide-react";
import { RevisionHistory } from "../approval/RevisionHistory";
import { DeliverableViewer } from "../approval/DeliverableViewer";
import { FeedbackPanel } from "../approval/FeedbackPanel";
import { RevisionCounter } from "../approval/RevisionCounter";
import {
    usePortalFeedback,
    useCreatePortalFeedback,
    useResolvePortalFeedback,
    usePortalApprove,
    usePortalRequestRevision
} from "@/hooks/usePortalFeedback";
import type { Deliverable } from "@/hooks/useDeliverables";

const statusMap: Record<string, { label: string; status: "active" | "pending" | "draft" }> = {
    not_started: { label: "Not Started", status: "draft" },
    draft: { label: "Draft", status: "draft" },
    delivered: { label: "Delivered", status: "pending" },
    in_review: { label: "Awaiting Review", status: "pending" },
    changes_requested: { label: "Changes Requested", status: "pending" },
    approved: { label: "Approved", status: "active" },
};

const typeIcons: Record<string, typeof FileImage> = {
    file: FileImage,
    figma: Link2,
    loom: Video,
    youtube: Video,
    link: Link2,
};

export function PortalDeliverableView({
    deliverable,
    portalToken,
}: {
    deliverable: Deliverable;
    portalToken: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [placingPin, setPlacingPin] = useState(false);
    const [activePinId, setActivePinId] = useState<string | null>(null);
    const [revisionComment, setRevisionComment] = useState("");
    const [showRevisionInput, setShowRevisionInput] = useState(false);

    const { toast } = useToast();

    // Hooks
    const { data: feedbackData } = usePortalFeedback(deliverable.id, portalToken);
    const createFeedback = useCreatePortalFeedback(deliverable.id, portalToken);
    const resolveFeedback = useResolvePortalFeedback(deliverable.id, portalToken);
    const approveMutation = usePortalApprove(deliverable.id, portalToken);
    const requestRevisionMutation = usePortalRequestRevision(deliverable.id, portalToken);

    const pins = feedbackData?.data ?? [];
    const statusInfo = statusMap[deliverable.status] ?? statusMap.in_review!;
    const TypeIcon = typeIcons[deliverable.type] ?? FileImage;

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
                    pinNumber: pinNumber,
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
        <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border-default))] bg-white shadow-sm transition-all hover:shadow-md">
            {/* Header row */}
            <div
                className="flex cursor-pointer items-center justify-between px-6 py-5"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgb(var(--surface-subtle))] text-primary">
                        <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-[rgb(var(--text-primary))]">
                            {deliverable.name}
                        </p>
                        <RevisionCounter
                            current={deliverable.revisionRound}
                            limit={deliverable.maxRevisions}
                            className="mt-1 w-32"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Badge status={statusInfo.status}>{statusInfo.label}</Badge>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-muted))] transition-transform group-hover:bg-[rgb(var(--surface-hover))]">
                        <Eye className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </div>
                </div>
            </div>

            {/* Expanded view */}
            {expanded && (
                <div className="flex border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-default))]">
                    <div className="flex-1 p-6">
                        {/* Viewer */}
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

                        <div className="flex items-center justify-between mb-6">
                            <RevisionHistory deliverableId={deliverable.id} portalToken={portalToken} />
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPlacingPin(!placingPin)}
                                    className={placingPin ? "bg-primary/10 border-primary text-primary" : ""}
                                >
                                    <Badge status="pending" className="mr-2">Point-Anchor</Badge>
                                    {placingPin ? "Cancel Pin" : "Add Feedback Point"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowFeedback(!showFeedback)}
                                >
                                    Review Sidebar ({pins.length})
                                </Button>
                            </div>
                        </div>

                        {/* Actions */}
                        {deliverable.status === "in_review" && (
                            <div className="flex flex-col gap-4 rounded-xl border border-[rgb(var(--border-default))] bg-white p-6 shadow-sm">
                                <h4 className="text-sm font-bold text-[rgb(var(--text-primary))]">Actions Required</h4>
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
                                                onClick={() => { setShowRevisionInput(false); setRevisionComment(""); }}
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
                                    <p className="text-xs text-emerald-700">This deliverable has been signed off and is ready for the next phase.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Feedback Sidebar */}
                    {showFeedback && (
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
                    )}
                </div>
            )}
        </div>
    );
}
