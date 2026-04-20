"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { AlertCircle, ArrowRight, Plus, RefreshCcw, ShieldAlert, Sparkles } from "lucide-react";
import { Button, Skeleton } from "@novabots/ui";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/providers/auth-provider";
import { MetricCardGrid } from "./MetricCardGrid";
import { RecentActivity } from "./RecentActivity";
import { ScopeFlagsSummary } from "./ScopeFlagsSummary";
import { UpcomingDeadlines } from "./UpcomingDeadlines";
import { RevenueProtectionWidget } from "./RevenueProtectionWidget";
import { ProgressiveConfigChecklist } from "./ProgressiveConfigChecklist";
import { DataFlywheelWidget } from "./DataFlywheelWidget";
import { ScopeFlagSlaWidget } from "@/components/dashboard/ScopeFlagSlaWidget";
import { gsap, ScrollTrigger } from "@/animations/utils/gsap.config";
import type { DashboardData } from "@/hooks/useDashboard";

const MOSS = "#196C4A";
const PAPER = "#F0EDE4";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28 max-sm:w-full sm:max-w-[7rem]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 w-full rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const { session, loading: authLoading } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useDashboard(
    !authLoading && !!session,
  );

  if (authLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Your session is still loading. Refresh this page if the dashboard does not appear.
        </p>
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard data.";

    return (
      <div className="flex items-center justify-center py-16">
        <div className="max-w-xl rounded-[28px] border border-[rgb(var(--border-subtle))] bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[rgb(var(--text-primary))]">
            Dashboard data could not load
          </h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-muted))]">
            {message}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
            <Link href="/projects?new=true">
              <Button variant="secondary">Create project</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[rgb(var(--text-muted))]">
          No dashboard data available.
        </p>
      </div>
    );
  }

  const dashboard = data.data;
  const urgentFlagCount = dashboard.urgentFlags?.length ?? 0;

  return <DashboardStage dashboard={dashboard} urgentFlagCount={urgentFlagCount} />;
}

