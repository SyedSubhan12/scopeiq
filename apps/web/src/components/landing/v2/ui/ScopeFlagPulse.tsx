"use client";

import { AlertTriangle } from "lucide-react";

export function ScopeFlagPulse({
  message = "Out-of-scope request detected",
  sowClause = "Section 2.2 — Social media templates not included",
  confidence = 82,
}: {
  message?: string;
  sowClause?: string;
  confidence?: number;
}) {
  return (
    <div
      className="lv2-flag-pulse relative overflow-hidden rounded-xl border border-red-500/20 bg-[rgba(220,38,38,0.08)] p-5 shadow-[0_20px_60px_-20px_rgba(220,38,38,0.35)]"
      style={{ borderLeft: "4px solid #DC2626" }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-red-300">
            <span>Scope Flag · High Confidence</span>
          </div>
          <div className="mt-1 text-sm font-medium text-white/90">{message}</div>
          <div className="mt-3 rounded-md border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-white/70">
            {sowClause}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/50">
              <span>Confidence</span>
              <span className="font-mono">{confidence}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500 transition-[width] duration-1000 ease-out"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-md bg-red-500/90 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-500">
              Generate Change Order
            </button>
            <button className="rounded-md border border-white/15 px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/5">
              Mark In-Scope
            </button>
            <button className="rounded-md border border-white/15 px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/5">
              Snooze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
