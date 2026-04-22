"use client";

import { useLayoutEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import gsap from "@/lib/gsap-setup";
import { ParticleField } from "../ui/ParticleField";
import { ScopeFlagPulse } from "../ui/ScopeFlagPulse";
import { GlowButton } from "../ui/GlowButton";
import { prefersReducedMotion } from "@/lib/landing/animations";
import { BlurReveal } from "@/components/ui/blur-reveal";

const STATS = [
  "79% of agencies over-service clients",
  "15–25% annual revenue lost to scope creep",
  "<5 sec to flag out-of-scope requests",
  "3–6 revision rounds saved per project",
];

// Voxr-grammar variants — staggerChildren, easeOutExpo curve [0.16, 1, 0.3, 1]
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const headline: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current || prefersReducedMotion()) return;
    const root = rootRef.current;
    const ctx = gsap.context(() => {
      // Pulsing background glow (Voxr spec)
      gsap.to(".hero-glow", {
        scale: 1.2,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      // Secondary slow drift glow
      gsap.to(".hero-glow-2", {
        scale: 1.35,
        opacity: 0.8,
        duration: 14,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      // Mockup gentle float
      gsap.to(".hero-mockup", {
        y: -12,
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, root);

    // Mouse-follow glow (subtle parallax)
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      gsap.to(".hero-glow", { x, y, duration: 1.2, ease: "power2.out", overwrite: "auto" });
    };
    if (!window.matchMedia("(pointer: coarse)").matches) {
      window.addEventListener("mousemove", onMove, { passive: true });
    }

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="hero relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white pb-20 pt-32 text-center md:pb-28 md:pt-36"
    >
      {/* Pulsing radial glows (GSAP driven) */}
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[80vh] w-[80vw] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(29,158,117,0.15), rgba(15,110,86,0.05) 55%, transparent 75%)",
          filter: "blur(40px)",
          willChange: "transform",
        }}
      />
      <div
        aria-hidden
        className="hero-glow-2 pointer-events-none absolute left-[15%] top-[50%] -z-10 h-[60vh] w-[60vw] rounded-full opacity-60"
        style={{
          background: "radial-gradient(closest-side, rgba(29,158,117,0.1), transparent 70%)",
          filter: "blur(60px)",
          willChange: "transform, opacity",
        }}
      />
      <ParticleField density={28} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 md:px-8"
      >
        {/* Eyebrow */}
        <motion.div
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-[#5CC4A0]"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1D9E75] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1D9E75]" />
          </span>
          AI-Powered Client Ops Platform
        </motion.div>

        {/* Headline: gradient-clipped per Voxr spec */}
        <h1 className="mt-8 font-display text-6xl font-bold leading-[1.02] tracking-tight md:text-7xl lg:text-8xl">
          <span className="block bg-gradient-to-b from-black to-black/40 bg-clip-text text-transparent">
            <BlurReveal text="Stop Losing Revenue." delay={0.3} stagger={0.03} />
          </span>
          <span className="block bg-gradient-to-b from-black to-black/40 bg-clip-text text-transparent">
            <BlurReveal text="Start Enforcing " delay={0.6} stagger={0.03} />
            <span className="bg-gradient-to-b from-[#1D9E75] to-[#0F6E56] bg-clip-text text-transparent">
              <BlurReveal text="Scope" delay={1} stagger={0.05} />
            </span>
            .
          </span>
        </h1>

        {/* Subtext */}
        <motion.p
          variants={item}
          className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400"
        >
          The average creative agency loses 15–25% of annual revenue to scope creep. ScopeIQ flags out-of-scope requests in under 5 seconds, generates change orders from your rate card, and holds vague briefs before work begins.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="mt-9 flex flex-wrap justify-center gap-3">
          <GlowButton href="/register" variant="primary">
            See how it works
            <ArrowRight className="h-4 w-4" />
          </GlowButton>
          <GlowButton href="#product-showcase" variant="ghost">
            <PlayCircle className="h-4 w-4" />
            Watch 2-min Demo
          </GlowButton>
        </motion.div>

        {/* Stat pills */}
        <motion.ul
          variants={item}
          className="mt-12 flex flex-wrap justify-center gap-2.5"
          aria-label="Key stats"
        >
          {STATS.map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-xs text-white/70"
            >
              {s}
            </motion.li>
          ))}
        </motion.ul>

        {/* Floating product mockup */}
        <motion.div
          variants={item}
          className="hero-mockup relative mt-16 w-full max-w-md"
        >
          <div
            className="absolute -inset-8 -z-10 rounded-[30px] blur-3xl"
            style={{
              background: "radial-gradient(circle at 60% 40%, rgba(29,158,117,0.35), transparent 70%)",
            }}
            aria-hidden
          />
          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/90 p-3 text-left shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center gap-1.5 px-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
              <span className="ml-auto font-mono text-[10px] text-white/40">scopeiq.app/flag/a4f2</span>
            </div>
            <ScopeFlagPulse />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
