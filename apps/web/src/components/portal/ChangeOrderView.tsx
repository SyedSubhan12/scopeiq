"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    Download,
    PenLine,
    FileSignature,
} from "lucide-react";
import { Button, Dialog, useToast } from "@novabots/ui";
import { ChangeOrderPDF } from "./ChangeOrderPDF";

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

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(iso));
}

export function ChangeOrderView({ changeOrder, portalToken, onResponded }: ChangeOrderViewProps) {
    const [mode, setMode] = useState<"view" | "accept" | "decline">("view");
    const [signatureName, setSignatureName] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [responded, setResponded] = useState<"accepted" | "declined" | null>(null);
    const [pdfOpen, setPdfOpen] = useState(false);
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
            setTimeout(onResponded, 3000);
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

    /* ── Post-response states ──────────────────────────── */

    if (responded === "accepted") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="mx-auto max-w-lg rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-lg"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"
                >
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">Change Order Accepted</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                    Your digital signature has been recorded. Your agency will proceed with the additional scope.
                </p>
                <button
                    type="button"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border-subtle))] px-5 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--surface-subtle))]"
                    onClick={() => setPdfOpen(true)}
                >
                    <Download className="h-4 w-4" />
                    Download signed copy
                </button>
                <Dialog
                    open={pdfOpen}
                    onClose={() => setPdfOpen(false)}
                    title="Change Order Document"
                >
                    <ChangeOrderPDF
                        changeOrder={{
                            id: changeOrder.id,
                            title: changeOrder.title,
                            description: changeOrder.description ?? "",
                            amount: changeOrder.amount ?? 0,
                            sentAt: changeOrder.sentAt,
                            workspaceName: "Your Agency",
                            clientName: "Client",
                        }}
                        {...(signatureName ? { signatureName } : {})}
                    />
                </Dialog>
            </motion.div>
        );
    }

    if (responded === "declined") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="mx-auto max-w-lg rounded-3xl border border-[rgb(var(--border-subtle))] bg-white p-10 text-center shadow-sm"
            >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))]">
                    <XCircle className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                </div>
                <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">Change Order Declined</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                    Your agency has been notified. They will follow up shortly to discuss next steps.
                </p>
            </motion.div>
        );
    }

    /* ── Main document view ────────────────────────────── */

    return (
        <div className="mx-auto max-w-2xl space-y-5">

            {/* Document card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-3xl border border-[rgb(var(--border-subtle))] bg-white shadow-[0_2px_16px_0_rgba(0,0,0,0.06)]"
            >
                {/* Document header stamp */}
                <div className="border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-8 py-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 mb-3">
                                <FileSignature className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">
                                    Change Order
                                </span>
                            </div>
                            <h2 className="text-xl font-bold leading-tight text-[rgb(var(--text-primary))]">
                                {changeOrder.title}
                            </h2>
                        </div>
                        {/* Status badge */}
                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            Awaiting Approval
                        </span>
                    </div>

                    {/* Meta row */}
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">Issued</p>
                            <p className="mt-0.5 font-medium text-[rgb(var(--text-primary))]">
                                {formatDate(changeOrder.sentAt)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">Reference</p>
                            <p className="mt-0.5 font-mono text-sm font-medium text-[rgb(var(--text-primary))]">
                                CO-{changeOrder.id.slice(-6).toUpperCase()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">Status</p>
                            <p className="mt-0.5 font-medium text-amber-700">Pending signature</p>
                        </div>
                    </div>
                </div>

                {/* Scope of work */}
                {changeOrder.description && (
                    <div className="px-8 py-6 border-b border-[rgb(var(--border-subtle))]">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                            Scope of Additional Work
                        </p>
                        <p className="text-sm leading-7 text-[rgb(var(--text-secondary))]">
                            {changeOrder.description}
                        </p>
                    </div>
                )}

                {/* Pricing table */}
                {changeOrder.amount != null && (
                    <div className="px-8 py-6 border-b border-[rgb(var(--border-subtle))]">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                            Cost Summary
                        </p>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgb(var(--border-subtle))] text-left">
                                    <th className="pb-2 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))] pr-4">Description</th>
                                    <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-[rgb(var(--border-subtle))]">
                                    <td className="py-3 pr-4 text-[rgb(var(--text-secondary))]">
                                        {changeOrder.title}
                                    </td>
                                    <td className="py-3 text-right font-medium text-[rgb(var(--text-primary))]">
                                        ${changeOrder.amount.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {/* Total row */}
                        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[rgb(var(--surface-subtle))] px-5 py-4">
                            <span className="text-sm font-bold text-[rgb(var(--text-primary))]">Total Additional Cost</span>
                            <span className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                                ${changeOrder.amount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Timeline impact banner */}
                <div className="mx-8 my-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                        <p className="text-xs font-bold text-amber-900">Timeline Impact</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                            Accepting this change order may extend the project timeline. Your agency will provide
                            an updated schedule upon approval.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Action area */}
            <AnimatePresence mode="wait">
                {mode === "view" && (
                    <motion.div
                        key="actions"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-3 sm:flex-row"
                    >
                        <Button
                            size="lg"
                            className="flex-1 gap-2"
                            onClick={() => setMode("accept")}
                        >
                            <PenLine className="h-4 w-4" />
                            Sign & Accept
                        </Button>
                        <Button
                            size="lg"
                            variant="secondary"
                            className="flex-1 gap-2"
                            onClick={() => setMode("decline")}
                        >
                            <XCircle className="h-4 w-4" />
                            Decline
                        </Button>
                        <Button
                            size="lg"
                            variant="ghost"
                            className="gap-2"
                            onClick={() => setPdfOpen(true)}
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </motion.div>
                )}

                {/* PDF preview modal */}
                <Dialog
                    open={pdfOpen}
                    onClose={() => setPdfOpen(false)}
                    title="Change Order Document"
                >
                    <ChangeOrderPDF
                        changeOrder={{
                            id: changeOrder.id,
                            title: changeOrder.title,
                            description: changeOrder.description ?? "",
                            amount: changeOrder.amount ?? 0,
                            sentAt: changeOrder.sentAt,
                            workspaceName: "Your Agency",
                            clientName: "Client",
                        }}
                    />
                </Dialog>

                {mode === "accept" && (
                    <motion.div
                        key="sign"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden rounded-3xl border border-[rgb(var(--border-subtle))] bg-white shadow-sm"
                    >
                        <div className="border-b border-[rgb(var(--border-subtle))] px-6 py-4">
                            <div className="flex items-center gap-2">
                                <PenLine className="h-4 w-4 text-[rgb(var(--primary))]" />
                                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                                    Digital Signature
                                </p>
                            </div>
                            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                                Type your full legal name to sign this change order.
                            </p>
                        </div>
                        <div className="space-y-5 px-6 py-6">
                            {/* Signature input */}
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={signatureName}
                                    onChange={(e) => setSignatureName(e.target.value)}
                                    placeholder="e.g. Jane Smith"
                                    className="h-12 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-white px-4 font-serif text-lg italic text-[rgb(var(--text-primary))] outline-none transition-all focus:border-[rgb(var(--primary))]/50 focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
                                />
                                {signatureName && (
                                    <p className="mt-2 text-right font-serif text-lg italic text-[rgb(var(--primary))]">
                                        {signatureName}
                                    </p>
                                )}
                            </div>

                            {/* Agreement checkbox */}
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-[rgb(var(--border-default))] accent-[rgb(var(--primary))]"
                                />
                                <span className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                                    I agree to the additional scope, cost, and terms described in this change order, and
                                    acknowledge that my typed name constitutes a legally binding digital signature.
                                </span>
                            </label>

                            {/* Buttons */}
                            <div className="flex gap-3 border-t border-[rgb(var(--border-subtle))] pt-5">
                                <Button
                                    size="md"
                                    onClick={() => void handleAccept()}
                                    disabled={!signatureName.trim() || !agreed || loading}
                                    className="flex-1 gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    {loading ? "Submitting…" : "Confirm & Sign"}
                                </Button>
                                <Button
                                    size="md"
                                    variant="ghost"
                                    onClick={() => setMode("view")}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {mode === "decline" && (
                    <motion.div
                        key="decline"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden rounded-3xl border border-[rgb(var(--border-subtle))] bg-white shadow-sm"
                    >
                        <div className="border-b border-[rgb(var(--border-subtle))] px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                                    Decline Change Order
                                </p>
                            </div>
                            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                                Your agency will be notified. Optionally share your reason below.
                            </p>
                        </div>
                        <div className="space-y-4 px-6 py-6">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                                    Reason (optional)
                                </label>
                                <textarea
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    placeholder="Help your agency understand your concerns…"
                                    rows={4}
                                    className="w-full resize-none rounded-2xl border border-[rgb(var(--border-default))] p-4 text-sm outline-none transition-all focus:border-[rgb(var(--primary))]/50 focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
                                />
                            </div>
                            <div className="flex gap-3 border-t border-[rgb(var(--border-subtle))] pt-4">
                                <Button
                                    size="md"
                                    variant="secondary"
                                    onClick={() => void handleDecline()}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? "Submitting…" : "Confirm Decline"}
                                </Button>
                                <Button
                                    size="md"
                                    variant="ghost"
                                    onClick={() => setMode("view")}
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
