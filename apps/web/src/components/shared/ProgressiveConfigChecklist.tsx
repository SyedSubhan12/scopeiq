"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { cn } from "@novabots/ui";
import { useWorkspaceStore } from "@/stores/workspace.store";

interface ChecklistItem {
    id: string;
    title: string;
    description: string;
    impact: string;
    timeEstimate: string;
    href: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
    {
        id: "workspace_named",
        title: "Name your workspace",
        description: "Your agency's home on ScopeIQ",
        impact: "Foundation complete",
        timeEstimate: "Done",
        href: "/settings/workspace",
    },
    {
        id: "first_project",
        title: "Protect your first project",
        description: "Create a project and upload a SOW",
        impact: "+$1,200/mo protection",
        timeEstimate: "~5 min",
        href: "/projects?new=true",
    },
    {
        id: "brief_template",
        title: "Set up a brief template",
        description: "Clients fill in your branded intake form",
        impact: "Better brief quality",
        timeEstimate: "~3 min",
        href: "/briefs",
    },
    {
        id: "rate_card",
        title: "Configure your rate card",
        description: "Accurate revenue protection calculations",
        impact: "+40% accuracy",
        timeEstimate: "~3 min",
        href: "/settings/rate-card",
    },
    {
        id: "team_member",
        title: "Invite a team member",
        description: "Collaborate on scope management",
        impact: "2× faster responses",
        timeEstimate: "~1 min",
        href: "/settings/team",
    },
];

function resolveCompleted(workspaceName: string, completedSteps: string[]): Set<string> {
    const done = new Set<string>(completedSteps);
    if (workspaceName.trim().length > 0) done.add("workspace_named");
    return done;
}

export function ProgressiveConfigChecklist() {
    const router = useRouter();
    const name = useWorkspaceStore((s) => s.name);
    const completedSteps = useWorkspaceStore((s) => s.onboardingProgress.completedSteps);
    const completed = resolveCompleted(name, completedSteps);
    const completedCount = CHECKLIST_ITEMS.filter((i) => completed.has(i.id)).length;
    const progressPct = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

    if (completedCount >= CHECKLIST_ITEMS.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="rounded-xl border border-[rgb(var(--border-default))] bg-white p-5 shadow-sm"
            aria-label="Setup checklist"
        >
            {/* Header + progress bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Get started</h2>
                    <span className="text-xs text-[rgb(var(--text-muted))]">
                        {completedCount} of {CHECKLIST_ITEMS.length}
                    </span>
                </div>
                <div
                    className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--border-default))]"
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${completedCount} of ${CHECKLIST_ITEMS.length} setup tasks completed`}
                >
                    <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
                    />
                </div>
            </div>

            {/* Item list */}
            <ul className="space-y-0.5" role="list">
                {CHECKLIST_ITEMS.map((item, idx) => {
                    const done = completed.has(item.id);
                    return (
                        <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.15 + idx * 0.06 }}
                        >
                            <button
                                type="button"
                                onClick={() => !done && router.push(item.href)}
                                disabled={done}
                                className={cn(
                                    "group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
                                    done
                                        ? "cursor-default opacity-60"
                                        : "hover:bg-[rgb(var(--border-default))]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                )}
                                aria-label={done ? `${item.title} — completed` : `${item.title} — ${item.timeEstimate}`}
                            >
                                {/* Checkmark */}
                                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                                    {done ? (
                                        <motion.div
                                            initial={{ scale: 0.6, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                        >
                                            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
                                        </motion.div>
                                    ) : (
                                        <Circle className="h-5 w-5 text-[rgb(var(--text-muted))]/40" aria-hidden />
                                    )}
                                </div>

                                {/* Text */}
                                <div className="min-w-0 flex-1">
                                    <p className={cn(
                                        "text-sm font-medium leading-none",
                                        done
                                            ? "text-[rgb(var(--text-muted))] line-through decoration-[rgb(var(--text-muted))]/40"
                                            : "text-[rgb(var(--text-primary))]",
                                    )}>
                                        {item.title}
                                    </p>
                                    {!done && (
                                        <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Impact + time */}
                                {!done && (
                                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                                        <span className="text-[10px] font-semibold text-primary">
                                            {item.impact}
                                        </span>
                                        <span className="text-[10px] text-[rgb(var(--text-muted))]">
                                            {item.timeEstimate}
                                        </span>
                                    </div>
                                )}

                                {!done && (
                                    <ChevronRight
                                        className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--text-muted))]/40 transition-transform group-hover:translate-x-0.5"
                                        aria-hidden
                                    />
                                )}
                            </button>
                        </motion.li>
                    );
                })}
            </ul>
        </motion.div>
    );
}
