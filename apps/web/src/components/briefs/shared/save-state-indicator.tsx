"use client";

import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { type SaveState } from "@/lib/briefs";

interface SaveStateIndicatorProps {
  state: SaveState;
}

export function SaveStateIndicator({ state }: SaveStateIndicatorProps) {
  if (state === "idle") return null;

  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--text-muted))]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving
      </span>
    );
  }

  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-red">
      <AlertTriangle className="h-3.5 w-3.5" />
      Save failed
    </span>
  );
}

