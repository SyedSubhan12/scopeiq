"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, TrendingUp, TrendingDown, DollarSign, type LucideIcon } from "lucide-react";

type Persona = {
  tag: string;
  name: string;
  headline: string;
  subtitle: string;
  stats: { icon: LucideIcon; value: string; label: string }[];
  quote: string;
  benefits: string[];
  color: string;
};

const PERSONAS: Persona[] = [
  {
    tag: "Solo Freelancer · 1–3 active clients",
    name: "For Maya",
    headline: "Look Like a Studio. Work Like One Too.",
    subtitle: "Embeddable brief form, automatic reminders, change orders in seconds.",
    stats: [
      { icon: TrendingUp, value: "↑ 40%", label: "Reduction in back-and-forth brief clarification" },
      { icon: TrendingDown, value: "↓ 80%", label: "Less time chasing approvals manually" },
      { icon: DollarSign, value: "+$8,400", label: "Average additional revenue captured per year" },
    ],
    quote:
      "I used to start every project half-blind. Now clients either give me what I need or ScopeIQ asks for it.",
    benefits: [
      "Embeddable brief form, no dev work",
      "Automatic reminders so you stop chasing",
      "Change orders in seconds, not hours",
    ],
    color: "from-[#1D9E75] to-[#0F6E56]",
  },
  {
    tag: "Studio Lead · 3–5 person team",
    name: "For James",
    headline: "Give Your Team the Authority to Enforce Scope.",
    subtitle: "Multi-user workspace, branded portals, team-visible scope meter on every project.",
    stats: [
      { icon: TrendingDown, value: "↓ 90%", label: "Scope disputes that escalate to the director" },
      { icon: TrendingUp, value: "↑ 3×", label: "More change orders issued vs. work absorbed silently" },
      { icon: TrendingDown, value: "↓ 60%", label: "Time spent on approval admin per project" },
    ],
    quote:
      "Every team member now has something to point to. 'ScopeIQ flagged it' beats every awkward conversation.",
    benefits: [
      "Multi-user workspace with role controls",
      "Branded portal per client, at your domain",
      "Team-visible scope meter on every project",
    ],
    color: "from-[#0F6E56] to-[#0A3D2E]",
  },
  {
    tag: "Agency Ops Manager · 10–20 person agency",
    name: "For Priya",
    headline: "One System of Record. Zero Scope Disputes.",
    subtitle: "Full audit log, export to Notion or Linear, Slack integration for instant flag notifications.",
    stats: [
      { icon: TrendingDown, value: "↓ 35%", label: "Account manager time on admin work" },
      { icon: TrendingUp, value: "100%", label: "Client decisions captured with timestamp + actor" },
      { icon: TrendingUp, value: "↑ 2×", label: "Faster project kickoff with structured brief intake" },
    ],
    quote:
      "Before ScopeIQ, scope disputes were a memory contest. Now every decision has a timestamp and an audit trail.",
    benefits: [
      "Full audit log: every action, actor, timestamp",
      "Export scope decisions to Notion or Linear",
      "Slack integration for instant flag notifications",
    ],
    color: "from-[#0A3D2E] to-[#1D9E75]",
  },
];

export function PersonaBenefits() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % PERSONAS.length), 6800);
    return () => clearInterval(t);
  }, [isPaused]);

  const persona = PERSONAS[index] ?? PERSONAS[0]!;

  return (
    <section className="lv2-surface-dark relative overflow-hidden py-28 md:py-36 bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(29,158,117,0.1), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center text-black">
          <span className="lv2-label text-[#0F6E56]">Built for Your Business Size</span>
          <h2 className="lv2-h2 mt-4 text-black">
            Whether You&apos;re a Solo Freelancer
            <br />
            or a 20-Person Studio.
          </h2>
        </div>

        <div
          className="mx-auto mt-14 max-w-5xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ perspective: "1400px" }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-[#F9F9F9] p-8 md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, rotateY: -20, y: 30 }}
                animate={{ opacity: 1, rotateY: 0, y: 0 }}
                exit={{ opacity: 0, rotateY: 20, y: -30 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-10 md:grid-cols-[1.1fr,1fr]"
              >
                <div>
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${persona.color} text-white shadow-[0_20px_60px_-10px_rgba(15,110,86,0.3)]`}>
                    <span className="font-display text-2xl font-bold">{(persona.name.split(" ")[1] ?? persona.name)[0]}</span>
                  </div>
                  <p className="mt-5 text-xs font-medium uppercase tracking-widest text-[#0F6E56]">
                    {persona.tag}
                  </p>
                  <h3 className="lv2-h1 mt-3 text-black">{persona.name}</h3>
                  <p className="font-display mt-3 text-2xl font-semibold text-black/90 md:text-3xl">
                    {persona.headline}
                  </p>
                  <blockquote className="mt-6 flex gap-3 rounded-xl border-l-2 border-[#1D9E75] bg-black/[0.03] p-4 text-sm italic text-gray-700">
                    <Quote className="h-4 w-4 shrink-0 text-[#1D9E75]" />
                    {persona.quote}
                  </blockquote>
                </div>

                <div>
                  <div className="space-y-3">
                    {persona.stats.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center gap-4 rounded-xl border border-black/5 bg-white p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1D9E75]/10 text-[#0F6E56]">
                          <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-display text-xl font-bold text-black">{s.value}</div>
                          <p className="text-xs text-black/60">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ul className="mt-6 space-y-2 text-sm text-black/75">
                    {persona.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D9E75]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + PERSONAS.length) % PERSONAS.length)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/70 hover:bg-black/5"
              aria-label="Previous persona"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % PERSONAS.length)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/70 hover:bg-black/5"
              aria-label="Next persona"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
