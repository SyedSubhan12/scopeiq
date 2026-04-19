"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";

type Plan = {
  name: string;
  target: string;
  monthly: number;
  annual: number;
  badge?: string;
  featured?: boolean;
  features: { label: string; included: boolean | string }[];
  cta: string;
  href: string;
};

const PLANS: Plan[] = [
  {
    name: "Solo",
    target: "Solo freelancer",
    monthly: 49,
    annual: 39,
    features: [
      { label: "1 client portal", included: true },
      { label: "5 active projects", included: true },
      { label: "ScopeIQ subdomain", included: true },
      { label: "Scope Guard", included: true },
      { label: "Change orders", included: true },
      { label: "Audit log (30 days)", included: "30d" },
      { label: "API access", included: false },
      { label: "Slack integration", included: false },
    ],
    cta: "Start Free",
    href: "/register?plan=solo",
  },
  {
    name: "Studio",
    target: "2–5 person studio",
    monthly: 99,
    annual: 79,
    badge: "MOST POPULAR",
    featured: true,
    features: [
      { label: "3 client portals", included: true },
      { label: "Unlimited projects", included: true },
      { label: "Custom domain", included: true },
      { label: "Scope Guard", included: true },
      { label: "Change orders", included: true },
      { label: "Audit log (1 year)", included: "1y" },
      { label: "API access", included: false },
      { label: "Slack integration", included: false },
    ],
    cta: "Start Free",
    href: "/register?plan=studio",
  },
  {
    name: "Agency",
    target: "5–20 person agency",
    monthly: 199,
    annual: 159,
    features: [
      { label: "Unlimited portals", included: true },
      { label: "Unlimited projects", included: true },
      { label: "Custom domain", included: true },
      { label: "Scope Guard", included: true },
      { label: "Change orders", included: true },
      { label: "Audit log (forever)", included: "∞" },
      { label: "API access", included: true },
      { label: "Slack integration", included: true },
    ],
    cta: "Contact Sales",
    href: "/contact",
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="lv2-surface-subtle py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lv2-label">Simple Pricing</span>
          <h2 className="lv2-h2 mt-4">Start Free. Scale as You Grow.</h2>

          <div className="mx-auto mt-8 inline-flex items-center rounded-full border border-black/10 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                !annual ? "text-white" : "text-[#4B5563]"
              }`}
            >
              {!annual && (
                <motion.span
                  layoutId="pricing-toggle"
                  className="absolute inset-0 -z-10 rounded-full bg-[#0F6E56]"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                annual ? "text-white" : "text-[#4B5563]"
              }`}
            >
              {annual && (
                <motion.span
                  layoutId="pricing-toggle"
                  className="absolute inset-0 -z-10 rounded-full bg-[#0F6E56]"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              Annual <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">-20%</span>
            </button>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: plan.featured ? 0 : 0.08 }}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 ${
                  plan.featured
                    ? "border-[#1D9E75] shadow-[0_30px_80px_-30px_rgba(29,158,117,0.5)] lg:-translate-y-2"
                    : "border-black/5 shadow-sm"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0F6E56] to-[#1D9E75] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-[#4B5563]">{plan.target}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <motion.span
                    key={`${plan.name}-${annual}`}
                    initial={{ y: -18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="font-display text-5xl font-extrabold text-[#0D1B2A]"
                  >
                    ${price}
                  </motion.span>
                  <span className="text-sm text-[#4B5563]">/ mo</span>
                </div>
                {annual && (
                  <p className="mt-1 text-xs text-[#4B5563]">
                    Billed annually · save ${((plan.monthly - plan.annual) * 12).toFixed(0)}
                  </p>
                )}

                <ul className="mt-6 space-y-2.5 text-sm">
                  {plan.features.map((feat) => (
                    <li
                      key={feat.label}
                      className={`flex items-center gap-2.5 ${
                        feat.included ? "text-[#0D1B2A]" : "text-[#9CA3AF] line-through"
                      }`}
                    >
                      {feat.included ? (
                        <Check className="h-4 w-4 shrink-0 text-[#1D9E75]" />
                      ) : (
                        <X className="h-4 w-4 shrink-0" />
                      )}
                      {feat.label}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <GlowButton
                    href={plan.href}
                    variant={plan.featured ? "primary" : "ghost"}
                    className="w-full"
                  >
                    {plan.cta}
                  </GlowButton>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
