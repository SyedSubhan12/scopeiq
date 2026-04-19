"use client";

import { useEffect, useRef } from "react";
import { ClarityScoreRing } from "./ClarityScoreRing";

interface ScoreFlag {
  id: string;
  message: string;
  severity: "low" | "medium" | "high";
}

interface BriefScoreCardProps {
  score?: number | null | undefined;
  summary?: string | null | undefined;
  flags?: ScoreFlag[] | undefined;
  className?: string | undefined;
}

const SEVERITY_DOT: Record<ScoreFlag["severity"], string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-sky-400",
};

export function BriefScoreCard({ score, summary, flags = [], className }: BriefScoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !cardRef.current) return;

    import("gsap/dist/gsap").then(({ default: gsap }) => {
      const tl = gsap.timeline();
      tl.from(cardRef.current, {
        opacity: 0,
        y: 24,
        duration: 0.35,
        ease: "power2.out",
      });

      const items = listRef.current?.querySelectorAll("li");
      if (items && items.length > 0) {
        tl.from(
          items,
          {
            opacity: 0,
            x: -12,
            stagger: 0.06,
            duration: 0.25,
            ease: "power2.out",
          },
          "-=0.15",
        );
      }

      return () => tl.kill();
    });
  }, [score]);

  const displayScore = score ?? 0;

  return (
    <div
      ref={cardRef}
      className={`rounded-3xl border border-[rgb(var(--border-subtle))] bg-white p-5 ${className ?? ""}`}
    >
      <div className="flex items-start gap-5">
        <ClarityScoreRing score={displayScore} size={96} strokeWidth={8} />

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            Brief clarity score
          </h3>
          {summary ? (
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-secondary))]">{summary}</p>
          ) : (
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              {score == null ? "Score pending…" : "AI analysis complete."}
            </p>
          )}
        </div>
      </div>

      {flags.length > 0 && (
        <div className="mt-4 border-t border-[rgb(var(--border-subtle))] pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--text-muted))]">
            Ambiguity flags
          </p>
          <ul ref={listRef} className="space-y-1.5">
            {flags.map((flag) => (
              <li key={flag.id} className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[flag.severity]}`}
                />
                <span className="text-xs leading-5 text-[rgb(var(--text-secondary))]">
                  {flag.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
