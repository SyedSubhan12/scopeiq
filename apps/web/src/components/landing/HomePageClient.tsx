"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  ArrowRight,
  FileText,
  Layers3,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { HomeNavbar } from "@/components/HomeNavbar";
import { useLenisScroll } from "@/hooks/useLenisScroll";

const featureCards = [
  {
    icon: FileText,
    eyebrow: "Brief Intelligence",
    title: "Shape cleaner inputs before production begins.",
    body: "Standardize client intake, score clarity, and stop vague briefs from becoming expensive internal guesswork.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Scope Guard",
    title: "Track delivery against what was actually approved.",
    body: "Keep the original brief, revision state, and risk signals visible while work moves across the team.",
  },
  {
    icon: Layers3,
    eyebrow: "Approval Flow",
    title: "Give clients one calm place to respond.",
    body: "Approvals, annotations, and feedback live in a single branded workflow instead of scattered email threads.",
  },
  {
    icon: TimerReset,
    eyebrow: "Change Orders",
    title: "Turn ambiguity into signed scope before work expands.",
    body: "Convert out-of-scope asks into clear, billable decisions while the context is still fresh.",
  },
];

const workflowSteps = [
  {
    label: "01",
    title: "Capture a brief with structure, not vibes.",
    body: "Use reusable templates that ask for the details your team actually needs to estimate and deliver with confidence.",
  },
  {
    label: "02",
    title: "Watch risk surface while the project is still healthy.",
    body: "ScopeIQ keeps clarity, progress, and approval momentum visible so project leads can intervene before drift compounds.",
  },
  {
    label: "03",
    title: "Protect delivery quality without slowing the client down.",
    body: "Clients approve in a clean portal, while your team keeps a durable record of what changed, what was accepted, and why.",
  },
];

const operatingMetrics = [
  { label: "Brief completion", value: "92%" },
  { label: "Approval lag", value: "-34%" },
  { label: "Recovered scope", value: "$18k" },
  { label: "Client clarity", value: "4.8" },
];

const outcomeCards = [
  {
    title: "Creative teams stay in flow.",
    body: "The interface keeps execution signals visible without turning the whole experience into project-manager software theater.",
  },
  {
    title: "Clients feel guided, not policed.",
    body: "Motion and hierarchy make the product feel high-touch while the underlying system tightens process and accountability.",
  },
  {
    title: "Finance gets cleaner handoff points.",
    body: "When approvals and scope changes are explicit, billing becomes a conclusion instead of a negotiation.",
  },
];

function StatCounter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const numeric = value.replace(/[^0-9]/g, "");
    if (!numeric) return;

    const prefix = value.startsWith("-") ? "-" : value.startsWith("$") ? "$" : "";
    const suffix = value.replace(/^[^0-9-]*-?[0-9]+/, "");

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || triggeredRef.current) return;

        triggeredRef.current = true;
        observer.disconnect();

        void import("animejs").then((mod) => {
          const anime = (mod as { default: (params: unknown) => { pause?: () => void } }).default;
          const state = { amount: 0 };

          anime({
            targets: state,
            amount: parseInt(numeric, 10),
            duration: 1200,
            easing: "easeOutExpo",
            round: 1,
            update: () => {
              element.textContent = `${prefix}${Math.round(state.amount)}${suffix}`;
            },
          });
        });
      },
      { threshold: 0.55 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <p ref={ref} className={className}>
      {value}
    </p>
  );
}

