"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

const ITEMS = [
  {
    q: "How quickly can I set up ScopeIQ?",
    a: "Most users are running live with all three modules in under 30 minutes. Connect your workspace, build a brief form from a template, upload your SOW, and publish your client portal. No engineering work required.",
  },
  {
    q: "Do I need to upload a formal SOW document?",
    a: "No. If you work from informal agreements, you can paste your scope as plain text and Scope Guard will parse it. We also have a built-in SOW editor if you want to create one from scratch using ScopeIQ.",
  },
  {
    q: "What happens when a scope flag fires?",
    a: "You get an in-app notification and (if you haven't seen it in 2 hours) an email. The flag shows you the client message, the exact SOW clause it violates, a confidence score, and an AI-suggested response. You choose: generate a change order, mark it as in-scope, or snooze it.",
  },
  {
    q: "Can clients see the scope flags?",
    a: "No. Scope flags are agency-only. Clients see their branded portal, their deliverables, and any change orders you choose to send them.",
  },
  {
    q: "Does ScopeIQ replace my project management tool?",
    a: "No — and intentionally so. ScopeIQ is the brief-to-delivery revenue protection layer. It integrates with Notion, Linear, Asana, and Slack so your team's existing workflow is uninterrupted.",
  },
  {
    q: "How does the AI scoring work? Can I calibrate it?",
    a: "Yes. You set the clarity threshold (default: 70/100). Briefs below it are auto-held. You also control which fields are required, what a 'vague' answer looks like, and how aggressive the hold is. The AI uses your own SOW and brief history to improve over time.",
  },
  {
    q: "What does 'silence as approval' mean?",
    a: "If a client doesn't respond after your configured reminder sequence (typically 3 steps over several days), ScopeIQ treats their silence as approval and logs it in your audit trail with a timestamp. You configure whether this applies.",
  },
  {
    q: "Is my client data secure?",
    a: "Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Workspaces are fully isolated — no cross-account data access is architecturally possible. We target SOC 2 Type I compliance by Month 18 post-launch.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="lv2-surface-subtle py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <div className="text-center">
          <span className="lv2-label">Questions, Answered</span>
          <h2 className="lv2-h2 mt-4">Frequently Asked Questions</h2>
        </div>

        <div className="mt-12 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white shadow-sm">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display font-semibold text-[#0D1B2A]">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isOpen ? "bg-[#1D9E75] text-white" : "bg-black/5 text-[#4B5563]"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-sm leading-relaxed text-[#4B5563]">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
