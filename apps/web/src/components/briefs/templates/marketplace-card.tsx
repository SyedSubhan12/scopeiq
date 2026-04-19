"use client";

/**
 * Sprint 5 — Template Marketplace card (FEAT-NEW-008).
 *
 * One-shot card used in the marketplace browser. GSAP entrance with the same
 * `back.out(1.4)` cadence we use across the rest of the app, plus a Framer
 * Motion hover lift.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Sparkles, Users } from "lucide-react";
import { Button, Card, CardContent, cn } from "@novabots/ui";

export interface MarketplaceTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  installs: number;
  curated?: boolean;
  accent?: string;
}

interface MarketplaceCardProps {
  template: MarketplaceTemplate;
  index: number;
  installed: boolean;
  installing: boolean;
  onInstall: (id: string) => void;
}

export function MarketplaceCard({
  template,
  index,
  installed,
  installing,
  onInstall,
}: MarketplaceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let cancelled = false;
    void import("gsap/dist/gsap").then((mod) => {
      if (cancelled) return;
      const gsap = (mod as { default: { from: (t: unknown, v: unknown) => void } }).default;
      gsap.from(el, {
        opacity: 0,
        y: 12,
        scale: 0.98,
        duration: 0.35,
        delay: index * 0.05,
        ease: "back.out(1.4)",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [index]);

  const accent = template.accent ?? "#1D9E75";

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <CardContent className="flex h-full flex-col p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-muted))]">
                {template.category}
              </p>
              <h3 className="mt-1 truncate text-base font-semibold text-[rgb(var(--text-primary))]">
                {template.title}
              </h3>
            </div>
            {template.curated && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Sparkles className="h-3 w-3" />
                Curated
              </span>
            )}
          </div>

          <p className="mb-4 line-clamp-3 flex-1 text-sm text-[rgb(var(--text-secondary))]">
            {template.description}
          </p>

          <div className="flex items-center justify-between border-t border-[rgb(var(--border-subtle))] pt-3">
            <span className="inline-flex items-center gap-1 text-xs text-[rgb(var(--text-muted))]">
              <Users className="h-3 w-3" />
              {template.installs.toLocaleString()} installs
            </span>
            <Button
              size="sm"
              variant={installed ? "secondary" : "primary"}
              disabled={installed || installing}
              onClick={() => onInstall(template.id)}
              className={cn(installed && "cursor-default")}
            >
              {installed ? (
                "Installed"
              ) : installing ? (
                "Installing..."
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Install
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
