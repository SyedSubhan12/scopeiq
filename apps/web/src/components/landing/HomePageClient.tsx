"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  FileText,
  ShieldCheck,
  Layers,
  ArrowRight,
  Star,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { HomeNavbar } from "@/components/HomeNavbar";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { HeroFloatingLotties } from "@/components/landing/HeroFloatingLotties";
import { LottieFromPublic } from "@/components/shared/lottie/LottieFromPublic";
import { LANDING_LOTTIE } from "@/components/shared/lottie/app-lottie-paths";

const features = [
  {
    icon: FileText,
    title: "AI-Scored Brief Builder",
    description:
      "Clients fill a structured brief. Our AI scores it for clarity and flags missing information before your team touches it.",
  },
  {
    icon: ShieldCheck,
    title: "Scope Guard",
    description:
      "Every deliverable is tracked against the original brief. Scope creep is flagged automatically, not discovered in invoice disputes.",
  },
  {
    icon: Layers,
    title: "Client Approval Portal",
    description:
      "Clients review, annotate, and approve deliverables through a branded portal with less back-and-forth and cleaner sign-off trails.",
  },
  {
    icon: Zap,
    title: "Change Order Automation",
    description:
      "Out-of-scope work generates a change order with one click. Get sign-off before you start, not after.",
  },
];

const steps = [
  {
    step: "1",
    title: "Build your brief template",
    body: "Create a reusable intake form for your service type. Add fields, mark required ones.",
  },
  {
    step: "2",
    title: "Share with your client",
    body: "Send a link. The client fills the brief with no account required. AI scores it instantly.",
  },
  {
    step: "3",
    title: "Deliver and track approvals",
    body: "Upload deliverables to a branded portal. Clients annotate and approve with one click.",
  },
];

const HOME_BOOT_LOTTIES = [
  LANDING_LOTTIE.cubeShape,
  LANDING_LOTTIE.seoIsometric,
  LANDING_LOTTIE.techSupport,
  LANDING_LOTTIE.paperplane,
];

function MarketingLottie({
  src,
  containerClassName,
  className,
}: {
  src: string;
  containerClassName: string;
  className: string;
}) {
  return (
    <LottieFromPublic
      src={src}
      loop
      decorative
      speed={0.9}
      containerClassName={containerClassName}
      className={className}
      placeholderClassName="aspect-[1.1/1] w-full"
      reducedMotionFallback={
        <div className="aspect-[1.1/1] w-full rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,110,86,0.08),rgba(255,255,255,0.82),rgba(15,110,86,0.12))]" />
      }
    />
  );
}

