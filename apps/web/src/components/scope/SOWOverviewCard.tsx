import { FileText, Scale, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, Badge, Skeleton } from "@novabots/ui";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

interface Clause {
    id: string;
    clauseType: "deliverable" | "revision_limit" | "timeline" | "exclusion" | "payment_term" | "other";
    originalText: string;
    summary: string | null;
}

interface SOW {
    id: string;
    title: string;
    clauses: Clause[];
}

export function SOWOverviewCard({ projectId, onUploadClick }: { projectId: string; onUploadClick?: () => void }) {
    const { data: sow, isLoading } = useQuery<SOW | null>({
        queryKey: ["projects", projectId, "sow"],
        queryFn: async () => {
            const res = await fetchWithAuth(`/v1/projects/${projectId}/sow`) as { data: SOW | null };
            return res.data ?? null;
        }
    });

    if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
    if (!sow) return (
        <Card className="border-dashed p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-[rgb(var(--text-muted))]" />
            <p className="text-sm text-[rgb(var(--text-muted))]">No SOW attached to this project.</p>
            {onUploadClick && (
                <button
                    onClick={onUploadClick}
                    className="mt-3 text-xs font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                >
                    + Attach Statement of Work
                </button>
            )}
        </Card>
    );

    return (
        <Card className="p-0 overflow-hidden border-[rgb(var(--border-default))]">
            <div className="bg-[rgb(var(--surface-subtle))] border-b border-[rgb(var(--border-subtle))] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider">Statement of Work</h3>
                </div>
                <Badge status="active">ACTIVE</Badge>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid gap-3">
                    {sow.clauses.map((clause) => (
                        <div key={clause.id} className="flex items-start gap-3 p-3 rounded-lg border border-[rgb(var(--border-subtle))] bg-white/50">
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-light/30">
                                <Scale className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-primary uppercase">{clause.clauseType.replace('_', ' ')}</span>
                                </div>
                                <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed line-clamp-2">
                                    {clause.summary || clause.originalText}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-[rgb(var(--text-muted))] font-medium uppercase tracking-widest bg-[rgb(var(--surface-subtle))] px-3 py-2 rounded-md">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    Indexed by ScopeIQ Intelligence
                </div>
            </div>
        </Card>
    );
}
