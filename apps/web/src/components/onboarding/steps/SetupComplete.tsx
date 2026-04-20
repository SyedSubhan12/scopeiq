"use client";

import { useRef, useEffect, useState } from "react";
import { CheckCircle, Circle, ArrowRight, ExternalLink } from "lucide-react";
import { gsap } from "@/animations/utils/gsap.config";
import { apiClient } from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { useOnboardingContext } from "@/components/onboarding/OnboardingContext";

const CHECKLIST = [
    { label: "Create workspace", done: true },
    { label: "Set brand color & logo", done: true },
    { label: "Upload your first SOW", done: false, cta: "Do this now", href: "/dashboard/scope-guard" },
    { label: "Set revision round limit", done: false, cta: "2 minutes", href: "/settings/scope-guard" },
    { label: "Configure reminders", done: false, cta: "Set up", href: "/settings/reminders" },
    { label: "Invite your team", done: false, cta: "Add teammates", href: "/settings/team" },
];

const PATH_ACTIONS = {
    scope_guard: { text: "Upload your first real SOW and activate Scope Guard on an active project.", cta: "Upload SOW", href: "/dashboard/scope-guard/new" },
    approval_portal: { text: "Your client portal link is ready. Send it to a client waiting on review.", cta: "Copy Portal Link", href: "/dashboard/approvals" },
    brief_builder: { text: "Share your brief form with a new client.", cta: "Copy Brief Link", href: "/dashboard/briefs" },
    full_tour: { text: "Start with Scope Guard — upload your first SOW to activate protection.", cta: "Upload SOW", href: "/dashboard/scope-guard/new" },
};

const CONFETTI_COLORS = ["#0F6E56", "#1DB98A", "#F4F1EC", "#34D399", "#6EE7B7"];

export function SetupComplete() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [marked, setMarked] = useState(false);
    const hydrateWorkspace = useWorkspaceStore((s) => s.hydrateWorkspace);
    const { painPoint } = useOnboardingContext();

    const action = PATH_ACTIONS[painPoint ?? "scope_guard"];

    useEffect(() => {
        if (!containerRef.current || marked) return;

        // Mark complete
        setMarked(true);
        apiClient.patch("/v1/workspaces/me/onboarding", { step: "setup_complete", complete: true })
            .then(() => hydrateWorkspace())
            .catch(() => { /* non-blocking */ });

        // Confetti burst
        const dots = Array.from({ length: 16 }, (_, i) => {
            const el = document.createElement("div");
            el.className = "ob-confetti-dot";
            el.style.cssText = `
                position: absolute;
                width: 6px; height: 6px;
                border-radius: 50%;
                background: ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 10;
            `;
            containerRef.current!.appendChild(el);
            return el;
        });

        const tl = gsap.timeline();
        dots.forEach((dot, i) => {
            const angle = (i / dots.length) * Math.PI * 2;
            const dist = 60 + Math.random() * 80;
            tl.to(dot, {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                opacity: 0,
                scale: 0,
                duration: 0.8 + Math.random() * 0.4,
                ease: "power2.out",
                onComplete: () => dot.remove(),
            }, i * 0.03);
        });

        return () => { tl.kill(); dots.forEach((d) => { try { d.remove(); } catch (_) { /* ignore */ } }); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div ref={containerRef} className="ob-complete-root relative space-y-8 overflow-visible">
            {/* Heading */}
            <div className="ob-complete-heading text-center space-y-3">
                <div
                    className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: "rgba(15,110,86,0.15)", border: "1px solid rgba(15,110,86,0.3)", boxShadow: "0 0 40px rgba(15,110,86,0.25)" }}
                >
                    <CheckCircle className="h-8 w-8" style={{ color: "#0F6E56" }} />
                </div>
                <h2
                    className="text-4xl font-bold leading-tight"
                    style={{ color: "#F4F1EC", fontFamily: "var(--font-serif)", fontStyle: "italic", textShadow: "0 0 60px rgba(15,110,86,0.3)" }}
                >
                    Your ScopeIQ workspace
                    <br />
                    is ready.
                </h2>
                <p className="text-sm" style={{ color: "rgba(244,241,236,0.5)" }}>
                    Here&apos;s what to do next to protect your first project.
                </p>
            </div>

            {/* Checklist */}
            <div className="ob-complete-checklist rounded-2xl border p-5 space-y-2.5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(244,241,236,0.25)", fontFamily: "var(--font-mono)" }}>
                    Quick wins
                </p>
                {CHECKLIST.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                        {item.done
                            ? <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#0F6E56" }} />
                            : <Circle className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(244,241,236,0.2)" }} />
                        }
                        <span
                            className="flex-1 text-sm"
                            style={{ color: item.done ? "rgba(244,241,236,0.35)" : "#F4F1EC", textDecoration: item.done ? "line-through" : "none" }}
                        >
                            {item.label}
                        </span>
                        {!item.done && item.cta && (
                            <a
                                href={item.href}
                                className="text-xs font-medium"
                                style={{ color: "#0F6E56" }}
                            >
                                {item.cta} →
                            </a>
                        )}
                    </div>
                ))}
            </div>

            {/* Next action card */}
            <div
                className="ob-complete-action rounded-2xl border-l-4 border p-5 space-y-3"
                style={{ background: "rgba(15,110,86,0.08)", borderColor: "rgba(15,110,86,0.25)", borderLeftColor: "#0F6E56" }}
            >
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#0F6E56", fontFamily: "var(--font-mono)" }}>
                    Next recommended action
                </p>
                <p className="text-sm" style={{ color: "rgba(244,241,236,0.75)" }}>{action.text}</p>
                <a
                    href={action.href}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
                    style={{ background: "rgba(15,110,86,0.2)", color: "#1DB98A", border: "1px solid rgba(15,110,86,0.35)" }}
                >
                    {action.cta}
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            </div>

            {/* Dashboard CTA */}
            <div className="ob-complete-cta flex justify-center">
                <a
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-200"
                    style={{
                        background: "linear-gradient(135deg, #0F6E56, #1DB98A)",
                        color: "#fff",
                        boxShadow: "0 4px 30px rgba(15,110,86,0.45)",
                        fontFamily: "var(--font-sans)",
                    }}
                >
                    Go to my Dashboard
                    <ArrowRight className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
}
