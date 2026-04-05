"use client";

import { useState } from "react";
import { FileSignature, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button, Card, useToast } from "@novabots/ui";

interface ChangeOrder {
    id: string;
    title: string;
    description: string | null;
    amount: number | null;
    status: string;
    sentAt: string | null;
}

interface ChangeOrderViewProps {
    changeOrder: ChangeOrder;
    portalToken: string;
    onResponded: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ChangeOrderView({ changeOrder, portalToken, onResponded }: ChangeOrderViewProps) {
    const [mode, setMode] = useState<"view" | "accept" | "decline">("view");
    const [signatureName, setSignatureName] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [responded, setResponded] = useState<"accepted" | "declined" | null>(null);
    const { toast } = useToast();

    const handleAccept = async () => {
        if (!signatureName.trim() || !agreed) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/portal/change-orders/${changeOrder.id}/accept`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Portal-Token": portalToken,
                },
                body: JSON.stringify({ signatureName: signatureName.trim() }),
            });
            if (!res.ok) throw new Error("Failed to accept");
            setResponded("accepted");
            toast("success", "Change order accepted");
            setTimeout(onResponded, 2000);
        } catch {
            toast("error", "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/portal/change-orders/${changeOrder.id}/decline`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Portal-Token": portalToken,
                },
                body: JSON.stringify({ reason: declineReason.trim() || undefined }),
            });
            if (!res.ok) throw new Error("Failed to decline");
            setResponded("declined");
            toast("success", "Change order declined");
            setTimeout(onResponded, 2000);
        } catch {
            toast("error", "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (responded === "accepted") {
        return (
            <Card className="p-8 text-center">
                <CheckCircle className="mx-auto h-14 w-14 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">Change Order Accepted</h3>
                <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
                    Your agreement has been recorded. Your agency will proceed with the additional work.
                </p>
            </Card>
        );
    }

    if (responded === "declined") {
        return (
            <Card className="p-8 text-center">
                <XCircle className="mx-auto h-14 w-14 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">Change Order Declined</h3>
                <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
                    Your agency has been notified. They will follow up shortly to discuss next steps.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* CO Summary */}
            <Card className="overflow-hidden p-0">
                <div className="flex items-center gap-3 border-b border-[rgb(var(--border-subtle))] bg-amber-50 px-6 py-4">
                    <FileSignature className="h-5 w-5 text-amber-600" />
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Change Order Request</p>
                        <h3 className="text-base font-bold text-amber-900">{changeOrder.title}</h3>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {changeOrder.description && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))] mb-1">
                                Work Description
                            </p>
                            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                                {changeOrder.description}
                            </p>
                        </div>
                    )}

                    {changeOrder.amount != null && (
                        <div className="flex items-center gap-4 rounded-xl bg-[rgb(var(--surface-subtle))] p-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                                    Additional Cost
                                </p>
                                <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                                    ${changeOrder.amount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Actions */}
            {mode === "view" && (
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                        size="lg"
                        className="flex-1 gap-2"
                        onClick={() => setMode("accept")}
                    >
                        <CheckCircle className="h-5 w-5" />
                        Accept Change Order
                    </Button>
                    <Button
                        size="lg"
                        variant="secondary"
                        className="flex-1 gap-2"
                        onClick={() => setMode("decline")}
                    >
                        <XCircle className="h-5 w-5" />
                        Decline
                    </Button>
                </div>
            )}

            {mode === "accept" && (
                <Card className="p-6 space-y-4">
                    <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            By typing your name and checking the box below, you agree to the additional work and cost described above.
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[rgb(var(--text-secondary))] mb-1.5">
                            Type your full name as signature
                        </label>
                        <input
                            type="text"
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-[rgb(var(--border-default))] accent-primary"
                        />
                        <span className="text-sm text-[rgb(var(--text-secondary))]">
                            I agree to the additional work and associated cost described in this change order.
                        </span>
                    </label>
                    <div className="flex gap-3">
                        <Button
                            size="sm"
                            onClick={() => void handleAccept()}
                            disabled={!signatureName.trim() || !agreed || loading}
                            className="flex-1"
                        >
                            {loading ? "Submitting..." : "Confirm Acceptance"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setMode("view")}>
                            Back
                        </Button>
                    </div>
                </Card>
            )}

            {mode === "decline" && (
                <Card className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[rgb(var(--text-secondary))] mb-1.5">
                            Reason for declining (optional)
                        </label>
                        <textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Let us know your concerns..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-[rgb(var(--border-default))] p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void handleDecline()}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? "Submitting..." : "Confirm Decline"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setMode("view")}>
                            Back
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
