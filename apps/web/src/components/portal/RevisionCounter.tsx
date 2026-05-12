"use client";

interface RevisionCounterProps {
  current: number;
  limit: number;
  className?: string;
}

function getColor(percent: number): string {
  if (percent <= 50) return "bg-green-500";
  if (percent <= 80) return "bg-amber-500";
  return "bg-red-500";
}

function getTextColor(percent: number): string {
  if (percent <= 50) return "text-green-700";
  if (percent <= 80) return "text-amber-700";
  return "text-red-700";
}

export function RevisionCounter({ current, limit, className }: RevisionCounterProps) {
  const percent = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const atLimit = current >= limit && limit > 0;

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
          Revision Rounds
        </span>
        <span className={`text-xs font-bold ${getTextColor(percent)}`}>
          {current} / {limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-subtle))]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {atLimit && (
        <p className="text-xs font-medium text-red-600">
          Revision limit reached. Additional rounds may be billable.
        </p>
      )}
    </div>
  );
}
