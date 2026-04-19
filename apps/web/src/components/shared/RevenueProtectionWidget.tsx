"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, TrendingUp, FileText, BarChart2, TrendingDown } from "lucide-react";
import type { DashboardData } from "@/hooks/useDashboard";

const AVG_HOURLY_RATE = 150;
const AVG_HOURS_PER_FLAG = 2;
// Placeholder clarity score until the API returns it
const PLACEHOLDER_CLARITY_SCORE = 78;

function useCountUp(target: number, duration = 1200, active = true) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView || !active) return;
        if (target === 0) { setCount(0); return; }
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) { setCount(target); return; }

        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setCount(Math.floor(current));
            if (current >= target) { setCount(target); clearInterval(timer); }
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration, inView, active]);

    return { count, ref };
}

function AnimatedNumber({
    value,
    prefix,
    suffix,
    className,
    duration,
}: {
    value: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    duration?: number;
}) {
    const { count, ref } = useCountUp(value, duration);
    return (
        <span className={className}>
            {prefix}
            <span ref={ref}>{count.toLocaleString()}</span>
            {suffix}
        </span>
    );
}

function ClarityBadge({ score }: { score: number }) {
    const { count, ref } = useCountUp(score, 900);
    const color =
        score >= 80 ? "text-[#1D9E75]" :
        score >= 60 ? "text-amber-400" :
        "text-red-400";
    const label =
        score >= 80 ? "Excellent" :
        score >= 60 ? "Moderate" :
        "Needs attention";
    return (
        <div>
            <p className={`text-2xl font-bold ${color}`}>
                <span ref={ref}>{count}</span>%
            </p>
            <p className={`mt-0.5 text-[10px] font-medium ${color}`}>{label}</p>
        </div>
    );
}

interface RevenueProtectionWidgetProps {
    dashboard: DashboardData;
}

export function RevenueProtectionWidget({ dashboard }: RevenueProtectionWidgetProps) {
    const scopeFlags = dashboard.metrics.pendingScopeFlags;
    const changeOrders = dashboard.metrics.awaitingApproval;
    const revenueProtected = scopeFlags * AVG_HOURLY_RATE * AVG_HOURS_PER_FLAG;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-xl border border-[#1D9E75]/20 bg-[#0D1B2A] p-5 shadow-lg"
            aria-label="Revenue protection summary"
        >
            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1D9E75]/15">
                    <Shield className="h-4 w-4 text-[#1D9E75]" aria-hidden />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-white">Revenue Protection</h2>
                    <p className="text-[11px] text-white/40">Estimated value ScopeIQ is protecting for you</p>
                </div>
            </div>

            {/* 2×2 metric grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Revenue protected */}
                <div className="rounded-lg bg-white/[0.04] p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                        Revenue Protected
                    </p>
                    <AnimatedNumber
                        value={revenueProtected}
                        prefix="$"
                        className="text-2xl font-bold text-[#1D9E75]"
                        duration={1200}
                    />
                    <p className="mt-0.5 text-[10px] text-white/30">this month (est.)</p>
                </div>

                {/* Scope flags */}
                <div className="rounded-lg bg-white/[0.04] p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                        Scope Flags Caught
                    </p>
                    <div className="flex items-end gap-2">
                        <AnimatedNumber
                            value={scopeFlags}
                            className="text-2xl font-bold text-white"
                            duration={800}
                        />
                        {scopeFlags > 0 ? (
                            <span className="mb-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-[#1D9E75]">
                                <TrendingUp className="h-3 w-3" aria-hidden /> active
                            </span>
                        ) : (
                            <span className="mb-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-white/30">
                                <TrendingDown className="h-3 w-3" aria-hidden /> none
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/30">pending review</p>
                </div>

                {/* Change orders */}
                <div className="rounded-lg bg-white/[0.04] p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                        Change Orders
                    </p>
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-white/30" aria-hidden />
                        <AnimatedNumber
                            value={changeOrders}
                            className="text-2xl font-bold text-white"
                            duration={700}
                        />
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/30">awaiting approval</p>
                </div>

                {/* Brief clarity */}
                <div className="rounded-lg bg-white/[0.04] p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                        Brief Clarity
                    </p>
                    <div className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 shrink-0 text-white/30" aria-hidden />
                        <ClarityBadge score={PLACEHOLDER_CLARITY_SCORE} />
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/30">avg. score</p>
                </div>
            </div>

            <p className="mt-4 text-[10px] text-white/20">
                Revenue estimate: {scopeFlags} flag{scopeFlags !== 1 ? "s" : ""} × {AVG_HOURS_PER_FLAG}h avg. × ${AVG_HOURLY_RATE}/hr.
                Actual savings may vary.
            </p>
        </motion.div>
    );
}
