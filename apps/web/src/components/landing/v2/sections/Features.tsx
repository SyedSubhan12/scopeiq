"use client";

import { motion } from "framer-motion";
import {
  Check,
  FileText,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  badge: string;
  title: string;
  headline: string;
  body: string;
  bullets: string[];
  icon: LucideIcon;
  accent: string;
};

const FEATURES: Feature[] = [
  {
    badge: "Module 01",
    title: "Brief Builder",
    headline: "Catch Vague Briefs Before Work Starts",
    body:
      "Drag-and-drop intake forms with AI clarity scoring (0–100). Briefs below your threshold are auto-held and clients prompted to clarify — before a single hour is spent.",
    bullets: [
      "AI clarity score in <10 seconds",
      "Auto-hold + client clarification email",
      "Embeddable on any website",
      "Version history with diff view",
    ],
    icon: FileText,
    accent: "rgba(29,158,117,0.55)",
  },
  {
    badge: "Module 02",
    title: "Approval Portal",
    headline: "White-Label Client Reviews. Zero Email Threads.",
    body:
      "A branded portal where clients review deliverables, leave point-anchored annotations, and approve work — with an automated reminder sequence that protects your timeline.",
    bullets: [
      "Your logo, colors, custom domain",
      "Click-to-pin annotations on images & PDFs",
      "Revision round counter shown to both sides",
      "Silence-as-approval after configurable sequence",
    ],
    icon: CheckSquare,
    accent: "rgba(37,99,235,0.45)",
  },
  {
    badge: "Module 03",
    title: "Scope Guard",
    headline: "Out-of-Scope Requests Flagged in Under 5 Seconds.",
    body:
      "Upload your SOW and every client message is cross-checked in real time. Flagged requests surface with the exact SOW clause they violate — plus a one-click change order generator.",
    bullets: [
      "SOW parsing in <30 seconds",
      "Real-time scope monitoring across all channels",
      "AI-generated suggested response",
      "One-click change order, pre-priced from your rate card",
    ],
    icon: ShieldCheck,
    accent: "rgba(220,38,38,0.5)",
  },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-white py-28 md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(15,110,86,0.1), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center text-black"
        >
          <span className="inline-block rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-[#0F6E56]">
            Three Modules · One Workflow
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-5xl text-black">
            <span className="bg-gradient-to-b from-black to-black/50 bg-clip-text text-transparent">
              From Brief to Delivery,
            </span>
            <br />
            <span className="bg-gradient-to-b from-[#1D9E75] to-[#0F6E56] bg-clip-text text-transparent">
              Fully Protected.
            </span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-black/80">
            ScopeIQ&apos;s three integrated modules cover the entire client engagement lifecycle — each
            one solving a distinct revenue leak.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.08,
              }}
              className="group relative flex flex-col rounded-3xl border border-black/5 bg-[#F9F9F9] p-8 text-black transition-colors hover:border-[rgba(29,158,117,0.3)]"
              style={{
                // custom property consumed by the hover glow pseudo-element
                "--accent": f.accent,
              } as React.CSSProperties}
            >
              {/* Accent glow on hover (subtle for light mode) */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at 50% 0%, var(--accent), transparent 60%)`,
                  filter: "blur(24px)",
                  opacity: 0.15
                }}
              />

              <div className="flex items-center justify-between">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5 text-[#0F6E56] ring-1 ring-black/5"
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-widest text-black/40">
                  {f.badge}
                </span>
              </div>

              <h3 className="mt-6 font-display text-xl font-bold text-black">{f.title}</h3>
              <p className="mt-2 font-display text-lg font-semibold text-[#0F6E56]">{f.headline}</p>
              <p className="mt-3 text-sm leading-relaxed text-black/80">{f.body}</p>

              <ul className="mt-5 space-y-2">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-black/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1D9E75]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-12 hidden max-w-lg items-center justify-center gap-3 text-xs uppercase tracking-widest text-black/60 lg:flex"
        >
          <Sparkles className="h-4 w-4 text-[#1D9E75]" />
          <span>One continuous workflow</span>
          <ArrowRight className="h-3 w-3" />
        </motion.div>
      </div>
    </section>
  );
}
