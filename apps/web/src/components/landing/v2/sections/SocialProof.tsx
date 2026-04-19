"use client";

import { Star } from "lucide-react";

const LOGOS = ["Figma", "Notion", "Asana", "Slack", "HubSpot", "Linear", "Airtable", "Loom"];

export function SocialProof() {
  return (
    <section className="relative overflow-hidden border-y border-black/5 bg-white py-14">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-black/50">
        Trusted by creative agencies and freelancers worldwide
      </p>

      {/* Infinite marquee with grayscale/contrast per Voxr spec + edge fade */}
      <div
        className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        aria-hidden
      >
        <div className="lv2-marquee flex w-max items-center gap-16 whitespace-nowrap">
          {[...LOGOS, ...LOGOS].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="font-display text-2xl font-bold text-black/40 opacity-50 contrast-125 grayscale transition hover:text-[#0F6E56] hover:opacity-100 hover:grayscale-0"
              style={{ filter: "grayscale(1) contrast(1.25)" }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl items-center justify-center gap-3 px-5 text-center text-sm text-black/60">
        <div className="flex shrink-0 items-center gap-0.5" aria-label="5-star rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
          ))}
        </div>
        <p>
          <span className="italic text-black/80">
            &ldquo;Scope creep was killing our margins. ScopeIQ paid for itself in the first week.&rdquo;
          </span>
          <span className="ml-2 text-black/40">— James L., Creative Director</span>
        </p>
      </div>
    </section>

  );
}
