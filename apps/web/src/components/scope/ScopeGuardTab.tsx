import { useState } from "react";
import { ShieldAlert, CheckCircle, Plus, FileText, X, Send } from "lucide-react";
import { Card, Badge, Button, Skeleton, useToast } from "@novabots/ui";
import { useScopeFlags, useUpdateScopeFlag, type ScopeFlag } from "@/hooks/useScopeFlags";
import { useCreateChangeOrder } from "@/hooks/change-orders";
import { fetchWithAuth } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { SOWOverviewCard } from "./SOWOverviewCard";

export function ScopeGuardTab({ projectId }: { projectId: string }) {
    const { data, isLoading } = useScopeFlags(projectId);
    const [showSOWInput, setShowSOWInput] = useState(false);

    const flags = data?.data ?? [];
    const pendingFlags = flags.filter((f: any) => f.status === "pending");
    const resolvedFlags = flags.filter((f: any) => ["resolved", "change_order_sent", "dismissed"].includes(f.status));

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <SOWOverviewCard projectId={projectId} onUploadClick={() => setShowSOWInput(true)} />

            {showSOWInput && (
                <SOWUploadCard projectId={projectId} onClose={() => setShowSOWInput(false)} />
            )}

            {/* Pending Review */}
            <section>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))]">
                    <ShieldAlert className="h-4 w-4 text-status-red" />
                    PENDING REVIEW ({pendingFlags.length})
                </h3>
                <div className="grid gap-4">
                    {pendingFlags.length > 0 ? (
                        pendingFlags.map((flag: any) => (
                            <FlagCard key={flag.id} flag={flag} projectId={projectId} />
                        ))
                    ) : (
                        <Card className="py-8 text-center text-sm text-[rgb(var(--text-muted))]">
                            No pending scope flags for this project.
                        </Card>
                    )}
                </div>
            </section>

            <MessageIngestInput projectId={projectId} />

            {resolvedFlags.length > 0 && (
                <section>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))]">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        RESOLVED / PROCESSED
                    </h3>
                    <div className="grid gap-3">
                        {resolvedFlags.map((flag: any) => (
                            <Card key={flag.id} className="border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge status={flag.status === "resolved" ? "active" : "pending"}>
                                            {flag.status.replace("_", " ")}
                                        </Badge>
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{flag.title}</p>
                                    </div>
                                    <p className="text-xs text-[rgb(var(--text-muted))]">
                                        {formatDistanceToNow(new Date(flag.updatedAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function SOWUploadCard({ projectId, onClose }: { projectId: string; onClose: () => void }) {
    const [title, setTitle] = useState("");
    const [rawText, setRawText] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const handleSubmit = async () => {
        if (!title.trim() || !rawText.trim()) {
            toast("error", "Please provide a title and SOW text.");
            return;
        }
        setLoading(true);
        try {
            await fetchWithAuth("/v1/sow", {
                method: "POST",
                body: JSON.stringify({ projectId, title: title.trim(), rawText: rawText.trim() }),
            });
            toast("success", "SOW uploaded and indexed by ScopeIQ.");
            await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "sow"] });
            onClose();
        } catch {
            toast("error", "Failed to upload SOW. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-5 py-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">Attach Statement of Work</h3>
                </div>
                <button onClick={onClose} className="rounded p-1 hover:bg-[rgb(var(--border-default))]">
                    <X className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                </button>
            </div>
            <div className="space-y-4 p-5">
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-[rgb(var(--text-secondary))]">
                        SOW Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Brand Identity Project SOW v1.2"
                        className="w-full rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-[rgb(var(--text-secondary))]">
                        Paste SOW Text
                    </label>
                    <p className="mb-2 text-xs text-[rgb(var(--text-muted))]">
                        Paste the full SOW text. ScopeIQ will parse it into structured clauses for scope monitoring.
                    </p>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste your Statement of Work text here..."
                        rows={8}
                        className="w-full resize-none rounded-xl border border-[rgb(var(--border-default))] p-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex gap-3">
                    <Button
                        size="sm"
                        onClick={() => void handleSubmit()}
                        disabled={loading || !title.trim() || !rawText.trim()}
                    >
                        {loading ? "Uploading..." : "Upload & Index SOW"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function FlagCard({ flag, projectId }: { flag: any; projectId: string }) {
    const updateFlag = useUpdateScopeFlag(flag.id);
    const createCO = useCreateChangeOrder();
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();

    const handleStatusUpdate = async (status: ScopeFlag["status"]) => {
        setIsUpdating(true);
        try {
            await updateFlag.mutateAsync({ status });
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePromoteToCO = async () => {
        setIsUpdating(true);
        try {
            await createCO.mutateAsync({
                projectId,
                scopeFlagId: flag.id,
                title: flag.title,
                description: flag.description ?? undefined,
            });
            await updateFlag.mutateAsync({ status: "change_order_sent" });
            toast("success", "Change order created from this scope flag.");
        } catch {
            toast("error", "Failed to create change order.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card className="border-l-4 border-l-status-red p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge status="flagged" className="text-[10px] uppercase tracking-wider">{flag.severity}</Badge>
                        <span className="text-[10px] font-medium text-[rgb(var(--text-muted))]">
                            {new Date(flag.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <h4 className="text-base font-bold text-[rgb(var(--text-primary))]">{flag.title}</h4>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                        {flag.description || "This request falls outside the original scope agreed upon in the project brief."}
                    </p>

                    {flag.source === "ai_audit" && flag.metadata && (
                        <div className="mt-4 rounded-lg border border-primary-light/20 bg-primary-light/10 p-3">
                            <div className="mb-1.5 flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-primary">AI Insight</span>
                                <Badge status="active" className="origin-left scale-75">
                                    {Math.round((flag.metadata.confidence || 0) * 100)}% Confidence
                                </Badge>
                            </div>
                            <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                {flag.metadata.reasoning || "Identified as a potential scope deviation based on project clauses."}
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => void handleStatusUpdate("dismissed")}
                        disabled={isUpdating}
                    >
                        Dismiss
                    </Button>
                    <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => void handlePromoteToCO()}
                        disabled={isUpdating}
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Promote to CO
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function MessageIngestInput({ projectId }: { projectId: string }) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const handleCheck = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            await fetchWithAuth(`/v1/projects/${projectId}/messages/ingest`, {
                method: "POST",
                body: JSON.stringify({ text: text.trim() }),
            });
            toast("success", "Message queued for scope analysis. Flags will appear shortly.");
            setText("");
            setExpanded(false);
            setTimeout(() => {
                void queryClient.invalidateQueries({ queryKey: ["scope-flags", projectId] });
            }, 3000);
        } catch {
            toast("error", "Failed to queue message for analysis.");
        } finally {
            setLoading(false);
        }
    };

    if (!expanded) {
        return (
            <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-2 text-xs font-medium text-primary hover:opacity-80"
            >
                <Send className="h-3.5 w-3.5" />
                Check a client message against scope
            </button>
        );
    }

    return (
        <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[rgb(var(--text-secondary))] uppercase tracking-wider">Manual Scope Check</p>
                <button onClick={() => setExpanded(false)} className="rounded p-1 hover:bg-[rgb(var(--border-default))]">
                    <X className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />
                </button>
            </div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a client message to check against the SOW..."
                rows={3}
                className="w-full resize-none rounded-xl border border-[rgb(var(--border-default))] p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-2">
                <Button size="sm" onClick={() => void handleCheck()} disabled={loading || !text.trim()}>
                    {loading ? "Analyzing..." : "Analyze with AI"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>Cancel</Button>
            </div>
        </Card>
    );
}
