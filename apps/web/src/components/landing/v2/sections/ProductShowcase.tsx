"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "@/lib/gsap-setup";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { CheckCircle2, FileCheck2, AlertTriangle } from "lucide-react";
import { prefersReducedMotion } from "@/lib/landing/animations";

export function ProductShowcase() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current || prefersReducedMotion()) return;
    const root = rootRef.current;

    const ctx = gsap.context(() => {
      // Subtle slide-in reveal per panel
      const panels = gsap.utils.toArray(".panel-content") as HTMLElement[];
      panels.forEach((panel) => {
        gsap.from(panel.querySelectorAll(".panel-reveal"), {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: panel, start: "top 75%" },
        });
      });

      // Brief score ring progress
      gsap.to(".brief-score-ring", {
        strokeDashoffset: "calc(100 - 43)",
        duration: 1.6,
        ease: "expo.out",
        scrollTrigger: { trigger: ".panel-brief", start: "top 60%" },
      });

      // Confidence bar
      gsap.to(".conf-bar", {
        width: "82%",
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: ".panel-scope", start: "top 60%" },
      });
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t: ScrollTrigger) => {
        if (t.trigger && root.contains(t.trigger as Node)) t.kill();
      });
    };
  }, []);

  return (
    <section ref={rootRef} id="product-showcase" className="relative">
      {/* Panel 1 — Brief Builder in Action */}
      <div className="panel-brief relative overflow-hidden py-28 md:py-36 bg-white border-b border-black/5">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 md:px-8 lg:grid-cols-2">
          <div className="panel-content text-black">
            <span className="panel-reveal lv2-label text-[#0F6E56]">Module 01 — Brief Builder</span>
            <h2 className="panel-reveal lv2-h2 mt-4 text-black">
              A Brief Scoring 43 — Auto-Held.
              <br />
              <span className="text-[#0F6E56]">Client Prompted in 60 Seconds.</span>
            </h2>
            <p className="panel-reveal lv2-body-lg mt-5 text-black/80">
              Watch ScopeIQ score an incoming brief as too vague (43/100), automatically hold it, and send the
              client a numbered list of clarification questions — without you lifting a finger.
            </p>
          </div>



          <div className="panel-content panel-reveal">
            <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-6 shadow-xl">
              <div className="flex items-center justify-between text-[11px] text-black/50">
                <span>Incoming brief · Sarah at Acme</span>
                <span className="rounded bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700">BRIEF HELD</span>
              </div>

              <div className="mt-5 flex items-center gap-5">
                <div className="relative h-24 w-24">
                  <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="3" />
                    <circle
                      className="brief-score-ring"
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#DC2626"
                      strokeWidth="3"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-2xl font-bold text-black">43</span>
                    <span className="text-[10px] uppercase tracking-wider text-black/50">/100</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-black/50">Clarity Score</p>
                  <p className="mt-1 text-sm font-semibold text-red-600">Below threshold · auto-held</p>
                </div>
              </div>

              <ul className="mt-6 space-y-2">
                {[
                  { sev: "HIGH", label: "Project goal too vague", color: "red" },
                  { sev: "MED", label: "No timeline specified", color: "amber" },
                  { sev: "MED", label: "Budget range missing", color: "amber" },
                ].map((f) => (
                  <li
                    key={f.label}
                    className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-3 py-2 text-sm text-black/80"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${f.color === "red" ? "text-red-500" : "text-amber-500"}`} />
                      {f.label}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${f.color === "red" ? "bg-red-500/10 text-red-700" : "bg-amber-500/10 text-amber-700"}`}>
                      {f.sev}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Clarification email sent · 3 questions queued
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Panel 2 — Scope Flag in Action */}
      <div className="panel-scope relative overflow-hidden py-28 md:py-36 bg-[#F9F9F9] border-b border-black/5">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 md:px-8 lg:grid-cols-2">
          <div className="panel-content order-2 lg:order-1">
            <div className="panel-reveal rounded-2xl border border-red-500/20 bg-white p-6 shadow-xl" style={{ borderLeft: "4px solid #DC2626" }}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-red-600">Scope Flag · High Confidence</span>
                <span className="font-mono text-red-500">3.1s</span>
              </div>
              <p className="mt-3 rounded bg-black/5 p-3 text-sm text-black">
                Client: &ldquo;Can we also get social media templates?&rdquo;
              </p>
              <div className="mt-3 rounded bg-black p-3 font-mono text-[11px] text-emerald-400">
                SOW § 2.2 — Social media templates not included in this SOW.
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-black/50">
                  <span>Confidence</span>
                  <span>82%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/5">
                  <div className="conf-bar h-full w-0 bg-gradient-to-r from-amber-500 to-red-500" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow">
                  Generate Change Order
                </button>
                <button className="rounded-md border border-black/10 px-3 py-2 text-xs text-black">
                  Mark In-Scope
                </button>
              </div>
            </div>
          </div>

          <div className="panel-content order-1 lg:order-2">
            <span className="panel-reveal lv2-label text-[#0F6E56]">Module 03 — Scope Guard</span>
            <h2 className="panel-reveal lv2-h2 mt-4 text-black">
              Real-Time Detection.
              <br />
              <span className="text-[#0F6E56]">Zero Unbilled Work.</span>
            </h2>
            <p className="panel-reveal lv2-body-lg mt-5 text-black/80">
              ScopeIQ cross-checks every client message against your signed SOW. This flag took 3.1 seconds. The
              change order took 4.8 seconds. The client signed within the hour.
            </p>
          </div>
        </div>
      </div>


      {/* Panel 3 — Change Order */}
      <div className="panel-change relative overflow-hidden py-28 md:py-36 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 md:px-8 lg:grid-cols-2">
          <div className="panel-content text-black">
            <span className="panel-reveal lv2-label text-[#0F6E56]">Module 03 — Scope Guard</span>
            <h2 className="panel-reveal lv2-h2 mt-4 text-black">
              From &ldquo;That&apos;s Out of Scope&rdquo;
              <br />
              <span className="text-[#0F6E56]">to a Signed Change Order.</span>
            </h2>
            <p className="panel-reveal lv2-body-lg mt-5 text-black/80">
              One click to confirm. ScopeIQ generates the change order prose, pulls pricing from your rate card,
              and sends it via the portal with a digital signature field. Accepted orders update your SOW
              automatically.
            </p>
          </div>

          <div className="panel-content panel-reveal">
            <div className="rounded-2xl border border-black/5 bg-[#F9F9F9] p-7 text-black shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/5 pb-4">
                <span className="font-display text-sm font-bold">CHANGE ORDER #CO-2026-017</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">ACCEPTED</span>
              </div>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Social Media Templates × 10</span>
                  <span className="font-mono">$2,400.00</span>
                </div>
                <div className="flex items-center justify-between text-xs text-black/60">
                  <span>Hours @ $120/hr</span>
                  <span className="font-mono">20h</span>
                </div>
              </div>
              <div className="mt-5 border-t border-black/5 pt-4">
                <p className="text-[11px] uppercase tracking-wider text-black/50">Signature</p>
                <p
                  className="mt-2 text-2xl"
                  style={{ fontFamily: "cursive, var(--font-body)", color: "#0F6E56" }}
                >
                  Sarah Mitchell
                </p>
                <p className="mt-1 text-[11px] text-black/50">Signed 2026-04-15 14:32 UTC</p>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-700">
                <FileCheck2 className="h-4 w-4" /> SOW updated · rate card synced
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
