"use client";

import { useLayoutEffect, useRef } from "react";
import { TrendingDown, DollarSign, Zap, RefreshCw, type LucideIcon } from "lucide-react";
import gsap from "@/lib/gsap-setup";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/landing/animations";

type Stat = {
  icon: LucideIcon;
  value: number;
  rangeEnd?: number;
  suffix?: string;
  prefix?: string;
  label: string;
};

const STATS: Stat[] = [
  { icon: TrendingDown, value: 79, suffix: "%", label: "of creative agencies report over-servicing clients" },
  { icon: DollarSign, value: 25, suffix: "%", label: "of annual revenue lost to scope creep, vague briefs, and approval delays" },
  { icon: Zap, value: 5, suffix: "s", label: "for ScopeIQ to flag an out-of-scope client request" },
  { icon: RefreshCw, value: 3, rangeEnd: 6, label: "revision rounds per project when briefs are poorly defined" },
];

export function ProblemStats() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Scrub connector
      gsap.to(".stat-connector-fill", {
        scaleX: 1,
        transformOrigin: "left center",
        ease: "none",
        scrollTrigger: {
          trigger: ".stat-grid",
          start: "top 70%",
          end: "bottom 50%",
          scrub: 1,
        },
      });

      const animateCount = (el: HTMLElement) => {
        const target = Number(el.dataset.target ?? "0");
        const state = { val: 0 };
        let last = -1;
        gsap.to(state, {
          val: target,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            const rounded = Math.round(state.val);
            if (rounded !== last) {
              el.textContent = String(rounded);
              last = rounded;
            }
          },
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      };

      root.querySelectorAll<HTMLElement>(".stat-number").forEach(animateCount);
      root.querySelectorAll<HTMLElement>(".stat-range-end").forEach(animateCount);
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t: ScrollTrigger) => {
        if (t.trigger && root.contains(t.trigger as Node)) t.kill();
      });
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="problem"
      className="stat-section relative overflow-hidden border-y border-black/5 bg-white py-24 md:py-28"
    >
      {/* Scrub connector */}
      <div
        className="absolute left-[15%] right-[15%] top-1/2 -z-0 h-[2px] bg-black/5"
        aria-hidden
      />
      <div
        className="stat-connector-fill absolute left-[15%] right-[15%] top-1/2 -z-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-transparent via-[#1D9E75] to-transparent"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full border border-black/10 bg-[#F9F9F9] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-[#0F6E56]">
            The Problem
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight text-black md:text-5xl">
            <span className="bg-gradient-to-b from-black to-black/50 bg-clip-text text-transparent">
              Agency Margins Are Being
              <br />
              Suffocated by &ldquo;Quick Asks.&rdquo;
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-black/80">
            Every unbilled revision, every &ldquo;small favor,&rdquo; and every vague brief is a leak in
            your revenue bucket. Most agencies absorb these costs because the alternative — awkward
            negotiations — feels worse.
          </p>
        </div>

        <div className="stat-grid relative mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl border border-black/5 bg-[#F9F9F9] p-7 transition-colors hover:border-[rgba(29,158,117,0.3)]"
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-[#0F6E56] to-[#1D9E75] transition-transform duration-500 group-hover:scale-x-100"
                />
                <Icon className="h-6 w-6 text-[#0F6E56]" />
                <div
                  className="mt-5 flex items-baseline gap-1 font-display text-5xl font-extrabold text-[#0F6E56]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {stat.prefix ? <span>{stat.prefix}</span> : null}
                  <span className="stat-number" data-target={stat.value}>
                    0
                  </span>
                  {stat.rangeEnd !== undefined ? (
                    <>
                      <span className="text-4xl text-[#0F6E56]/70">–</span>
                      <span className="stat-range-end" data-target={stat.rangeEnd}>
                        0
                      </span>
                    </>
                  ) : null}
                  {stat.suffix ? <span className="text-4xl">{stat.suffix}</span> : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-black/80">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-black/50">
          These numbers aren&apos;t industry trivia — they&apos;re money leaving your business on every
          project. ScopeIQ was built to stop all three.
        </p>

      </div>
    </section>
  );
}
