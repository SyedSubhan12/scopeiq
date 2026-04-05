import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { History, Download, FileText, User, ChevronDown, ChevronUp } from "lucide-react";
import { Card, Button, Badge, Skeleton } from "@novabots/ui";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

interface Revision {
    id: string;
    versionNumber: number;
    fileUrl: string;
    notes: string | null;
    createdAt: string;
    createdBy: string | null;
}

export function RevisionHistory({
    deliverableId,
    portalToken
}: {
    deliverableId: string;
    portalToken?: string;
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const { data: revisions, isLoading } = useQuery<Revision[]>({
        queryKey: ["deliverables", deliverableId, "revisions", portalToken],
        queryFn: async () => {
            const url = portalToken
                ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/portal/deliverables/${deliverableId}/revisions`
                : `/deliverables/${deliverableId}/revisions`;

            const headers: Record<string, string> = {};
            if (portalToken) {
                headers["X-Portal-Token"] = portalToken;
            }

            if (portalToken) {
                const res = await fetch(url, { headers });
                const json = await res.json();
                return json.data;
            }

            const res = await fetchWithAuth(url) as { data: unknown };
            return res.data;
        },
        enabled: isExpanded
    });

    return (
        <Card className="mt-4 overflow-hidden border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between p-4 text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    VERSION HISTORY {revisions?.length ? `(${revisions.length})` : ""}
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {isExpanded && (
                <div className="border-t border-[rgb(var(--border-subtle))] p-4">
                    {isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : revisions?.length === 0 ? (
                        <p className="text-center text-xs text-[rgb(var(--text-muted))] py-4">
                            No version history available.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {revisions?.map((rev, index) => (
                                <div key={rev.id} className="relative flex gap-4 pl-6 after:absolute after:left-[9px] after:top-6 after:bottom-[-20px] after:w-[2px] after:bg-[rgb(var(--border-subtle))] last:after:hidden">
                                    <div className="absolute left-0 top-1 h-[20px] w-[20px] rounded-full bg-white border-2 border-primary flex items-center justify-center z-10">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1 pb-4">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-sm font-bold text-[rgb(var(--text-primary))]">
                                                Version {rev.versionNumber}
                                                {index === 0 && <Badge status="active" className="ml-2 scale-75 origin-left">LATEST</Badge>}
                                            </h5>
                                            <span className="text-[10px] font-medium text-[rgb(var(--text-muted))] uppercase">
                                                {formatDistanceToNow(new Date(rev.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {rev.notes && (
                                            <p className="text-sm text-[rgb(var(--text-secondary))] bg-white/50 p-2 rounded-md border border-[rgb(var(--border-subtle))]">
                                                {rev.notes}
                                            </p>
                                        )}
                                        <div className="pt-1">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-7 text-[10px] px-2 py-0"
                                                onClick={() => window.open(rev.fileUrl, '_blank')}
                                            >
                                                <Download className="mr-1.5 h-3 w-3" />
                                                DOWNLOAD V{rev.versionNumber}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
