"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Plug, Zap, XCircle } from "lucide-react";
import { Card, Button, cn } from "@novabots/ui";

export type IntegrationProvider =
  | "slack"
  | "notion"
  | "linear"
  | "xero"
  | "figma"
  | "stripe";

export interface IntegrationMeta {
  provider: IntegrationProvider;
  name: string;
  description: string;
  phase: 1 | 2;
  accent: string;
}

interface IntegrationCardProps {
  meta: IntegrationMeta;
  connected: boolean;
  busy?: boolean | undefined;
  index?: number | undefined;
  onConnect?: (() => void | Promise<void>) | undefined;
  onDisconnect?: (() => void | Promise<void>) | undefined;
  onTest?: (() => void | Promise<void>) | undefined;
}

export function IntegrationCard({
  meta,
  connected,
  busy = false,
  index = 0,
  onConnect,
  onDisconnect,
  onTest,
}: IntegrationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pulseCheck, setPulseCheck] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    import("gsap/dist/gsap").then(({ default: gsap }) => {
      gsap.from(el, {
        opacity: 0,
        y: 12,
        duration: 0.35,
        delay: index * 0.05,
        ease: "back.out(1.4)",
      });
    });
  }, [index]);

  useEffect(() => {
    if (!connected || !pulseCheck) return;
    const timer = setTimeout(() => setPulseCheck(false), 900);
    return () => clearTimeout(timer);
  }, [connected, pulseCheck]);

  const comingSoon = meta.phase === 2;

  return (
    <motion.div
      ref={cardRef}
      {...(comingSoon ? {} : { whileHover: { y: -2 } })}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={cn(
          "flex h-full flex-col gap-4 p-5 transition-colors",
          connected && "border-[#1D9E75]/40 shadow-[0_0_0_1px_rgba(29,158,117,0.15)]",
          comingSoon && "opacity-60",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${meta.accent}14`, color: meta.accent }}
            >
              <Plug className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                {meta.name}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">
                {meta.description}
              </p>
            </div>
          </div>
          {connected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1D9E75]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#1D9E75]">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </span>
          ) : comingSoon ? (
            <span className="rounded-full border border-[rgb(var(--border-subtle))] px-2 py-0.5 text-[10px] font-semibold uppercase text-[rgb(var(--text-muted))]">
              Coming soon
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {comingSoon ? (
            <Button size="sm" variant="ghost" disabled className="text-xs">
              Phase 2
            </Button>
          ) : connected ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void onTest?.()}
                className="text-xs"
              >
                <Zap className="mr-1 h-3 w-3" />
                Test
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => void onDisconnect?.()}
                className="text-xs"
              >
                <XCircle className="mr-1 h-3 w-3" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => {
                setPulseCheck(true);
                void onConnect?.();
              }}
              className="bg-[#1D9E75] text-xs hover:bg-[#178862]"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Connecting…
                </>
              ) : (
                "Connect"
              )}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
