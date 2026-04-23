"use client";

import { useEffect, useRef } from "react";
import { cn } from "@novabots/ui";

/**
 * RevisionCounter — Level 2 Composite
 *
 * Design System v1.0 spec Section 5.4.
 * Renders revision usage as a labeled progress bar.
 *
 * Key constraints:
 * - `revisionLimit: null` = unlimited (no SOW or SOW unspecified) → no bar, text "Unlimited"
 * - `revisionLimit: 0` = ERROR STATE — not unlimited (AP-013). Show "0 limit set — check SOW".
 * - Progress colors: 0–50% green, 51–80% amber, 81%+ red (spec Section 5.4)
 * - Portal context adds "N round(s) remaining" near-limit copy
 * - Animation respects prefers-reduced-motion
 * - onAtLimit fires when currentRound >= revisionLimit (portal context only)
 */

export interface RevisionCounterProps {
    /** Current rounds used */
    currentRound: number;
    /**
     * Maximum revision rounds per SOW.
     * null  = unlimited (no SOW or unspecified) — no bar shown
     * 0     = error/misconfigured state (AP-013 — not unlimited)
     * n > 0 = normal bounded state
     */
    revisionLimit: number | null;
    /** Portal shows remaining-rounds copy; dashboard shows raw numbers */
    context: "portal" | "dashboard";
    /** Called when currentRound >= revisionLimit — caller renders at-limit modal */
    onAtLimit?: () => void;
    className?: string;
}

function getBarColor(pct: number): string {
    if (pct > 80) return "var(--revision-bar-critical)";
    if (pct > 50) return "var(--revision-bar-warning)";
    return "var(--revision-bar-safe)";
}

export function RevisionCounter({
    currentRound,
    revisionLimit,
    context,
    onAtLimit,
    className,
}: RevisionCounterProps) {
    const barRef = useRef<HTMLDivElement>(null);
    const prevPctRef = useRef<number>(0);

    /* ── null = unlimited ───────────────────────────────────────────── */
    if (revisionLimit === null) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <span className="text-[length:var(--text-body)] text-[var(--color-text-mid)]">
                    Unlimited revisions
                </span>
            </div>
        );
    }

    /* ── 0 = misconfigured (AP-013) ─────────────────────────────────── */
    if (revisionLimit === 0) {
        return (
            <div className={cn("flex items-center gap-1.5", className)}>
                <span
                    className="text-[length:var(--text-sm)]"
                    style={{ color: "var(--color-warning-text)" }}
                >
                    No revision limit set — check SOW
                </span>
            </div>
        );
    }

    /* ── Normal bounded state ───────────────────────────────────────── */
    const clamped = Math.min(currentRound, revisionLimit);
    const pct = Math.round((clamped / revisionLimit) * 100);
    const barColor = getBarColor(pct);
    const isAtLimit = currentRound >= revisionLimit;
    const remaining = revisionLimit - currentRound;

    /* Portal: fire onAtLimit callback when at/over limit */
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (isAtLimit && context === "portal" && onAtLimit) {
            onAtLimit();
        }
    }, [isAtLimit, context, onAtLimit]);

    /* Animate bar width on mount and value change — 400ms ease-out per spec */
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        const el = barRef.current;
        if (!el) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) {
            el.style.width = `${pct}%`;
            el.style.transition = "none";
            prevPctRef.current = pct;
            return;
        }

        /* Start from previous value for smooth transitions on updates */
        el.style.width = `${prevPctRef.current}%`;
        el.style.transition = "none";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.transition = "width 400ms cubic-bezier(0.0, 0, 0.2, 1)";
                el.style.width = `${pct}%`;
                prevPctRef.current = pct;
            });
        });
    }, [pct]);

    return (
        <div className={cn("w-full", className)} role="meter" aria-valuenow={currentRound} aria-valuemin={0} aria-valuemax={revisionLimit}>
            {/* Label row */}
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span
                    className="text-[length:var(--text-body)] text-[var(--color-text-high)]"
                    style={{ lineHeight: 1 }}
                >
                    {currentRound} of {revisionLimit} revision round{revisionLimit !== 1 ? "s" : ""} used
                </span>

                {/* Portal-specific remaining-rounds copy */}
                {context === "portal" && !isAtLimit && remaining <= 2 && (
                    <span
                        className="shrink-0 text-[length:var(--text-sm)] font-[500]"
                        style={{ color: "var(--color-warning-text)" }}
                    >
                        {remaining} round{remaining !== 1 ? "s" : ""} remaining
                    </span>
                )}

                {isAtLimit && (
                    <span
                        className="shrink-0 text-[length:var(--text-sm)] font-[600]"
                        style={{ color: "var(--color-danger)" }}
                    >
                        Limit reached
                    </span>
                )}
            </div>

            {/* Progress bar track */}
            <div
                className="h-2 w-full overflow-hidden rounded-[var(--radius-full)]"
                style={{ backgroundColor: "var(--color-surface-raised)" }}
            >
                <div
                    ref={barRef}
                    className="h-full rounded-[var(--radius-full)]"
                    style={{
                        backgroundColor: barColor,
                        width: "0%", /* initial value — set by useEffect */
                    }}
                />
            </div>

            {/* Numeric percent — dashboard only */}
            {context === "dashboard" && (
                <p
                    className="mt-1 text-right text-[length:var(--text-sm)]"
                    style={{ color: "var(--color-text-low)" }}
                >
                    {pct}%
                </p>
            )}
        </div>
    );
}
