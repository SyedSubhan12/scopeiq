import { TrendingUp, AlertCircle, ShieldCheck, DollarSign, Activity } from "lucide-react";
import { Card, Badge, Skeleton } from "@novabots/ui";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

interface PortfolioStats {
    activeProjects: number;
    pendingFlags: number;
    avgBriefScore: number;
    revenueAtRisk: number;
}

export function PortfolioHealth({ workspaceId }: { workspaceId: string }) {
    const { data: stats, isLoading } = useQuery<{ data: PortfolioStats }>({
        queryKey: ["analytics", "portfolio", workspaceId],
        queryFn: () => fetchWithAuth("/analytics/portfolio") as Promise<{ data: PortfolioStats }>,
    });

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    const { activeProjects, pendingFlags, avgBriefScore, revenueAtRisk } = stats?.data || {
        activeProjects: 0,
        pendingFlags: 0,
        avgBriefScore: 0,
        revenueAtRisk: 0,
    };

    return (
        <div className="space-y-8">
            {/* High-Level KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Projects"
                    value={activeProjects}
                    icon={Activity}
                    trend="+12%"
                    trendLabel="vs last month"
                />
                <StatCard
                    title="System Flags"
                    value={pendingFlags}
                    icon={AlertCircle}
                    color="text-status-red"
                    trend={pendingFlags > 5 ? "HIGH" : "LOW"}
                    trendColor={pendingFlags > 5 ? "text-status-red" : "text-emerald-500"}
                />
                <StatCard
                    title="Avg Brief Clarity"
                    value={`${avgBriefScore}%`}
                    icon={ShieldCheck}
                    color="text-primary"
                    trendLabel="Target: 80%+"
                />
                <StatCard
                    title="Revenue at Risk"
                    value={`$${(revenueAtRisk / 1000).toFixed(1)}k`}
                    icon={DollarSign}
                    color="text-amber-500"
                    trendLabel="Linked to pending flags"
                />
            </div>

            {/* Portfolio Risk Heatmap - Conceptual implementation */}
            <Card className="overflow-hidden border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] p-4 sm:p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">Portfolio Risk Heatmap</h3>
                        <p className="text-sm text-[rgb(var(--text-muted))]">AI-weighted project status based on scope deviations and budget exposure.</p>
                    </div>
                    <Badge status="active" className="w-fit tracking-widest">REAL-TIME</Badge>
                </div>

                <div className="space-y-4">
                    {/* Placeholder for a more complex visualization */}
                    <div className="h-48 w-full rounded-xl bg-gradient-to-br from-[rgb(var(--surface-default))] to-[rgb(var(--surface-subtle))] border border-dashed border-[rgb(var(--border-subtle))] flex items-center justify-center">
                        <div className="text-center">
                            <TrendingUp className="h-8 w-8 text-[rgb(var(--text-muted))] mx-auto mb-2 opacity-20" />
                            <p className="text-xs text-[rgb(var(--text-muted))] uppercase font-bold tracking-[0.2em] opacity-40">Intelligence Visualization Engine</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color = "text-[rgb(var(--text-primary))]",
    trend,
    trendLabel,
    trendColor = "text-emerald-500"
}: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    trend?: string;
    trendLabel?: string;
    trendColor?: string;
}) {
    return (
        <Card className="p-5 flex flex-col justify-between border-[rgb(var(--border-subtle))] hover:border-primary/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">{title}</p>
                <div className="h-8 w-8 rounded-lg bg-[rgb(var(--surface-subtle))] flex items-center justify-center group-hover:bg-primary-light/20 transition-colors">
                    <Icon className={`h-4.4 w-4 ${color}`} />
                </div>
            </div>
            <div>
                <h4 className={`text-2xl font-black mb-1 ${color}`}>{value}</h4>
                <div className="flex items-center gap-1.5">
                    {trend && <span className={`text-[10px] font-bold ${trendColor}`}>{trend}</span>}
                    {trendLabel && <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium">{trendLabel}</span>}
                </div>
            </div>
        </Card>
    );
}
