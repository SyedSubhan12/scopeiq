"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PortalSessionProvider } from "@/providers/portal-session-provider";
import { usePortalSession } from "@/hooks/usePortalSession";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalDeliverableView } from "@/components/portal/PortalDeliverableView";
import type { Deliverable } from "@/hooks/useDeliverables";
import { IntakeForm } from "@/components/portal/IntakeForm";
import { BriefHoldState, type ClarificationFlag } from "@/components/portal/BriefHoldState";
import { PoweredByBadge } from "@/components/portal/PoweredByBadge";
import { Skeleton, Badge, useToast } from "@novabots/ui";
import { H2, H3, H4, Body, Label, Caption, Stat, Code } from "@/lib/typography";
import {
    AlertCircle, CheckSquare, CheckCircle2, Loader2, MessageSquare, Sparkles,
    Clock, Save, FileText, ArrowRight, ArrowLeft, Keyboard,
} from "lucide-react";
import { PortalTabs, type TabKey } from "@/components/portal/PortalTabs";

const BLOCKED_STATUSES = ["awaiting_brief", "clarification_needed"] as const;

function getDefaultTab(params: {
    projectStatus: string;
    hasBrief: boolean;
    hasDeliverables: boolean;
}): TabKey {
    const { projectStatus, hasBrief, hasDeliverables } = params;

    if (projectStatus === "awaiting_brief" || projectStatus === "clarification_needed") {
        return "brief";
    }

    if (projectStatus === "brief_scored" || projectStatus === "in_progress") {
        return hasDeliverables ? "review" : "brief";
    }

    if (projectStatus === "deliverable_in_review") {
        return "review";
    }

    if (projectStatus === "completed") {
        return "brief";
    }

    return hasBrief ? "brief" : "review";
}

