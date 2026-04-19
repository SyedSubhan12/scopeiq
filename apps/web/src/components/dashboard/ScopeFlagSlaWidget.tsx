"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ShieldAlert, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@novabots/ui";
import { fetchWithAuth } from "@/lib/api";
import { formatDistanceToNow, isPast, differenceInHours } from "date-fns";

const QUERY_KEY = ["scope-flags", "sla-breaches"] as const;
const MAX_VISIBLE = 5;

interface SlaFlag {
    id: string;
    title: string;
    severity: string;
    slaDeadline: string | null;
    slaBreached: boolean;
    createdAt: string;
    projectId: string;
}

interface SlaFlagsResponse {
    data: SlaFlag[];
}

async function fetchSlaFlags(): Promise<SlaFlagsResponse> {
    return fetchWithAuth("/v1/scope-flags/sla-breaches") as Promise<SlaFlagsResponse>;
}

function getBreachColor(flag: SlaFlag): {
    indicator: string;
    label: string;
    labelClass: string;
} {
    if (flag.slaBreached || (flag.slaDeadline && isPast(new Date(flag.slaDeadline)))) {
        return {
            indicator: "bg-red-500",
            label: "Breached",
            labelClass: "text-red-600",
        };
    }
    if (!flag.slaDeadline) {
        return {
            indicator: "bg-gray-400",
            label: "No deadline",
            labelClass: "text-[rgb(var(--text-muted))]",
        };
    }
    const hoursLeft = differenceInHours(new Date(flag.slaDeadline), new Date());
    if (hoursLeft <= 24) {
        return {
            indicator: "bg-amber-400",
            label: `${hoursLeft}h left`,
            labelClass: "text-amber-600",
        };
    }
    return {
        indicator: "bg-emerald-500",
        label: `${hoursLeft}h left`,
        labelClass: "text-emerald-600",
    };
}

function CountdownBadge({ slaDeadline, slaBreached }: { slaDeadline: string | null; slaBreached: boolean }) {
    if (slaBreached) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                <AlertTriangle className="h-3 w-3" />
                SLA Breached
            </span>
        );
    }
    if (!slaDeadline) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                <Clock className="h-3 w-3" />
                No SLA set
            </span>
        );
    }
    const deadline = new Date(slaDeadline);
    const breached = isPast(deadline);
    const label = breached
        ? "Overdue"
        : `Due ${formatDistanceToNow(deadline, { addSuffix: true })}`;
    const cls = breached
        ? "bg-red-50 text-red-600"
        : differenceInHours(deadline, new Date()) <= 24
          ? "bg-amber-50 text-amber-600"
          : "bg-emerald-50 text-emerald-600";

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            <Clock className="h-3 w-3" />
            {label}
        </span>
    );
}

export function ScopeFlagSlaWidget() {
    const { data, isLoading, error } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: fetchSlaFlags,
        refetchInterval: 5 * 60 * 1000, // refresh every 5 min
        staleTime: 60 * 1000,
    });

    const flags = (data?.data ?? []).slice(0, MAX_VISIBLE);

    return (
        <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-[rgb(var(--border-subtle))] px-5 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                    <ShieldAlert className="h-4 w-4" />
                    SLA Status
                </h3>
                <Link
                    href="/scope-flags"
                    className="text-xs font-medium text-[rgb(var(--brand-primary))] hover:underline"
                >
                    View all
                </Link>
            </div>

            {isLoading && (
                <div className="space-y-3 px-5 py-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 animate-pulse rounded-lg bg-[rgb(var(--surface-secondary))]" />
                    ))}
                </div>
            )}

            {error && (
                <div className="px-5 py-8 text-center text-sm text-[rgb(var(--text-muted))]">
                    Failed to load SLA data.
                </div>
            )}

            {!isLoading && !error && flags.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                        <ShieldAlert className="h-5 w-5 text-emerald-500" />
                    </span>
                    <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">All clear</p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">No open scope flags</p>
                </div>
            )}

            {!isLoading && !error && flags.length > 0 && (
                <ul className="divide-y divide-[rgb(var(--border-subtle))]">
                    {flags.map((flag) => {
                        const { indicator } = getBreachColor(flag);
                        return (
                            <li key={flag.id}>
                                <Link
                                    href={`/scope-flags?id=${flag.id}`}
                                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[rgb(var(--surface-secondary))]"
                                >
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${indicator}`} aria-hidden />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-[rgb(var(--text-primary))]">
                                            {flag.title}
                                        </p>
                                    </div>
                                    <CountdownBadge
                                        slaDeadline={flag.slaDeadline}
                                        slaBreached={flag.slaBreached}
                                    />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}
