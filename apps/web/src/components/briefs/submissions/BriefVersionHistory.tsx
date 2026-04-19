"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompareArrows } from "lucide-react";
import { Card, Skeleton } from "@novabots/ui";
import type { BriefVersionRecord } from "@/lib/briefs";

export interface BriefVersionHistoryProps {
  versions: BriefVersionRecord[];
  isLoading?: boolean;
}

type DiffToken = {
  word: string;
  type: "added" | "removed" | "unchanged";
};

/**
 * Simple LCS-based word-level diff.
 * Returns tokens tagged as added, removed, or unchanged.
 */
function diffWords(before: string, after: string): DiffToken[] {
  const aWords = before.split(/\s+/).filter(Boolean);
  const bWords = after.split(/\s+/).filter(Boolean);

  const m = aWords.length;
  const n = bWords.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aWords[i - 1] === bWords[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Trace back through LCS table
  const result: DiffToken[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aWords[i - 1] === bWords[j - 1]) {
      result.unshift({ word: aWords[i - 1]!, type: "unchanged" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      result.unshift({ word: bWords[j - 1]!, type: "added" });
      j--;
    } else {
      result.unshift({ word: aWords[i - 1]!, type: "removed" });
      i--;
    }
  }

  return result;
}

function DiffText({ tokens }: { tokens: DiffToken[] }) {
  return (
    <span className="whitespace-pre-wrap text-sm leading-7 text-[rgb(var(--text-secondary))]">
      <AnimatePresence mode="wait">
        {tokens.map((token, index) => {
          if (token.type === "unchanged") {
            return (
              <span key={index}>
                {token.word}{" "}
              </span>
            );
          }
          if (token.type === "added") {
            return (
              <motion.mark
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02, duration: 0.15 }}
                className="bg-green-100 text-green-800 rounded px-0.5 not-italic"
              >
                {token.word}{" "}
              </motion.mark>
            );
          }
          // removed
          return (
            <motion.mark
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02, duration: 0.15 }}
              className="bg-red-50 text-red-700 line-through rounded px-0.5 not-italic"
            >
              {token.word}{" "}
            </motion.mark>
          );
        })}
      </AnimatePresence>
    </span>
  );
}

interface DiffRow {
  fieldKey: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

export function BriefVersionHistory({ versions, isLoading }: BriefVersionHistoryProps) {
  const [selectedBaseVersionId, setSelectedBaseVersionId] = useState<string>("");
  const [selectedCompareVersionId, setSelectedCompareVersionId] = useState<string>("");

  const selectedBaseVersion =
    versions.find((v) => v.id === selectedBaseVersionId) ?? versions[0] ?? null;
  const selectedCompareVersion =
    versions.find((v) => v.id === selectedCompareVersionId) ?? versions[1] ?? null;

  const diffRows = useMemo<DiffRow[]>(() => {
    if (!selectedBaseVersion || !selectedCompareVersion) return [];

    const compareMap = new Map(
      selectedCompareVersion.answers.map((answer) => [answer.fieldKey, answer]),
    );

    return selectedBaseVersion.answers.map((baseAnswer) => {
      const compareAnswer = compareMap.get(baseAnswer.fieldKey);
      const before = baseAnswer.value ?? "—";
      const after = compareAnswer?.value ?? "—";
      return {
        fieldKey: baseAnswer.fieldKey,
        label: baseAnswer.fieldLabel,
        before,
        after,
        changed: before !== after,
      };
    });
  }, [selectedBaseVersion, selectedCompareVersion]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (versions.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-8 text-center text-sm text-[rgb(var(--text-muted))]">
        Version history will appear here after the brief is resubmitted. At least two versions
        are needed to compare.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Version selectors */}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
            Base version
          </label>
          <select
            className="h-11 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-white px-3 text-sm outline-none transition-colors focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
            value={selectedBaseVersion?.id ?? ""}
            onChange={(event) => setSelectedBaseVersionId(event.target.value)}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber} &middot;{" "}
                {new Date(version.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
            Compare with
          </label>
          <select
            className="h-11 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-white px-3 text-sm outline-none transition-colors focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
            value={selectedCompareVersion?.id ?? ""}
            onChange={(event) => setSelectedCompareVersionId(event.target.value)}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.versionNumber} &middot;{" "}
                {new Date(version.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[rgb(var(--text-muted))]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-green-100" />
          Added
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-50" />
          Removed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-[rgb(var(--surface-subtle))]" />
          Unchanged
        </span>
      </div>

      {/* Field-by-field diff */}
      {diffRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-4 py-6 text-sm text-[rgb(var(--text-muted))]">
          Select two different versions above to see a field-by-field comparison.
        </div>
      ) : (
        <div className="space-y-3">
          {diffRows.map((row) => {
            const tokens = diffWords(row.before, row.after);
            return (
              <div
                key={row.fieldKey}
                className={`rounded-2xl border px-4 py-4 ${
                  row.changed
                    ? "border-primary/20 bg-primary/5"
                    : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {row.label}
                  </p>
                  {row.changed && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Changed
                    </span>
                  )}
                </div>

                {row.changed ? (
                  /* Show inline diff */
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                        Before
                      </p>
                      <div className="rounded-xl bg-white px-3 py-3 text-sm leading-7 text-[rgb(var(--text-secondary))]">
                        <DiffText tokens={tokens.filter((t) => t.type !== "added")} />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                        After
                      </p>
                      <div className="rounded-xl bg-white px-3 py-3 text-sm leading-7 text-[rgb(var(--text-secondary))]">
                        <DiffText tokens={tokens.filter((t) => t.type !== "removed")} />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Unchanged — show once */
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[rgb(var(--text-secondary))]">
                    {row.before}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
