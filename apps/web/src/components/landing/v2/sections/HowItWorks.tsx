"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "@/lib/gsap-setup";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { UploadCloud, Layout, Share2, ShieldAlert, FileSignature, type LucideIcon } from "lucide-react";
import { prefersReducedMotion } from "@/lib/landing/animations";

type Step = {
  num: string;
  icon: LucideIcon;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    num: "01",
    icon: UploadCloud,
    title: "Upload Your SOW",
    body:
      "Drag in your PDF Statement of Work. AI extracts deliverables, revision limits, exclusions, and timeline in under 30 seconds.",
  },
  {
    num: "02",
    icon: Layout,
    title: "Build Your Brief Form",
    body:
      "Drag-and-drop a custom intake form. Set your AI clarity threshold. Publish as a link or embed on your website in one click.",
  },
  {
    num: "03",
    icon: Share2,
    title: "Share the Client Portal",
    body:
      "Clients get a branded portal at your domain. No account needed. Briefs scored instantly, deliverables reviewed with annotations.",
  },
  {
    num: "04",
    icon: ShieldAlert,
    title: "ScopeIQ Monitors Every Message",
    body:
      "Every client message is checked against your active SOW. Out-of-scope requests are flagged in under 5 seconds with the exact clause reference.",
  },
  {
    num: "05",
    icon: FileSignature,
    title: "Generate Change Orders with One Click",
    body:
      "Confirm the flag, and ScopeIQ generates a professional change order pre-priced from your rate card. Client accepts digitally. SOW updates automatically.",
  },
];

export function HowItWorks() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current || prefersReducedMotion()) return;
    const root = rootRef.current;

    const ctx = gsap.context(() => {
      // Scrub connector
      gsap.to(".how-connector-fill", {
        scaleX: 1,
        transformOrigin: "left center",
        ease: "none",
        scrollTrigger: {
          trigger: ".how-grid",
          start: "top 70%",
          end: "bottom 50%",
          scrub: 1,
        },
      });

      // Steps reveal
      const steps = gsap.utils.toArray(".how-step") as HTMLElement[];
      steps.forEach((step) => {
        gsap.from(step, {
          opacity: 0,
          y: 34,
          duration: 0.6,
          ease: "expo.out",
          scrollTrigger: { trigger: step, start: "top 80%" },
        });
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
    <section ref={rootRef} id="how-it-works" className="lv2-surface-subtle py-28 md:py-36 bg-[#F9F9F9]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center text-black">
          <span className="lv2-label text-[#0F6E56]">How It Works</span>
          <h2 className="lv2-h2 mt-4 text-black">
            From Vague Brief to Protected Revenue
            <br />
            in Five Steps.
          </h2>
        </div>

        {/* Desktop: horizontal with scrub connector */}
        <div className="how-grid relative mt-20 hidden lg:block">
          <div className="absolute left-0 right-0 top-7 -z-0 h-[2px] bg-black/5" aria-hidden />
          <div
            className="how-connector-fill absolute left-0 right-0 top-7 -z-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-transparent via-[#1D9E75] to-transparent"
            aria-hidden
          />
          <div className="grid grid-cols-5 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="how-step relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F6E56] text-white shadow-[0_8px_24px_-8px_rgba(15,110,86,0.5)] ring-4 ring-[#F9F9F9]">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-xs font-bold uppercase tracking-widest text-[#0F6E56]">
                  STEP {step.num}
                </div>
                <h3 className="lv2-h3 mt-2 text-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-black/80">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/tablet: vertical */}
        <div className="mt-12 flex flex-col gap-10 lg:hidden">
          {STEPS.map((step) => (
            <div key={step.num} className="how-step relative pl-14">
              <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-[#0F6E56] text-white">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="absolute left-5 top-11 bottom-[-2.5rem] w-[2px] bg-black/10" aria-hidden />
              <div className="font-display text-xs font-bold uppercase tracking-widest text-[#0F6E56]">
                STEP {step.num}
              </div>
              <h3 className="lv2-h3 mt-1 text-black">{step.title}</h3>
              <p className="mt-2 text-sm text-black/80">{step.body}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
