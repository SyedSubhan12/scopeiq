"use client";

import { useState } from "react";
import { Button, Badge, useToast } from "@novabots/ui";
import {
    CheckCircle,
    RotateCcw,
    Eye,
    FileImage,
    Video,
    Link2,
    X,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Deliverable {
    id: string;
    name: string;
    status: string;
    revisionCount: number;
    maxRevisions: number;
    fileUrl: string | null;
    mimeType: string | null;
    externalUrl: string | null;
    type: string;
}

const statusMap: Record<string, { label: string; status: "active" | "pending" | "draft" }> = {
    not_started: { label: "Not Started", status: "draft" },
    in_progress: { label: "In Progress", status: "pending" },
    in_review: { label: "Awaiting Review", status: "pending" },
    revision_requested: { label: "Revision Requested", status: "pending" },
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
    const [submitting, setSubmitting] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(deliverable.status);
    const [revisionComment, setRevisionComment] = useState("");
    const [showRevisionInput, setShowRevisionInput] = useState(false);
    const { toast } = useToast();

    const TypeIcon = typeIcons[deliverable.type] ?? FileImage;
    const statusInfo = statusMap[currentStatus] ?? statusMap.in_review!;

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/portal/deliverables/${deliverable.id}/approve`,
                {
                    method: "POST",
                    headers: { "X-Portal-Token": portalToken, "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                },
            );
            if (!res.ok) throw new Error("Failed");
            setCurrentStatus("approved");
            toast("success", "Deliverable approved!");
        } catch {
            toast("error", "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestRevision = async () => {
        if (!revisionComment.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/portal/deliverables/${deliverable.id}/request-revision`,
                {
                    method: "POST",
                    headers: { "X-Portal-Token": portalToken, "Content-Type": "application/json" },
                    body: JSON.stringify({ comment: revisionComment.trim() }),
                },
            );
            if (!res.ok) throw new Error("Failed");
            setCurrentStatus("revision_requested");
            setShowRevisionInput(false);
            toast("success", "Revision requested");
        } catch {
            toast("error", "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-default))] bg-white shadow-sm transition-shadow hover:shadow-md">
            {/* Header row */}
            <div
                className="flex cursor-pointer items-center justify-between px-5 py-4"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgb(var(--surface-subtle))]">
                        <TypeIcon className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                            {deliverable.name}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">
                            Revision {deliverable.revisionCount} / {deliverable.maxRevisions}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge status={statusInfo.status}>{statusInfo.label}</Badge>
                    <Eye className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                </div>
            </div>

            {/* Expanded view */}
            {expanded && (
                <div className="border-t border-[rgb(var(--border-subtle))] px-5 py-5">
                    {/* Preview */}
                    {deliverable.fileUrl && deliverable.mimeType?.startsWith("image/") && (
                        <div className="mb-4 overflow-hidden rounded-lg border border-[rgb(var(--border-default))]">
                            <img
                                src={deliverable.fileUrl}
                                alt={deliverable.name}
                                className="w-full object-contain"
                                style={{ maxHeight: 400 }}
                            />
                        </div>
                    )}

                    {deliverable.externalUrl && (
                        <div className="mb-4">
                            <a
                                href={deliverable.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                                <Link2 className="h-3.5 w-3.5" />
                                Open in {deliverable.type === "figma" ? "Figma" : "new tab"}
                            </a>
                        </div>
                    )}

                    {/* Action buttons */}
                    {currentStatus === "in_review" && (
                        <div className="border-t border-[rgb(var(--border-subtle))] pt-4">
                            {showRevisionInput ? (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">
                                        What needs to change?
                                    </label>
                                    <textarea
                                        value={revisionComment}
                                        onChange={(e) => setRevisionComment(e.target.value)}
                                        placeholder="Describe the changes needed..."
                                        rows={3}
                                        className="w-full resize-none rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => void handleRequestRevision()}
                                            disabled={!revisionComment.trim() || submitting}
                                        >
                                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                            {submitting ? "Submitting..." : "Submit Revision Request"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => { setShowRevisionInput(false); setRevisionComment(""); }}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        onClick={() => void handleApprove()}
                                        disabled={submitting}
                                    >
                                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowRevisionInput(true)}
                                    >
                                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                        Request Revision
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStatus === "approved" && (
                        <div className="flex items-center gap-2 border-t border-[rgb(var(--border-subtle))] pt-4">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-600">
                                You approved this deliverable
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
