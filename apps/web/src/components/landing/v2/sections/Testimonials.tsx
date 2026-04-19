"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote } from "lucide-react";

type Item = {
  quote: string;
  name: string;
  role: string;
  tags: string[];
};

const QUOTES: Item[] = [
  {
    quote:
      "I've been freelancing for 8 years and scope creep was just... the cost of doing business. ScopeIQ turned our second meeting conversation into a change order conversation. First month live: $4,200 in additional billed work I would have just eaten.",
    name: "Marcus T.",
    role: "Brand Designer, London",
    tags: ["Brief Builder", "Scope Guard"],
  },
  {
    quote:
      "The revision round counter alone changed how clients behave. They can see they have one round left. Suddenly their feedback is consolidated and specific. The annotation tool means no more 'you know, the blue thing on the left' feedback over Slack.",
    name: "Sarah L.",
    role: "Creative Director, 5-person Studio",
    tags: ["Approval Portal", "Revision Tracking"],
  },
  {
    quote:
      "We process 30–40 active projects at any time. Before ScopeIQ, scope decisions lived in everyone's head. Now there's an audit trail for every decision. Our account managers spend their time on work, not on documenting what was agreed.",
    name: "Priya N.",
    role: "Operations Manager, 18-person Agency",
    tags: ["Scope Guard", "Audit Log"],
  },
];

export function Testimonials() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % QUOTES.length), 6200);
    return () => clearInterval(t);
  }, []);

  const q = QUOTES[i] ?? QUOTES[0]!;

  return (
    <section id="testimonials" className="lv2-surface-dark relative overflow-hidden py-28 md:py-36 bg-white">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <div className="text-center text-black">
          <span className="lv2-label text-[#0F6E56]">What Agencies Are Saying</span>
          <h2 className="lv2-h2 mt-4 text-black">
            They Used to Absorb the Losses.
            <br />
            <span className="text-[#0F6E56]">Now They Invoice Them.</span>
          </h2>
        </div>

        <div className="relative mt-14 min-h-[320px]">
          <Quote
            className="pointer-events-none absolute -left-2 -top-6 h-20 w-20 text-[#1D9E75]/10"
            aria-hidden
          />
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl border border-black/5 bg-[#F9F9F9] p-8 md:p-10"
            >
              <p className="font-display text-xl font-medium leading-relaxed text-black/90 md:text-2xl">
                &ldquo;{q.quote}&rdquo;
              </p>
              <footer className="mt-6 flex flex-wrap items-center gap-4 text-sm text-black/60">
                <span className="font-semibold text-black">{q.name}</span>
                <span>{q.role}</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  {q.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[#1D9E75]/30 bg-[#1D9E75]/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-[#0F6E56]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </section>

  );
}
