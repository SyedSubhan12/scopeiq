"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, useToast, Button } from "@novabots/ui";
import {
    CheckCircle,
    RotateCcw,
    FileImage,
    Video,
    Link2,
    X,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    MapPin,
} from "lucide-react";
import { RevisionHistory } from "../approval/RevisionHistory";
import { DeliverableViewer } from "../approval/DeliverableViewer";
import { FeedbackPanel } from "../approval/FeedbackPanel";
import { RevisionCounter } from "../approval/RevisionCounter";
import { RevisionLimitModal } from "../approval/RevisionLimitModal";
import { useRevisionLimitModal } from "@/stores/revision-limit-modal.store";
import {
    usePortalFeedback,
    useCreatePortalFeedback,
    useResolvePortalFeedback,
    usePortalApprove,
    usePortalRequestRevision,
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

function getRevisionUrgency(current: number, limit: number): "ok" | "warn" | "danger" {
    if (limit <= 0) return "ok";
    const pct = current / limit;
    if (pct >= 1) return "danger";
    if (pct >= 0.75) return "warn";
    return "ok";
}

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
    // close feedback panel when deliverable collapses
    useEffect(() => {
        if (!expanded) {
            setShowFeedback(false);
            setPlacingPin(false);
        }
    }, [expanded]);

    const openLimitModal = useRevisionLimitModal((s) => s.openModal);
    const { toast } = useToast();

    const { data: feedbackData } = usePortalFeedback(deliverable.id, portalToken);
    const createFeedback = useCreatePortalFeedback(deliverable.id, portalToken);
    const resolveFeedback = useResolvePortalFeedback(deliverable.id, portalToken);
    const approveMutation = usePortalApprove(deliverable.id, portalToken);
    const requestRevisionMutation = usePortalRequestRevision(deliverable.id, portalToken);

    const pins = feedbackData?.data ?? [];
    const statusInfo = statusMap[deliverable.status] ?? statusMap.in_review!;
    const TypeIcon = typeIcons[deliverable.type] ?? FileImage;
    const urgency = getRevisionUrgency(deliverable.revisionRound, deliverable.maxRevisions);

    const urgencyStyles = {
        ok: "text-emerald-700",
        warn: "text-amber-700",
        danger: "text-red-700",
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
        const atLimit =
            deliverable.revisionRound >= deliverable.maxRevisions && deliverable.maxRevisions > 0;
        if (atLimit) {
            openLimitModal({
                deliverableId: deliverable.id,
                deliverableName: deliverable.name,
                currentRound: deliverable.revisionRound,
                maxRevisions: deliverable.maxRevisions,
                projectId: "",
            });
            return;
        }
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
                annotationJson: { xPos: x, yPos: y, pinNumber },
            });
            setPlacingPin(false);
            setShowFeedback(true);
            toast("success", "Feedback point added");
        } catch {
            toast("error", "Failed to add feedback point");
        }
    };

    return (
        <>
            <motion.div
                layout
                className="overflow-hidden rounded-2xl border border-[rgb(var(--border-default))] bg-white shadow-sm transition-shadow hover:shadow-md"
            >
                {/* ── Header row (always visible) ───────────────────── */}
                <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left"
                    onClick={() => setExpanded((p) => !p)}
                    aria-expanded={expanded}
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgb(var(--surface-subtle))] text-[rgb(var(--primary))]">
                            <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-[rgb(var(--text-primary))]">
                                {deliverable.name}
                            </p>
                            {/* Inline revision counter (text-only, urgency coloured) */}
                            {deliverable.maxRevisions > 0 && (
                                <p className={`mt-0.5 text-xs font-medium ${urgencyStyles[urgency]}`}>
                                    {deliverable.revisionRound} / {deliverable.maxRevisions} revision
                                    {deliverable.revisionRound !== 1 ? "s" : ""} used
                                    {urgency === "danger" ? " — limit reached" : urgency === "warn" ? " — running low" : ""}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <Badge status={statusInfo.status}>{statusInfo.label}</Badge>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))] text-[rgb(var(--text-muted))]">
                            {expanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </span>
                    </div>
                </button>

                {/* ── Expanded content ──────────────────────────────── */}
                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            key="expanded"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="border-t border-[rgb(var(--border-subtle))]">
                                {/* Revision bar (detailed, only in expanded) */}
                                {deliverable.maxRevisions > 0 && (
                                    <div className="border-b border-[rgb(var(--border-subtle))] px-6 py-3">
                                        <RevisionCounter
                                            current={deliverable.revisionRound}
                                            limit={deliverable.maxRevisions}
                                        />
                                    </div>
                                )}

                                {/* Full-width viewer + sliding overlay */}
                                <div className="relative bg-[rgb(var(--surface-subtle))]">
                                    {/* Viewer — full width, taller on desktop */}
                                    <div
                                        className={`transition-all duration-300 ${showFeedback ? "lg:mr-[360px]" : ""}`}
                                        style={{ height: "480px" }}
                                    >
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

                                    {/* Sliding overlay panel — desktop (right drawer) */}
                                    <AnimatePresence>
                                        {showFeedback && (
                                            <motion.div
                                                key="feedback-drawer"
                                                initial={{ x: "100%" }}
                                                animate={{ x: 0 }}
                                                exit={{ x: "100%" }}
                                                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                                                className="absolute inset-y-0 right-0 hidden w-[360px] overflow-y-auto border-l border-[rgb(var(--border-subtle))] bg-white lg:block"
                                            >
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Mobile bottom sheet — feedback panel */}
                                <AnimatePresence>
                                    {showFeedback && (
                                        <>
                                            {/* Scrim */}
                                            <motion.div
                                                key="scrim"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                                                onClick={() => {
                                                    setShowFeedback(false);
                                                    setActivePinId(null);
                                                }}
                                            />
                                            {/* Sheet */}
                                            <motion.div
                                                key="sheet"
                                                initial={{ y: "100%" }}
                                                animate={{ y: 0 }}
                                                exit={{ y: "100%" }}
                                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                                className="fixed bottom-0 left-0 right-0 z-50 overflow-y-auto rounded-t-3xl bg-white shadow-2xl lg:hidden"
                                                style={{ maxHeight: "70vh" }}
                                            >
                                                {/* Sheet handle */}
                                                <div className="flex justify-center pt-3 pb-1">
                                                    <div className="h-1 w-10 rounded-full bg-[rgb(var(--border-default))]" />
                                                </div>
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
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>

                                {/* Toolbar row */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--border-subtle))] px-6 py-4">
                                    <RevisionHistory deliverableId={deliverable.id} portalToken={portalToken} />
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPlacingPin((p) => !p)}
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                                placingPin
                                                    ? "border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
                                                    : "border-[rgb(var(--border-default))] bg-white text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
                                            }`}
                                        >
                                            <MapPin className="h-3.5 w-3.5" />
                                            {placingPin ? "Cancel pin" : "Pin feedback"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowFeedback((p) => !p)}
                                            className="relative inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--border-default))] bg-white px-3.5 py-1.5 text-xs font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--surface-subtle))]"
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            Comments
                                            {pins.length > 0 && (
                                                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[rgb(var(--primary))] px-1 text-[9px] font-bold text-white">
                                                    {pins.length}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Action panel */}
                                {deliverable.status === "in_review" && (
                                    <div className="border-t border-[rgb(var(--border-subtle))] px-6 py-5">
                                        <AnimatePresence mode="wait">
                                            {showRevisionInput ? (
                                                <motion.div
                                                    key="revision-input"
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="space-y-3"
                                                >
                                                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                                                        Describe the changes needed
                                                    </p>
                                                    <textarea
                                                        value={revisionComment}
                                                        onChange={(e) => setRevisionComment(e.target.value)}
                                                        placeholder="Please describe the core changes you'd like…"
                                                        rows={4}
                                                        className="w-full resize-none rounded-2xl border border-[rgb(var(--border-default))] p-4 text-sm outline-none transition-all focus:border-[rgb(var(--primary))]/50 focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
                                                    />
                                                    <div className="flex gap-3">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => void handleRequestRevision()}
                                                            disabled={
                                                                !revisionComment.trim() ||
                                                                requestRevisionMutation.isPending
                                                            }
                                                            className="flex-1"
                                                        >
                                                            {requestRevisionMutation.isPending
                                                                ? "Submitting…"
                                                                : "Submit Request"}
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
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="action-buttons"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex flex-col gap-3 sm:flex-row"
                                                >
                                                    <Button
                                                        size="lg"
                                                        className="flex-1 gap-2"
                                                        onClick={() => void handleApprove()}
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        <CheckCircle className="h-5 w-5" />
                                                        {approveMutation.isPending
                                                            ? "Approving…"
                                                            : "Approve Deliverable"}
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
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {deliverable.status === "approved" && (
                                    <div className="flex items-center gap-3 border-t border-emerald-100 bg-emerald-50 px-6 py-5">
                                        <CheckCircle className="h-6 w-6 shrink-0 text-emerald-500" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900">Approved</p>
                                            <p className="text-xs text-emerald-700">
                                                This deliverable has been signed off and is ready for the next phase.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <RevisionLimitModal />
        </>
    );
}