// ---------------------------------------------------------------------------
// Brief Welcome Card — Enhancement 1
// ---------------------------------------------------------------------------
function BriefWelcome({
    projectName,
    workspaceName,
    fieldCount,
    brandColor,
    onStart,
}: {
    projectName: string;
    workspaceName: string;
    fieldCount: number;
    brandColor: string;
    onStart: () => void;
}) {
    const estimatedMinutes = Math.max(2, Math.ceil(fieldCount * 0.5));

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl border border-[rgb(var(--border-default))] bg-white shadow-sm"
        >
            <div
                className="px-8 py-10 text-center"
                style={{
                    background: `linear-gradient(135deg, ${brandColor}08 0%, ${brandColor}04 100%)`,
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                    className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${brandColor}15` }}
                >
                    <FileText className="h-8 w-8" style={{ color: brandColor }} />
                </motion.div>

                    <H2 className="text-center">
                        Welcome to the {projectName} Brief
                    </H2>
                    <Body size="lg" color="secondary" className="mx-auto mt-3 max-w-md">
                        <strong>{workspaceName}</strong> needs a few details to get started on your project.
                        Your answers help shape the scope and ensure nothing is missed.
                    </Body>

                    {/* Enhancement 6: Estimated time + field count */}
                    <div className="mt-6 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />
                            <Caption>{fieldCount} question{fieldCount !== 1 ? "s" : ""}</Caption>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />
                            <Caption>~{estimatedMinutes} min</Caption>
                        </div>
                    </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onStart}
                    className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md"
                    style={{ backgroundColor: brandColor }}
                >
                    Start the Brief
                    <ArrowRight className="h-4 w-4" />
                </motion.button>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Brief Submission Success — Enhancement 8
// ---------------------------------------------------------------------------
function BriefSubmissionSuccess() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-[rgb(var(--border-default))] bg-white p-12 text-center shadow-sm"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
            >
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </motion.div>
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <H2>Brief Submitted Successfully</H2>
            </motion.div>
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <Body color="muted" className="mt-2">
                    Our team is reviewing your answers now. We&apos;ll be back with feedback shortly.
                </Body>
            </motion.div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Brief Form State Machine
// ---------------------------------------------------------------------------
type BriefFormView = "welcome" | "form" | "review" | "submitting" | "success";

function PortalContent() {
    const session = usePortalSession();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabKey | null>(null);
    const [briefResubmitting, setBriefResubmitting] = useState(false);

    // Brief form state — Enhancements 2, 3, 4, 5, 9, 10
    const [briefFormView, setBriefFormView] = useState<BriefFormView>("welcome");
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [formFieldValues, setFormFieldValues] = useState<Record<string, unknown>>({});

    // Derived values (all hooks must be before any early return)
    const { project, workspace, deliverables, pendingBrief, clarificationBrief, clarificationRequest } = session;
    const projectStatus = project?.status ?? "";
    const hasBrief = !!pendingBrief;

    // BUG FIX: Check submittedAt, not just status
    // Auto-provisioned briefs have status "pending_score" but submittedAt = null
    // They should show the form, NOT the waiting screen
    const briefHasNotBeenSubmitted = pendingBrief?.submittedAt === null || pendingBrief?.submittedAt === undefined;

    // Determine brief state for rendering
    const activeBrief = projectStatus === "clarification_needed" && clarificationBrief
        ? clarificationBrief
        : pendingBrief;

    // Use submittedAt as the primary signal — not status
    const briefStatus = briefHasNotBeenSubmitted
        ? "NOT_SUBMITTED"
        : (activeBrief?.status ?? "NOT_SUBMITTED");

    const showBrief = true;
    const showReviewWork = !BLOCKED_STATUSES.includes(projectStatus as typeof BLOCKED_STATUSES[number]);
    const showMessages = !BLOCKED_STATUSES.includes(projectStatus as typeof BLOCKED_STATUSES[number]);

    const defaultTab = getDefaultTab({
        projectStatus,
        hasBrief,
        hasDeliverables: deliverables.length > 0,
    });

    const tab: TabKey = activeTab ?? defaultTab;

    // Enhancement 3: Auto-save draft every 10 seconds
    const autoSaveDraft = useCallback(async () => {
        if (!pendingBrief || Object.keys(formFieldValues).length === 0) return;

        setIsSaving(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/portal/session/brief/draft`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Portal-Token": session.token },
                body: JSON.stringify({ briefId: pendingBrief.id, responses: formFieldValues }),
            });
            setLastSaved(new Date());
        } catch {
            // Silent fail — draft save is best-effort
        } finally {
            setIsSaving(false);
        }
    }, [pendingBrief, formFieldValues, session.token]);

    useEffect(() => {
        if (briefFormView !== "form") return;
        const timer = setInterval(autoSaveDraft, 10_000);
        return () => clearInterval(timer);
    }, [briefFormView, autoSaveDraft]);

    // Enhancement 10: Keyboard navigation
    const handleFormKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            if (currentStep < totalSteps - 1) {
                setCurrentStep((s) => s + 1);
            } else {
                setBriefFormView("review");
            }
        }
        if (e.key === "ArrowRight" && e.altKey) {
            e.preventDefault();
            if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
        }
        if (e.key === "ArrowLeft" && e.altKey) {
            e.preventDefault();
            if (currentStep > 0) setCurrentStep((s) => s - 1);
        }
    }, [currentStep, totalSteps]);

    const handleStartBrief = useCallback(() => {
        setBriefFormView("form");
        setCurrentStep(0);
    }, []);

    const handleBriefResubmit = async (values: Record<string, string>) => {
        if (!activeBrief) return;

        setBriefResubmitting(true);
        try {
            const endpoint = clarificationRequest
                ? "/portal/session/brief/clarify-submit"
                : "/portal/session/brief/submit";

            const body: Record<string, unknown> = {
                briefId: activeBrief.id,
                responses: values,
            };

            if (clarificationRequest) {
                body.clarificationRequestId = clarificationRequest.id;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Portal-Token": session.token,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.message ?? "Failed to submit brief");
            }

            toast("success", clarificationRequest ? "Clarifications submitted successfully." : "Brief resubmitted successfully.");
            window.location.reload();
        } catch (error) {
            toast("error", error instanceof Error ? error.message : "Failed to submit brief. Please try again.");
        } finally {
            setBriefResubmitting(false);
        }
    };

    // Build clarification flags for BriefHoldState
    const clarificationFlags: ClarificationFlag[] = clarificationRequest?.items.map((item) => ({
        fieldKey: item.fieldKey,
        fieldLabel: item.fieldLabel,
        prompt: item.prompt,
        reason: `Your agency requested more detail: ${item.severity} priority`,
    })) ?? [];

    const briefPreviousAnswers: Record<string, unknown> = activeBrief
        ? Object.fromEntries(activeBrief.fields.map((field) => [field.key, field.value ?? ""]))
        : {};

    // --- Early returns AFTER all hooks ---
    if (session.loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-64" />
                <div className="mt-6 space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }

    if (session.error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-[rgb(var(--border-default))] max-w-md w-full">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
                        Link Invalid or Expired
                    </h2>
                    <p className="mt-2 text-sm text-[rgb(var(--text-muted))] leading-relaxed">
                        {session.error}. Please contact your agency for a new portal link.
                    </p>
                    <button
                        className="mt-6 w-full rounded-xl border border-[rgb(var(--border-default))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--surface-subtle))]"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: `${workspace.brandColor}08` }}>
            <PortalHeader
                workspaceName={workspace.name}
                logoUrl={workspace.logoUrl}
                brandColor={workspace.brandColor}
                projectName={project.name}
                clientName={project.clientName}
            />

            <div className="mx-auto max-w-4xl px-4 pt-6">
                <PortalTabs
                    active={tab}
                    onChange={setActiveTab}
                    showBrief={showBrief}
                    showReviewWork={showReviewWork}
                    showMessages={showMessages}
                    brandColor={workspace.brandColor}
                />
            </div>

            <main className="mx-auto max-w-4xl px-4 py-8">
                {/* Brief Tab */}
                {tab === "brief" && (
                    <>
                        {/* State: NOT_SUBMITTED — show welcome then form */}
                        {briefStatus === "NOT_SUBMITTED" && pendingBrief && (
                            <AnimatePresence mode="wait">
                                {briefFormView === "welcome" ? (
                                    <motion.div
                                        key="welcome"
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <BriefWelcome
                                            projectName={project.name}
                                            workspaceName={workspace.name}
                                            fieldCount={pendingBrief.fields.length}
                                            brandColor={workspace.brandColor}
                                            onStart={handleStartBrief}
                                        />
                                    </motion.div>
                                ) : briefFormView === "form" ? (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.25 }}
                                        onKeyDown={handleFormKeyDown}
                                    >
                                        {/* Enhancement 2 + 3: Progress bar + auto-save indicator */}
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-48 overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: workspace.brandColor }}
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: `${totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </div>
                                                <span className="text-xs text-[rgb(var(--text-muted))]">
                                                    Step {currentStep + 1} of {totalSteps}
                                                </span>
                                            </div>
                                            {isSaving ? (
                                                <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
                                                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                                                </span>
                                            ) : lastSaved ? (
                                                <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
                                                    <Save className="h-3 w-3" /> Saved {lastSaved.toLocaleTimeString()}
                                                </span>
                                            ) : null}
                                        </div>

                                        <IntakeForm
                                            brief={pendingBrief}
                                            onSuccess={() => {
                                                setBriefFormView("success");
                                            }}
                                            onStepChange={(step, total) => {
                                                setCurrentStep(step);
                                                setTotalSteps(total);
                                            }}
                                            onValuesChange={(values) => {
                                                setFormFieldValues(values);
                                            }}
                                        />
                                    </motion.div>
                                ) : briefFormView === "review" ? (
                                    <motion.div
                                        key="review"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        {/* Enhancement 5: Review-before-submit screen */}
                                        <div className="rounded-2xl border border-[rgb(var(--border-default))] bg-white p-8 shadow-sm">
                                            <H4>Review Your Answers</H4>
                                            <Body size="sm" color="muted">
                                                Please check your responses before submitting.
                                            </Body>
                                            <div className="mt-6 space-y-3">
                                                {Object.entries(formFieldValues).map(([key, value]) => (
                                                    <div key={key} className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]/50 p-3">
                                                        <Label size="sm" color="muted">
                                                            {key.replace(/[_\d]/g, " ").trim()}
                                                        </Label>
                                                        <Body size="sm" className="mt-1">
                                                            {value ? String(value) : <span className="text-[rgb(var(--text-muted))] italic">Not answered</span>}
                                                        </Body>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-6 flex items-center justify-between">
                                                <button
                                                    onClick={() => setBriefFormView("form")}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border-default))] px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-subtle))]"
                                                >
                                                    <ArrowLeft className="h-3.5 w-3.5" /> Go Back
                                                </button>
                                                <button
                                                    onClick={() => setBriefFormView("submitting")}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm"
                                                    style={{ backgroundColor: workspace.brandColor }}
                                                >
                                                    Submit Brief <ArrowRight className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : briefFormView === "success" ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <BriefSubmissionSuccess />
                                    </motion.div>
                                ) : (
                                    <IntakeForm
                                        brief={pendingBrief}
                                        onSuccess={() => setBriefFormView("success")}
                                    />
                                )}
                            </AnimatePresence>
                        )}

                        {/* State: pending_score or scoring → render waiting screen */}
                        {briefStatus === "pending_score" && (
                            <motion.div
                                data-testid="brief-pending"
                                className="space-y-6"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="rounded-2xl border border-[rgb(var(--border-default))] bg-white p-12 text-center shadow-sm">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))]">
                                        <div className="relative">
                                            <Loader2 className="h-10 w-10 animate-spin text-[rgb(var(--text-muted))]" />
                                            <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-amber-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <H2>Thanks — we&apos;re reviewing your brief.</H2>
                                    <Body size="sm" color="muted" className="mt-2">
                                        This usually takes under 10 seconds.
                                    </Body>
                                    <div className="mt-6 flex items-center justify-center gap-2">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[rgb(var(--text-muted))]" />
                                        <Label>Scoring clarity and completeness</Label>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* State: clarification_needed → render BriefHoldState */}
                        {briefStatus === "clarification_needed" && (
                            <BriefHoldState
                                flags={clarificationFlags}
                                previousAnswers={briefPreviousAnswers}
                                onResubmit={(values) => void handleBriefResubmit(values)}
                                brandColor={workspace.brandColor}
                            />
                        )}

                        {/* State: scored or approved → render read-only confirmation */}
                        {(briefStatus === "scored" || briefStatus === "approved") && (
                            <div data-testid="brief-scored" className="space-y-6">
                                <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border-default))] bg-white shadow-sm">
                                    <div className="border-b border-[rgb(var(--border-subtle))] bg-emerald-50 px-6 py-6 sm:px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <Label size="lg" className="text-emerald-700">
                                                    Brief Received
                                                </Label>
                                                <H2 className="text-emerald-900">
                                                    Your brief has been received
                                                </H2>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-6 sm:px-8 sm:py-8">
                                        {activeBrief?.scopeScore != null && (
                                            <div className="mb-6 flex items-center justify-between rounded-xl bg-[rgb(var(--surface-subtle))] p-4">
                                                <div>
                                                    <Label>Brief Clarity Score</Label>
                                                    <Stat>{activeBrief.scopeScore}%</Stat>
                                                </div>
                                                <Badge
                                                    status={activeBrief.scopeScore >= 80 ? "approved" : activeBrief.scopeScore >= 60 ? "pending" : "flagged"}
                                                    className="text-xs"
                                                >
                                                    {activeBrief.scopeScore >= 80 ? "Excellent" : activeBrief.scopeScore >= 60 ? "Good" : "Needs Work"}
                                                </Badge>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <Label>Submitted Answers</Label>
                                            {activeBrief?.fields.map((field) => {
                                                const displayValue = field.value ?? "No answer provided";
                                                return (
                                                    <div
                                                        key={field.key}
                                                        className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]/50 p-4"
                                                    >
                                                        <Body size="sm" weight="medium">{field.label}</Body>
                                                        <Body size="sm" color="secondary" className="mt-1">
                                                            {displayValue}
                                                        </Body>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4 text-amber-900">
                                            <Body size="sm" weight="medium" className="text-amber-900">Brief is locked</Body>
                                            <Caption className="mt-1 text-amber-800">
                                                The brief has been scored and is now part of the project record.
                                                Contact your agency if you need to make changes.
                                            </Caption>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fallback: no brief and no pendingBrief — empty state */}
                        {!activeBrief && !pendingBrief && (
                            <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))]">
                                    <Sparkles className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                                </div>
                                <H3>No brief to display</H3>
                                <Body size="sm" color="muted" className="mx-auto mt-1 max-w-xs">
                                    Your agency will share a brief here when ready.
                                </Body>
                            </div>
                        )}
                    </>
                )}

                {/* Review Work Tab */}
                {tab === "review" && (
                    <>
                        <div className="mb-6">
                            <H4>Review Work</H4>
                            <Body size="sm" color="muted">
                                Approve or request changes on each deliverable below.
                            </Body>
                        </div>

                        {deliverables.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))]">
                                    <CheckSquare className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                                </div>
                                <H3>Nothing to review yet</H3>
                                <Body size="sm" color="muted" className="mx-auto mt-1 max-w-xs">
                                    Your agency will share deliverables here when work is ready for review.
                                </Body>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {deliverables.map((d) => (
                                    <PortalDeliverableView
                                        key={d.id}
                                        deliverable={d as unknown as Deliverable}
                                        portalToken={session.token}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Messages Tab */}
                {tab === "messages" && (
                    <>
                        <div className="mb-6">
                            <H4>Messages</H4>
                            <Body size="sm" color="muted">
                                Communicate with your agency about project scope and updates.
                            </Body>
                        </div>
                        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-default))] bg-white p-16 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--surface-subtle))]">
                                <MessageSquare className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                            </div>
                            <H3>Messages coming soon</H3>
                            <Body size="sm" color="muted" className="mx-auto mt-1 max-w-xs">
                                Your agency will enable messaging here when ready.
                            </Body>
                        </div>
                    </>
                )}

                {/* Enhancement 10: Keyboard hint */}
                {briefFormView === "form" && (
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                        <Keyboard className="h-3 w-3 text-[rgb(var(--text-muted))]" />
                        <Caption>
                            <Code className="rounded border border-[rgb(var(--border-default))] px-1.5 py-0.5">Ctrl</Code>+<Code className="rounded border border-[rgb(var(--border-default))] px-1.5 py-0.5">Enter</Code> to advance step
                            {" · "}
                            <Code className="rounded border border-[rgb(var(--border-default))] px-1.5 py-0.5">Alt</Code>+<Code className="rounded border border-[rgb(var(--border-default))] px-1.5 py-0.5">←→</Code> to navigate
                        </Caption>
                    </div>
                )}

                <PoweredByBadge plan={workspace.plan} />
            </main>
        </div>
    );
}

export default function PortalPage({
    params,
}: {
    params: { portalToken: string };
}) {
    return (
        <PortalSessionProvider portalToken={params.portalToken}>
            <PortalContent />
        </PortalSessionProvider>
    );
}