export function HomePageClient() {
  useAssetsReady({
    scopeId: "page:home",
    lottieSrcs: HOME_BOOT_LOTTIES,
  });

  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const hoverLift = reduceMotion ? undefined : { y: -4 };
  const fadeInUp = reduceMotion ? undefined : { opacity: 1, y: 0 };
  const fadeFromBelow = reduceMotion ? false : { opacity: 0, y: 12 };
  const fadeFromBelowLarge = reduceMotion ? false : { opacity: 0, y: 18 };
  const fadeFromBelowCard = reduceMotion ? false : { opacity: 0, y: 24 };

  const cardYOffset = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -34]);
  const glassYOffset = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 54]);
  const badgeYOffset = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -18]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f7f7f2] text-slate-950">
      <HomeNavbar />

      <section ref={heroRef} className="relative overflow-hidden pb-20 pt-16 sm:pb-24 sm:pt-20">
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ y: glassYOffset }}
          aria-hidden
        >
          <div className="absolute left-[-8%] top-[-6%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(15,110,86,0.18),transparent_64%)] blur-2xl" />
          <div className="absolute right-[-10%] top-[12%] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(184,216,208,0.8),transparent_62%)] blur-3xl" />
          <div className="absolute inset-x-[12%] bottom-[-18%] h-[20rem] rounded-[50%] bg-[radial-gradient(circle_at_center,rgba(15,110,86,0.12),transparent_68%)] blur-3xl" />
        </motion.div>

        <HeroFloatingLotties scrollYProgress={scrollYProgress} />

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0F6E56]/15 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0F6E56] backdrop-blur"
            style={{ y: badgeYOffset }}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            Built for creative agencies
          </motion.div>

          <h1 className="mx-auto mt-4 max-w-4xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
            Scope control that
            <span className="block text-[#0F6E56]">feels cinematic, not clerical.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            ScopeIQ helps agencies protect revenue with AI-scored briefs, approval
            flows, and automated change orders in one calm, high-signal workspace.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#0F6E56] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,110,86,0.22)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#0a5c47]"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur transition-colors duration-300 hover:bg-white"
            >
              Sign in to dashboard
            </Link>
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-400">
            No credit card required · Setup in 5 minutes
          </p>

          <motion.div
            className="relative mx-auto mt-16 max-w-5xl"
            style={{ y: cardYOffset }}
          >
            <div className="absolute inset-x-[7%] top-6 -z-10 h-full rounded-[2rem] bg-[#0F6E56]/10 blur-3xl" />

            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,247,244,0.88))] px-4 py-3 sm:px-6">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#d97757]" />
                  <div className="h-3 w-3 rounded-full bg-[#e3b341]" />
                  <div className="h-3 w-3 rounded-full bg-[#0F6E56]" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  app.scopeiq.io
                </span>
              </div>

              <div className="grid gap-0 lg:grid-cols-[1.05fr_2.2fr]">
                <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#fafbf7,rgba(248,249,244,0.68))] p-5 lg:border-b-0 lg:border-r">
                  <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/90 p-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                      Workspace pulse
                    </p>
                    <div className="mt-5 space-y-2">
                      {["Dashboard", "Projects", "Briefs", "Approvals", "Settings"].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${index === 0
                            ? "bg-[#0F6E56] text-white shadow-[0_10px_30px_rgba(15,110,86,0.18)]"
                            : "bg-[#f6f7f3] text-slate-500"
                            }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[linear-gradient(180deg,#fbfcf9,rgba(244,247,242,0.92))] p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Active Projects", value: "12" },
                      { label: "Pending Briefs", value: "4" },
                      { label: "Awaiting Approval", value: "7" },
                    ].map((metric) => (
                      <motion.div
                        key={metric.label}
                        className="rounded-[1.35rem] border border-slate-200/80 bg-white/95 p-4 shadow-sm"
                        {...(hoverLift ? { whileHover: hoverLift } : {})}
                        transition={{ duration: 0.24 }}
                      >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                          {metric.value}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          Live projects
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Workflows with scope signals and approval state.
                        </p>
                      </div>
                      <div className="rounded-full border border-[#0F6E56]/15 bg-[#0F6E56]/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0F6E56]">
                        Synced
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        {
                          name: "Brand Identity — Nike",
                          stage: "Healthy scope",
                          status: "Active",
                        },
                        {
                          name: "Web Redesign — Spotify",
                          stage: "2 change orders pending",
                          status: "Review",
                        },
                        {
                          name: "Campaign — LVMH",
                          stage: "Client approval in progress",
                          status: "Active",
                        },
                      ].map((project, index) => (
                        <motion.div
                          key={project.name}
                          className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-100 bg-[#f8faf7] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:flex-row sm:items-center sm:justify-between"
                          initial={fadeFromBelow}
                          {...(fadeInUp ? { animate: fadeInUp } : {})}
                          transition={{ duration: 0.35, delay: 0.08 * index }}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{project.stage}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0F6E56] shadow-sm">
                            {project.status}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#0F6E56]">
              Built around leverage
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-[-0.03em] text-slate-950 sm:text-4xl">
              A cleaner operating system for agency delivery.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              The homepage motion direction is inspired by Sequel’s current site emphasis
              on timeless layouts, restrained depth, and “always in motion” storytelling.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }, index) => (
              <motion.div
                key={title}
                className="rounded-[1.75rem] border border-slate-200 bg-[#fbfcf8] p-6 shadow-sm"
                initial={fadeFromBelowCard}
                {...(fadeInUp ? { whileInView: fadeInUp } : {})}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F6E56]/10">
                  <Icon className="h-5 w-5 text-[#0F6E56]" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-950">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div
              className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#fbfcf8,rgba(244,247,242,0.95))] p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8"
              initial={fadeFromBelowLarge}
              {...(fadeInUp ? { whileInView: fadeInUp } : {})}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45 }}
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#0F6E56]">
                Intelligent workflow layer
              </p>
              <h3 className="mt-4 max-w-lg font-serif text-3xl tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Brief clarity, delivery risk, and approvals shown in one visual rhythm.
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                ScopeIQ connects intake quality, live production status, and approval momentum.
                The result is less digging, faster decisions, and fewer expensive surprises.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Brief completion", value: "92%" },
                  { label: "Scope confidence", value: "High" },
                  { label: "Approval lag", value: "-34%" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="rounded-[1.4rem] border border-white/80 bg-white/90 px-4 py-4 shadow-sm"
                    initial={fadeFromBelow}
                    {...(fadeInUp ? { whileInView: fadeInUp } : {})}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.32, delay: 0.06 * index }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={fadeFromBelowCard}
              {...(fadeInUp ? { whileInView: fadeInUp } : {})}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              <div className="absolute inset-x-[12%] top-[8%] h-[72%] rounded-[2rem] bg-[#0F6E56]/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,247,242,0.92))] p-4 shadow-[0_26px_70px_rgba(15,23,42,0.12)] sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      Visual intelligence
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      AI context wrapped in a calmer delivery surface.
                    </p>
                  </div>
                  <div className="rounded-full border border-[#0F6E56]/15 bg-[#0F6E56]/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0F6E56]">
                    Live model
                  </div>
                </div>

                <MarketingLottie
                  src={LANDING_LOTTIE.seoIsometric}
                  containerClassName="mx-auto w-full max-w-[34rem]"
                  className="h-auto w-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f3f5ef] py-20 overflow-hidden relative">
        <div className="mx-auto max-w-6xl px-6 relative">
          {/* Section decoration - paperplane at top-left */}
          <MarketingLottie
            src={LANDING_LOTTIE.paperplane}
            containerClassName="absolute -left-28 -top-14 w-72 h-72 opacity-40 rotate-[-12deg] pointer-events-none"
            className="h-auto w-full object-contain"
          />
          <div className="mb-12 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#0F6E56]">
              How it works
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-[-0.03em] text-slate-950">
              From brief to approval in three controlled moves.
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              {steps.map(({ step, title, body }, index) => (
                <motion.div
                  key={step}
                  className="flex gap-5 rounded-[1.5rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur"
                  initial={fadeFromBelowLarge}
                  {...(fadeInUp ? { whileInView: fadeInUp } : {})}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0F6E56] text-sm font-bold text-white">
                    {step}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="relative hidden lg:block"
              initial={fadeFromBelowCard}
              {...(fadeInUp ? { whileInView: fadeInUp } : {})}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute inset-x-[10%] top-[10%] h-[72%] rounded-[2rem] bg-[#0F6E56]/12 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(239,247,243,0.88))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.09)] backdrop-blur-xl">
                <div className="mb-3 relative z-10">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#0F6E56]">Delivered with clarity</p>
                  <p className="mt-1 text-sm text-slate-500">Every brief lands in the right inbox, fast.</p>
                </div>

                <MarketingLottie
                  src={LANDING_LOTTIE.seoIsometric}
                  containerClassName="mx-auto w-full max-w-[22rem] relative z-10"
                  className="h-auto w-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#0F6E56] py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="max-w-2xl text-center lg:text-left">
            <p className="text-[11px] uppercase tracking-[0.26em] text-[#bfe8db]">
              Real support, not just software
            </p>
            <h2 className="mt-4 font-serif text-3xl tracking-[-0.03em] text-white sm:text-4xl">
              Ready to protect your revenue?
            </h2>
            <p className="mt-3 text-[#b5e1d5]">
              Join agencies that use ScopeIQ to run tighter projects, keep clients aligned,
              and get paid for the work they actually deliver.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0F6E56] transition-colors hover:bg-[#eef7f4]"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12"
              >
                Explore the dashboard
              </Link>
            </div>
          </div>

          <motion.div
            className="relative"
            initial={fadeFromBelowCard}
            {...(fadeInUp ? { whileInView: fadeInUp } : {})}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
          >
            <div className="absolute inset-x-[16%] top-[12%] h-[70%] rounded-[2rem] bg-white/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] p-4 backdrop-blur-xl sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#bfe8db]">
                    Support loop
                  </p>
                  <p className="mt-1 text-sm text-[#d9f1ea]">
                    Human help for implementation, adoption, and client rollout.
                  </p>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  Included
                </div>
              </div>

              <MarketingLottie
                src={LANDING_LOTTIE.techSupport}
                containerClassName="mx-auto w-full max-w-[30rem]"
                className="h-auto w-full object-contain"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span className="text-sm font-bold text-[#0F6E56]">ScopeIQ</span>
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