function DashboardStage({
  dashboard,
  urgentFlagCount,
}: {
  dashboard: DashboardData;
  urgentFlagCount: number;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const blob1Ref = useRef<HTMLDivElement | null>(null);
  const blob2Ref = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const ruleRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Ambient moss blobs drifting forever
      if (blob1Ref.current) {
        gsap.to(blob1Ref.current, {
          x: 60, y: -30, scale: 1.15,
          repeat: -1, yoyo: true, duration: 9, ease: "sine.inOut",
        });
      }
      if (blob2Ref.current) {
        gsap.to(blob2Ref.current, {
          x: -50, y: 40, scale: 1.1,
          repeat: -1, yoyo: true, duration: 11, ease: "sine.inOut",
        });
      }

      // Hero headline split reveal (word-level)
      if (headlineRef.current) {
        const text = headlineRef.current.textContent ?? "";
        headlineRef.current.textContent = "";
        text.split(" ").forEach((w, i, arr) => {
          const span = document.createElement("span");
          span.textContent = w + (i < arr.length - 1 ? " " : "");
          span.className = "inline-block";
          headlineRef.current?.appendChild(span);
        });
        const words = headlineRef.current.querySelectorAll<HTMLSpanElement>("span");
        gsap.from(words, {
          y: 32, opacity: 0, filter: "blur(6px)",
          duration: 0.9, stagger: 0.05, ease: "power3.out",
        });
      }

      // Pill pop
      gsap.from(pillRef.current, {
        scale: 0.4, opacity: 0, duration: 0.7, ease: "back.out(2)", delay: 0.1,
      });
      // Moss rule sweep
      gsap.to(ruleRef.current, {
        scaleX: 1, duration: 1.2, ease: "power3.inOut", delay: 0.2,
      });

      // Hero card float
      gsap.to(heroRef.current, {
        y: -4,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Staggered reveal of every data-stage section
      const stages = root.querySelectorAll<HTMLElement>("[data-stage]");
      stages.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28, filter: "blur(6px)" },
          {
            opacity: 1, y: 0, filter: "blur(0px)",
            duration: 0.9, ease: "power3.out",
            delay: (i % 3) * 0.08,
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      // Hover tilt on metric cards
      const metrics = root.querySelectorAll<HTMLElement>(
        "[data-stage='metrics'] > div > *",
      );
      metrics.forEach((card) => {
        const enter = () =>
          gsap.to(card, { y: -4, scale: 1.015, boxShadow: `0 18px 40px -22px ${MOSS}`, duration: 0.4, ease: "power3.out" });
        const leave = () =>
          gsap.to(card, { y: 0, scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)", duration: 0.5, ease: "power2.out" });
        card.addEventListener("mouseenter", enter);
        card.addEventListener("mouseleave", leave);
      });
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger && root.contains(st.trigger as Node)) st.kill();
      });
    };
  }, [dashboard]);

  return (
    <div ref={rootRef} className="relative space-y-8">
      {/* Ambient drifting blobs — moss tinted */}
      <div
        ref={blob1Ref}
        aria-hidden
        style={{ background: `radial-gradient(closest-side, ${MOSS}33, transparent 70%)` }}
        className="pointer-events-none absolute -left-40 -top-32 h-[480px] w-[480px] rounded-full blur-3xl"
      />
      <div
        ref={blob2Ref}
        aria-hidden
        style={{ background: `radial-gradient(closest-side, ${MOSS}22, transparent 70%)` }}
        className="pointer-events-none absolute right-[-200px] top-[240px] h-[520px] w-[520px] rounded-full blur-3xl"
      />

      {/* Scope flags alert banner */}
      {urgentFlagCount > 0 && (
        <Link
          href="/scope-flags"
          data-stage
          className="group relative z-10 flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--status-red))]/25 bg-[rgb(var(--status-red))]/6 px-4 py-3 transition-colors hover:bg-[rgb(var(--status-red))]/10"
          aria-label={`${urgentFlagCount} scope flag${urgentFlagCount !== 1 ? "s" : ""} need attention`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--status-red))]/10">
              <ShieldAlert className="h-4 w-4 text-[rgb(var(--status-red))]" aria-hidden />
            </span>
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
              <span className="font-semibold text-[rgb(var(--status-red))]">
                {urgentFlagCount} scope flag{urgentFlagCount !== 1 ? "s" : ""}
              </span>{" "}
              need{urgentFlagCount === 1 ? "s" : ""} your attention
            </p>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-[rgb(var(--status-red))]/60 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}

      {/* Moss hero card */}
      <div
        ref={heroRef}
        className="relative z-10 overflow-hidden rounded-3xl border px-6 py-7 sm:px-8 sm:py-9"
        style={{
          background: `linear-gradient(135deg, ${PAPER} 0%, #E8E4D8 60%, ${PAPER} 100%)`,
          borderColor: "rgba(25,108,74,0.18)",
          boxShadow: `0 30px 60px -40px ${MOSS}`,
        }}
      >
        {/* moss corner glyph */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: `radial-gradient(closest-side, ${MOSS}55, transparent 70%)` }}
        />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <span
              ref={pillRef}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ background: MOSS, color: PAPER }}
            >
              <Sparkles className="h-3 w-3" />
              Workspace · Live
            </span>

            <h1
              ref={headlineRef}
              className="mt-4 text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-[rgb(var(--text-primary))] sm:text-4xl"
            >
              {dashboard.greeting}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[rgb(var(--text-secondary))]">
              Every vague brief, every silent revision, every quiet scope creep —
              surfaced before it costs you a line on the invoice.
            </p>

            <div className="mt-4 flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: MOSS }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: MOSS }} />
              </span>
              <span>scope-guard · monitoring</span>
              <span className="opacity-40">·</span>
              <span style={{ color: MOSS }}>rgb(25,108,74)</span>
            </div>

            <div className="relative mt-5 h-[2px] w-full max-w-md overflow-hidden rounded-full" style={{ background: "rgba(25,108,74,0.12)" }}>
              <span
                ref={ruleRef}
                className="absolute inset-0 block origin-left scale-x-0"
                style={{ background: MOSS }}
              />
            </div>
          </div>

          <Link href="/projects?new=true" className="shrink-0 max-sm:w-full">
            <Button
              size="sm"
              className="group max-sm:w-full max-sm:justify-center"
              style={{ background: MOSS, color: PAPER }}
            >
              <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div data-stage="metrics" className="relative z-10">
        <MetricCardGrid metrics={dashboard.metrics} />
      </div>

      {/* Revenue Protection + Setup Checklist */}
      <div data-stage className="relative z-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueProtectionWidget dashboard={dashboard} />
          </div>
          <div>
            <ProgressiveConfigChecklist />
          </div>
        </div>
      </div>

      {/* Two-column: Activity + Flags/Deadlines */}
      <div data-stage className="relative z-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentActivity activities={dashboard.recentActivity} />
          <div className="space-y-6">
            <ScopeFlagsSummary flags={dashboard.urgentFlags} />
            <UpcomingDeadlines deadlines={dashboard.upcomingDeadlines} />
          </div>
        </div>
      </div>

      <div data-stage className="relative z-10">
        <ScopeFlagSlaWidget />
      </div>

      <div data-stage className="relative z-10">
        <DataFlywheelWidget
          metrics={{ flagsPerMonth: dashboard.metrics.pendingScopeFlags }}
        />
      </div>
    </div>
  );
}
