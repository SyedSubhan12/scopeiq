"use client";

interface PoweredByBadgeProps {
    plan: string;
}

export function PoweredByBadge({ plan }: PoweredByBadgeProps) {
    // Hide on paid plans — free users see the badge
    if (["studio", "agency"].includes(plan)) return null;

    return (
        <div className="mt-12 flex items-center justify-center gap-1.5 py-4">
            <span className="text-[10px] font-medium uppercase tracking-widest text-[rgb(var(--text-muted))]">
                Powered by
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                ScopeIQ
            </span>
        </div>
    );
}
