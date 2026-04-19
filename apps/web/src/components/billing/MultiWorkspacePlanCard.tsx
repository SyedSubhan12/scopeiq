"use client";

/**
 * Sprint 5 — Multi-workspace plan card (FEAT-NEW-011).
 *
 * Advertises the upcoming Agency-tier multi-workspace add-on. Lives on the
 * billing page below the regular plan grid. Framer Motion handles a subtle
 * hover lift; clicking the CTA registers interest via the existing toast
 * (real provisioning is gated until billing goes live).
 */

import { motion } from "framer-motion";
import { Building2, ChevronRight, Layers } from "lucide-react";
import { Button, Card, useToast, cn } from "@novabots/ui";

interface MultiWorkspacePlanCardProps {
  className?: string;
}

const PERKS = [
  "Switch between workspaces in one click",
  "Centralised member management",
  "Per-workspace billing & branding",
  "Cross-workspace template sharing",
] as const;

export function MultiWorkspacePlanCard({ className }: MultiWorkspacePlanCardProps) {
  const { toast } = useToast();

  const handleInterest = () => {
    toast(
      "info",
      "We'll let you know as soon as multi-workspace billing opens up.",
    );
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      <Card
        className={cn(
          "relative overflow-hidden border-[#1D9E75]/30 bg-gradient-to-br from-[#1D9E75]/5 via-white to-[#0D1B2A]/5 p-5",
        )}
      >
        <span className="absolute right-4 top-4 rounded-full bg-[#1D9E75]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1D9E75]">
          New · Agency add-on
        </span>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D9E75]/10">
            <Layers className="h-5 w-5 text-[#1D9E75]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
              Run multiple workspaces under one account
            </h3>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              Perfect for agencies juggling several brands or studios billing
              clients separately.
            </p>
          </div>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PERKS.map((perk) => (
            <li
              key={perk}
              className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#1D9E75]" />
              {perk}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-[rgb(var(--text-muted))]">
            <span className="text-base font-semibold text-[rgb(var(--text-primary))]">
              +$29
            </span>{" "}
            / extra workspace · billed monthly
          </p>
          <Button size="sm" onClick={handleInterest}>
            Notify me
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
