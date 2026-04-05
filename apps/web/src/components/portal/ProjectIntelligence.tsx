"use client";

import { ShieldCheck, Target, AlertCircle, Activity, Sparkles } from "lucide-react";
import { Card, Badge, cn } from "@novabots/ui";

interface ProjectIntelligenceProps {
    health: {
        healthScore: number;
        pendingFlags: number;
        avgBriefScore: number;
        status: string;
    };
}

export function ProjectIntelligence({ health }: ProjectIntelligenceProps) {
    const { healthScore, pendingFlags, avgBriefScore, status } = health;

    // Determine status color based on health score
    const healthColor = healthScore > 80 ? "text-emerald-500" : healthScore > 50 ? "text-amber-500" : "text-status-red";
    const healthBg = healthScore > 80 ? "bg-emerald-50" : healthScore > 50 ? "bg-amber-50" : "bg-red-50";

    return (
        <div className="mb-12 space-y-6">
            <div className="flex items-center gap-2 px-1">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] uppercase tracking-[0.2em]">Project Intelligence</h2>
                <Badge status="active" className="ml-2 text-[10px] bg-primary/10 text-primary border-none">AI POWERED</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Health Score Card */}
                <Card className="relative overflow-hidden border-[rgb(var(--border-subtle))] p-6 hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <Activity className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                        <span className={cn("text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter", healthBg, healthColor)}>
                            {healthScore > 80 ? "Optimal" : healthScore > 50 ? "Stable" : "At Risk"}
                        </span>
                    </div>
                    <div>
                        <h4 className="text-3xl font-black text-[rgb(var(--text-primary))] leading-none">
                            {healthScore}%
                        </h4>
                        <p className="mt-2 text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Global Health Index</p>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-all" style={{ width: `${healthScore}%` }} />
                </Card>

                {/* Clarity Score Card */}
                <Card className="border-[rgb(var(--border-subtle))] p-6 hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Brief Quality</span>
                    </div>
                    <div>
                        <h4 className="text-3xl font-black text-[rgb(var(--text-primary))] leading-none">
                            {avgBriefScore}%
                        </h4>
                        <p className="mt-2 text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">AI Clarity Score</p>
                    </div>
                </Card>

                {/* Risk / Flags Card */}
                <Card className="border-[rgb(var(--border-subtle))] p-6 hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <ShieldCheck className={cn("h-5 w-5", pendingFlags > 0 ? "text-amber-500" : "text-emerald-500")} />
                        <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Integrity</span>
                    </div>
                    <div>
                        <h4 className={cn("text-3xl font-black leading-none", pendingFlags > 0 ? "text-amber-500" : "text-emerald-500")}>
                            {pendingFlags === 0 ? "Protected" : `${pendingFlags} Flag${pendingFlags > 1 ? 's' : ''}`}
                        </h4>
                        <p className="mt-2 text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Active Scope Flags</p>
                    </div>
                </Card>
            </div>

            {pendingFlags > 0 && (
                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-900">Intelligence Nudge</p>
                        <p className="text-xs text-amber-800/80 leading-relaxed mt-1">
                            We've detected {pendingFlags} potential scope deviation{pendingFlags > 1 ? 's' : ''}.
                            Our team is currently reviewing these to ensure your project remains on track.
                            No action is required from your side at this moment.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
