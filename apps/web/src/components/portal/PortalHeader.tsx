"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface PhaseStep {
  label: string;
  complete: boolean;
}

interface PortalHeaderProps {
  workspaceName: string;
  logoUrl: string | null;
  brandColor?: string;
  projectName: string;
  clientName: string | null;
  /** Optional phase progress for the stepper dots */
  phases?: PhaseStep[];
  /** When true, hides the "Powered by ScopeIQ" badge rendered by parent */
  hidePoweredBy?: boolean;
}

export function PortalHeader({
  workspaceName,
  logoUrl,
  brandColor,
  projectName,
  clientName,
  phases,
  hidePoweredBy = false,
}: PortalHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);

  // Inject the brand color as a scoped CSS variable on the header element
  // so it doesn't pollute :root outside of the portal subtree.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    if (brandColor) {
      el.style.setProperty("--portal-brand", brandColor);
    } else {
      el.style.removeProperty("--portal-brand");
    }
  }, [brandColor]);

  return (
    <header
      ref={headerRef}
      data-portal-header
      className="w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--portal-brand, #1D9E75) 0%, color-mix(in srgb, var(--portal-brand, #1D9E75) 70%, #000) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.0, 0, 0.2, 1] }}
        className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-8 pt-10 text-center"
      >
        {/* Agency logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-5"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={workspaceName}
              className="h-[120px] w-[120px] rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
              <span className="text-4xl font-bold text-white">
                {workspaceName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </motion.div>

        {/* Project name */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="text-2xl font-semibold text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          {projectName}
        </motion.h1>

        {/* Client name */}
        {clientName && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="mt-1 text-base text-white/80"
          >
            {clientName}
          </motion.p>
        )}

        {/* Phase progress dots */}
        {phases && phases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
            className="mt-8 w-full max-w-sm"
          >
            <div className="relative flex items-center justify-between">
              {/* Connecting line */}
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-1/2 -z-0 h-px -translate-y-1/2 bg-white/25"
              />

              {phases.map((phase, i) => (
                <div
                  key={phase.label}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
                  {/* Dot */}
                  <span
                    aria-label={`${phase.label}: ${phase.complete ? "complete" : "upcoming"}`}
                    className={
                      phase.complete
                        ? "flex h-3 w-3 items-center justify-center rounded-full bg-white shadow-sm"
                        : "flex h-3 w-3 items-center justify-center rounded-full border-2 border-white/60 bg-transparent"
                    }
                  >
                    {phase.complete && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--portal-brand, #1D9E75)" }}
                      />
                    )}
                  </span>
                  {/* Label */}
                  <span
                    className={`text-xs font-medium ${
                      i === phases.length - 1
                        ? "text-white/50"
                        : phase.complete
                          ? "text-white"
                          : "text-white/70"
                    }`}
                  >
                    {phase.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Powered by ScopeIQ — hidden when workspace supplies a brandColor */}
        {!hidePoweredBy && !brandColor && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.3 }}
            className="mt-6 text-xs text-white/40"
          >
            Powered by ScopeIQ
          </motion.p>
        )}
      </motion.div>
    </header>
  );
}
