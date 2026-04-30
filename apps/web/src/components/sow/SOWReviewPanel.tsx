"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConfidenceLevel = "high" | "medium" | "low";

export interface SowReviewClause {
  id: string;
  clause_type: string;
  content: string;
  confidence_score: number | null;
  confidence_level: ConfidenceLevel | null;
  raw_text_source: string | null;
  page_number: number | null;
  requires_human_review: boolean;
}

export interface SowReviewData {
  sow_id: string;
  overall_confidence: number | null;
  total_clauses: number;
  needs_review_count: number;
  clauses: SowReviewClause[];
}

interface SOWReviewPanelProps {
  data: SowReviewData;
  onAcceptAll?: (ids: string[]) => void;
  onEditClause?: (clause: SowReviewClause) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function confidencePercent(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}

function clauseTypePill(type: string) {
  const labels: Record<string, string> = {
    deliverable: "Deliverable",
    exclusion: "Exclusion",
    revision_limit: "Revisions",
    timeline: "Timeline",
    payment_term: "Payment",
    acceptance_criteria: "Acceptance",
    other: "Other",
  };
  return labels[type] ?? type;
}

// Row variant helpers — returns Tailwind class groups based on confidence state
type RowVariant = "review" | "medium" | "high" | "unknown";

function getRowVariant(clause: SowReviewClause): RowVariant {
  if (clause.requires_human_review) return "review";
  if (clause.confidence_level === "medium") return "medium";
  if (clause.confidence_level === "high") return "high";
  return "unknown";
}

const ROW_STYLES: Record<RowVariant, string> = {
  review: "border-l-4 border-red-500 bg-red-50",
  medium: "border-l-4 border-amber-400 bg-amber-50",
  high: "border-l-4 border-green-500 bg-green-50",
  unknown: "border-l-4 border-gray-300 bg-gray-50",
};

const BADGE_STYLES: Record<RowVariant, { label: string; cls: string }> = {
  review: {
    label: "Needs your review",
    cls: "bg-red-100 text-red-700 border border-red-300",
  },
  medium: {
    label: "Review before accepting",
    cls: "bg-amber-100 text-amber-700 border border-amber-300",
  },
  high: {
    label: "Verified",
    cls: "bg-green-100 text-green-700 border border-green-300",
  },
  unknown: {
    label: "Unscored",
    cls: "bg-gray-100 text-gray-600 border border-gray-300",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ClauseTypePill({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
      {clauseTypePill(type)}
    </span>
  );
}

function ConfidenceBadge({ variant }: { variant: RowVariant }) {
  const { label, cls } = BADGE_STYLES[variant];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function ClauseRow({
  clause,
  onEdit,
  onAccept,
  isAccepted,
}: {
  clause: SowReviewClause;
  onEdit?: (clause: SowReviewClause) => void;
  onAccept: (id: string) => void;
  isAccepted: boolean;
}) {
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const variant = getRowVariant(clause);

  return (
    <div
      className={`rounded-md p-4 transition-opacity ${ROW_STYLES[variant]} ${isAccepted ? "opacity-50" : ""}`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <ClauseTypePill type={clause.clause_type} />
          <ConfidenceBadge variant={variant} />
          {clause.confidence_score !== null && (
            <span className="text-xs text-slate-500">
              {confidencePercent(clause.confidence_score)} confidence
            </span>
          )}
          {clause.page_number !== null && (
            <span className="text-xs text-slate-400">p. {clause.page_number}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {variant === "review" && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(clause)}
              disabled={isAccepted}
              className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onAccept(clause.id)}
            disabled={isAccepted}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            {isAccepted ? "Accepted" : "Accept"}
          </button>
        </div>
      </div>

      {/* Clause content */}
      <p className="mt-2 text-sm text-slate-800 leading-relaxed">{clause.content}</p>

      {/* Source text toggle */}
      {clause.raw_text_source && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setSourceExpanded((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
          >
            {sourceExpanded ? "Hide source text" : "Show source text"}
          </button>
          {sourceExpanded && (
            <blockquote className="mt-1 rounded border-l-2 border-slate-300 bg-white/70 px-3 py-2 text-xs text-slate-600 italic leading-relaxed">
              {clause.raw_text_source}
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function SOWReviewPanel({ data, onAcceptAll, onEditClause }: SOWReviewPanelProps) {
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  const highConfidenceIds = data.clauses
    .filter((c) => c.confidence_level === "high" && !c.requires_human_review)
    .map((c) => c.id);

  function acceptClause(id: string) {
    setAcceptedIds((prev) => new Set(prev).add(id));
  }

  function handleAcceptAllHigh() {
    const newAccepted = new Set(acceptedIds);
    highConfidenceIds.forEach((id) => newAccepted.add(id));
    setAcceptedIds(newAccepted);
    onAcceptAll?.(highConfidenceIds);
  }

  const pendingReviewCount = data.clauses.filter(
    (c) => c.requires_human_review && !acceptedIds.has(c.id),
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">
            {data.total_clauses} clause{data.total_clauses !== 1 ? "s" : ""}
          </span>
          {data.needs_review_count > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-300">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {pendingReviewCount} need{pendingReviewCount !== 1 ? "" : "s"} review
            </span>
          )}
          {data.overall_confidence !== null && (
            <span className="text-xs text-slate-500">
              Overall confidence: {confidencePercent(data.overall_confidence)}
            </span>
          )}
        </div>

        {highConfidenceIds.length > 0 && (
          <button
            type="button"
            onClick={handleAcceptAllHigh}
            disabled={highConfidenceIds.every((id) => acceptedIds.has(id))}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Accept All High-Confidence ({highConfidenceIds.length})
          </button>
        )}
      </div>

      {/* Clause list */}
      <div className="flex flex-col gap-2">
        {data.clauses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            No clauses extracted yet.
          </div>
        ) : (
          data.clauses.map((clause) => (
            <ClauseRow
              key={clause.id}
              clause={clause}
              onEdit={onEditClause}
              onAccept={acceptClause}
              isAccepted={acceptedIds.has(clause.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