export function HomePageClient() {
  const reduceMotion = useReducedMotion();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  useLenisScroll({
    enabled: !reduceMotion,
    desktopOnly: true,
    syncWithGsap: true,
    duration: 1.02,
    lerp: 0.085,
  });

  useEffect(() => {
    if (reduceMotion || !pageRef.current) return;

    let active = true;
    let cleanup: (() => void) | undefined;

    void Promise.all([import("gsap/dist/gsap"), import("gsap/dist/ScrollTrigger")]).then(
      ([gsapMod, scrollTriggerMod]) => {
        if (!active || !pageRef.current) return;

        const gsap = (gsapMod as { default: any }).default;
        const ScrollTrigger = (scrollTriggerMod as { default: any }).default;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          const heroItems = pageRef.current?.querySelectorAll<HTMLElement>("[data-hero-reveal]");
          if (heroItems?.length) {
            gsap.from(heroItems, {
              autoAlpha: 0,
              y: 28,
              duration: 0.78,
              stagger: 0.08,
              ease: "power3.out",
              clearProps: "all",
            });
          }

          const ambientNodes = pageRef.current?.querySelectorAll<HTMLElement>("[data-ambient]");
          ambientNodes?.forEach((node, index) => {
            gsap.to(node, {
              yPercent: index % 2 === 0 ? -9 : 9,
              xPercent: index === 1 ? 6 : -4,
              rotate: index === 2 ? -8 : 8,
              duration: 11 + index * 1.4,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
            });
          });

          const revealNodes = pageRef.current?.querySelectorAll<HTMLElement>("[data-reveal]");
          revealNodes?.forEach((node, index) => {
            gsap.from(node, {
              autoAlpha: 0,
              y: 42,
              duration: 0.72,
              ease: "power3.out",
              delay: index * 0.02,
              clearProps: "all",
              scrollTrigger: {
                trigger: node,
                start: "top 84%",
                once: true,
              },
            });
          });

          const mockup = pageRef.current?.querySelector<HTMLElement>("[data-hero-mockup]");
          if (mockup && heroRef.current) {
            gsap.to(mockup, {
              yPercent: -6,
              rotateX: 0,
              ease: "none",
              scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 0.7,
              },
            });
          }

          const progressLine = pageRef.current?.querySelector<HTMLElement>("[data-progress-line]");
          const storySection = pageRef.current?.querySelector<HTMLElement>("[data-story-root]");
          if (progressLine && storySection) {
            gsap.fromTo(
              progressLine,
              { scaleY: 0, transformOrigin: "top center" },
              {
                scaleY: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: storySection,
                  start: "top 70%",
                  end: "bottom 45%",
                  scrub: 0.55,
                },
              },
            );
          }
        }, pageRef);

        cleanup = () => ctx.revert();
      },
    );

    return () => {
      active = false;
      cleanup?.();
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !pageRef.current) return;

    let cancelled = false;
    let animation: { pause?: () => void } | undefined;

    void import("animejs").then((mod) => {
      if (cancelled || !pageRef.current) return;

      const anime = (mod as {
        default: ((params: unknown) => { pause?: () => void }) & { stagger: (value: number) => unknown };
      }).default;

      animation = anime({
        targets: pageRef.current.querySelectorAll("[data-pulse-chip]"),
        translateY: [0, -6, 0],
        opacity: [0.8, 1, 0.8],
        delay: anime.stagger(140),
        duration: 1900,
        easing: "easeInOutSine",
        loop: true,
      });
    });

    return () => {
      cancelled = true;
      animation?.pause?.();
    };
  }, [reduceMotion]);

  return (
    <div ref={pageRef} className="min-h-screen overflow-x-clip bg-[#f6f4ee] text-slate-950">
      <HomeNavbar />

      <section
        ref={heroRef}
        className="relative overflow-hidden border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(15,110,86,0.18),transparent_32%),linear-gradient(180deg,#f8f6f0_0%,#f2efe7_100%)] pb-20 pt-14 sm:pb-24 sm:pt-18"
      >
        <div data-ambient className="pointer-events-none absolute left-[-8%] top-[2%] h-72 w-72 rounded-full bg-[#0F6E56]/12 blur-3xl" />
        <div data-ambient className="pointer-events-none absolute right-[-10%] top-[14%] h-80 w-80 rounded-full bg-[#d9ece5] blur-3xl" />
        <div data-ambient className="pointer-events-none absolute bottom-[-8%] left-[24%] h-72 w-72 rounded-full bg-[#ffffff]/70 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
          <div className="max-w-2xl">
            <div
              data-hero-reveal
              className="inline-flex items-center gap-2 rounded-full border border-[#0F6E56]/15 bg-white/75 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0F6E56] backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Delivery control for creative studios
            </div>

            <h1
              data-hero-reveal
              className="mt-6 max-w-4xl font-serif text-5xl leading-[0.92] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl"
            >
              The homepage should feel expensive.
              <span className="block text-[#0F6E56]">The workflow should feel under control.</span>
            </h1>

            <p
              data-hero-reveal
              className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg"
            >
              ScopeIQ gives agencies a cinematic client-facing surface backed by hard
              delivery mechanics: structured briefs, scope tracking, cleaner approvals,
              and faster change-order decisions.
            </p>

            <div data-hero-reveal className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#0F6E56] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,110,86,0.22)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#0b5f49]"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur transition-colors duration-300 hover:bg-white"
              >
                Enter dashboard
              </Link>
            </div>

            <div data-hero-reveal className="mt-10 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span data-pulse-chip className="rounded-full border border-white/70 bg-white/75 px-3 py-2 backdrop-blur">
                AI brief scoring
              </span>
              <span data-pulse-chip className="rounded-full border border-white/70 bg-white/75 px-3 py-2 backdrop-blur">
                Approval state
              </span>
              <span data-pulse-chip className="rounded-full border border-white/70 bg-white/75 px-3 py-2 backdrop-blur">
                Scope recovery
              </span>
            </div>

            <div data-hero-reveal className="mt-10 grid gap-3 sm:grid-cols-3">
              {operatingMetrics.slice(0, 3).map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.5rem] border border-white/70 bg-white/82 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {metric.label}
                  </p>
                  <StatCounter
                    value={metric.value}
                    className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-x-[10%] top-[8%] h-[72%] rounded-[2.5rem] bg-[#0F6E56]/12 blur-3xl" />

            <div
              data-hero-mockup
              className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,246,0.84))] p-4 shadow-[0_32px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-6"
              style={{ transform: "perspective(1400px) rotateX(4deg)" }}
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#d97757]" />
                  <span className="h-3 w-3 rounded-full bg-[#e4b74a]" />
                  <span className="h-3 w-3 rounded-full bg-[#0F6E56]" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  app.scopeiq.io
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
                <div className="rounded-[1.6rem] border border-slate-200/80 bg-[#fbfbf8] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Command rail
                  </p>
                  <div className="mt-4 space-y-2">
                    {["Overview", "Briefs", "Scope", "Approvals", "Billing"].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                          index === 2
                            ? "bg-[#0F6E56] text-white shadow-[0_14px_28px_rgba(15,110,86,0.18)]"
                            : "bg-white text-slate-500"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Projects", value: "12" },
                      { label: "At risk", value: "3" },
                      { label: "Approvals", value: "7" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1.4rem] border border-slate-200/80 bg-white px-4 py-4 shadow-sm"
                      >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[1.6rem] border border-slate-200/80 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          Scope health board
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          The system makes pressure visible before it becomes rework.
                        </p>
                      </div>
                      <span className="rounded-full bg-[#0F6E56]/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0F6E56]">
                        Live
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        {
                          title: "Spotify rebrand rollout",
                          note: "Two extra asset requests converted into a signed change order.",
                          tone: "bg-[#ecf6f3] text-[#0F6E56]",
                        },
                        {
                          title: "Nike campaign retainer",
                          note: "Awaiting final stakeholder approval with full revision history attached.",
                          tone: "bg-[#f4f2ea] text-slate-700",
                        },
                        {
                          title: "LVMH microsite sprint",
                          note: "Brief clarity improved after AI scored missing content dependencies.",
                          tone: "bg-[#f2f6fb] text-slate-700",
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[1.35rem] border border-slate-100 bg-[#f8faf7] px-4 py-4"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">{item.note}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.tone}`}>
                              Protected
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              data-reveal
              className="absolute -bottom-4 left-4 max-w-[14rem] rounded-[1.4rem] border border-white/70 bg-white/88 px-4 py-4 shadow-[0_18px_35px_rgba(15,23,42,0.1)] backdrop-blur"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Approval momentum
              </p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                Feedback is routed once, not repeated across channels.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div data-reveal className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#0F6E56]">Motion with purpose</p>
            <h2 className="mt-4 font-serif text-3xl tracking-[-0.04em] text-slate-950 sm:text-5xl">
              The homepage now uses lighter motion on different layers instead of one expensive animation pileup.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">
              GSAP handles hero and section choreography, Anime.js handles counters and
              ambient micro-movement, and Lenis is limited to the environments where it
              actually improves feel instead of adding drag.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featureCards.map(({ icon: Icon, eyebrow, title, body }) => (
              <article
                key={title}
                data-reveal
                className="group rounded-[1.9rem] border border-slate-200 bg-[#fbfbf7] p-6 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F6E56]/10 text-[#0F6E56]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F6E56]">
                  {eyebrow}
                </p>
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-story-root className="relative overflow-hidden bg-[#eef2eb] py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div data-reveal className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#0F6E56]">How it works</p>
              <h2 className="mt-4 font-serif text-3xl tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Three controlled moves from brief to sign-off.
              </h2>
            </div>

            <div className="relative mt-10 pl-10">
              <div className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-black/8" />
              <div data-progress-line className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-[#0F6E56]" />

              <div className="space-y-8">
                {workflowSteps.map((step) => (
                  <article key={step.label} data-reveal className="relative rounded-[1.8rem] border border-white/70 bg-white/82 p-6 shadow-sm backdrop-blur">
                    <div className="absolute -left-[40px] top-6 flex h-8 w-8 items-center justify-center rounded-full border border-[#0F6E56]/20 bg-white text-[11px] font-bold tracking-[0.18em] text-[#0F6E56]">
                      {step.label}
                    </div>
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{step.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:pt-16">
            <div data-reveal className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,249,244,0.84))] p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#0F6E56]">Operator readout</p>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                The page now spreads motion across components instead of stacking it on one hero.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Hero reveal, section entrance, metric count-up, mockup drift, and chip pulse each
                have a separate job. That keeps the experience active without making scroll feel heavy.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {operatingMetrics.map((metric) => (
                <div
                  key={metric.label}
                  data-reveal
                  className="rounded-[1.7rem] border border-white/70 bg-white/84 p-5 shadow-sm"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {metric.label}
                  </p>
                  <StatCounter
                    value={metric.value}
                    className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#101d19] py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div data-reveal className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#9cd7c7]">
                Why this is faster
              </p>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl tracking-[-0.04em] text-white sm:text-5xl">
                The lag was mostly architectural, not aesthetic.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#c8ded7]">
              The old page boot-blocked multiple Lottie assets, ran several large JSON animations,
              and layered Framer and GSAP over the same visual region. This version keeps the visual
              ambition but shifts the work to cheaper transforms and scoped timelines.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {outcomeCards.map((card) => (
              <article
                key={card.title}
                data-reveal
                className="rounded-[1.9rem] border border-white/10 bg-white/6 p-6 backdrop-blur"
              >
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">
                  {card.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#c8ded7]">{card.body}</p>
              </article>
            ))}
          </div>

          <div
            data-reveal
            className="mt-12 flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] px-6 py-6 sm:flex-row sm:items-center"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#9cd7c7]">
                App Router note
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#d8ece6]">
                Barba.js is intentionally not used here. In this Next.js App Router setup,
                GSAP plus Lenis plus Anime.js is the safer stack for premium motion without
                fighting the router lifecycle.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0F6E56] transition-colors hover:bg-[#edf7f3]"
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border border-white/16 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center gap-3 sm:justify-start">
            <Image src="/logo.svg" alt="ScopeIQ" width={160} height={160} className="h-10 w-auto" />
            <span className="text-xl font-bold text-[#0F6E56]">ScopeIQ</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 sm:justify-start">
            <Link href="/login" className="hover:text-slate-600">
              Log in
            </Link>
            <Link href="/register" className="hover:text-slate-600">
              Register
            </Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 ScopeIQ</p>
        </div>
      </footer>
    </div>
  );
}
