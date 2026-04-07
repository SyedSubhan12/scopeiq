"use client";

import { AlertTriangle, AlertCircle, Info, HelpCircle, CheckCircle } from "lucide-react";
import { Card } from "@novabots/ui";
import type { BriefFlag } from "@/lib/briefs";

interface BriefFlagCardProps {
  flag: BriefFlag;
  onOverride?: (flagId: string) => void;
  overriding?: boolean;
}

const severityConfig = {
  high: {
    Icon: AlertCircle,
    badge: "bg-red-100 text-red-800 border-red-200",
    iconClass: "text-status-red",
    label: "High",
  },
  medium: {
    Icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    iconClass: "text-status-amber",
    label: "Medium",
  },
  low: {
    Icon: Info,
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    iconClass: "text-blue-500",
    label: "Low",
  },
} as const;

export function BriefFlagCard({ flag, onOverride, overriding }: BriefFlagCardProps) {
  const config = severityConfig[flag.severity as keyof typeof severityConfig] ?? severityConfig.medium;
  const { Icon } = config;

  return (
    <Card className="flex items-start gap-3 p-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconClass}`} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.badge}`}
          >
            {config.label}
          </span>
        </div>
        <p className="text-sm text-[rgb(var(--text-primary))]">{flag.message}</p>
        {flag.suggestedQuestion && (
          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-[rgb(var(--surface-subtle))] p-2">
            <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--text-muted))]" />
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              <span className="font-medium">Suggested: </span>
              {flag.suggestedQuestion}
            </p>
          </div>
        )}
      </div>
      {onOverride && (
        <button
          onClick={() => onOverride(flag.id)}
          disabled={overriding}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))] disabled:opacity-50"
          title="Override this flag"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Override
        </button>
      )}
    </Card>
  );
}
