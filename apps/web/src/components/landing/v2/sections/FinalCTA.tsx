"use client";

import { ArrowRight, FileText, ShieldCheck, CheckCircle, AlertTriangle, Zap, FileSignature } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";

const ORBIT_ICONS = [FileText, ShieldCheck, CheckCircle, AlertTriangle, Zap, FileSignature];

export function FinalCTA() {
  return (
    <section className="lv2-surface-dark relative overflow-hidden py-28 md:py-36 bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(15,110,86,0.15), transparent 65%)",
        }}
      />

      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <div className="relative grid grid-cols-1 items-center gap-14 md:grid-cols-[1.2fr,1fr]">
          <div className="text-black">
            <h2 className="lv2-h1 text-black">Stop Losing Business to Scope Creep.</h2>
            <p className="lv2-body-lg mt-5 text-gray-600">
              Every project you start without ScopeIQ is a project where the brief might be vague, the approval
              chain is email threads, and the next out-of-scope request becomes your problem to absorb.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <GlowButton href="/register" variant="primary">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
              <GlowButton href="/contact" variant="ghost">
                Book a Demo
              </GlowButton>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/70">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[#0F6E56]" /> Free 14-day trial
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[#0F6E56]" /> No credit card required
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-[#0F6E56]" /> Setup in under 30 min
              </li>
            </ul>
          </div>

          {/* Orbiting icons */}
          <div className="relative mx-auto h-[320px] w-[320px]">
            <div
              className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] shadow-[0_0_80px_rgba(29,158,117,0.3)]"
              aria-hidden
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-lg font-bold text-white">SIQ</span>
              </div>
            </div>

            {/* Inner ring */}
            <div
              className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/5"
              style={{ animation: "lv2-orbit 18s linear infinite" }}
              aria-hidden
            >
              {ORBIT_ICONS.slice(0, 3).map((Icon, i) => {
                const angle = (i / 3) * 360;
                return (
                  <span
                    key={i}
                    className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
                    style={{ transform: `rotate(${angle}deg) translateY(-112px) rotate(-${angle}deg)` }}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#F9F9F9] text-[#0F6E56]">
                      <Icon className="h-4 w-4" />
                    </span>
                  </span>
                );
              })}
            </div>

            {/* Outer ring */}
            <div
              className="absolute left-1/2 top-1/2 h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/5"
              style={{ animation: "lv2-orbit 26s linear infinite reverse" }}
              aria-hidden
            >
              {ORBIT_ICONS.slice(3).map((Icon, i) => {
                const angle = (i / 3) * 360 + 60;
                return (
                  <span
                    key={i}
                    className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
                    style={{ transform: `rotate(${angle}deg) translateY(-155px) rotate(-${angle}deg)` }}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[#F9F9F9] text-black/40">
                      <Icon className="h-4 w-4" />
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
